// Transaction Handler for Bulk Operations
import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logging/winston-logger'
// Dynamic crypto import for Edge Runtime compatibility
let crypto: any
if (typeof window === 'undefined') {
  try {
    crypto = require('crypto')
  } catch (e) {
    crypto = null
  }
}

export interface TransactionOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rollbackPerformed?: boolean
  retriesUsed?: number
}

export class BulkTransactionHandler {
  private activeTransactions = new Set<string>()

  private async getSupabaseClient() {
    return await createClient()
  }

  /**
   * Execute a bulk operation within a transaction with automatic rollback
   */
  async executeTransaction<T>(
    transactionId: string,
    operation: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 300000 // 5 minutes
    } = options

    let retriesUsed = 0
    const startTime = Date.now()

    // Check if transaction is already active
    if (this.activeTransactions.has(transactionId)) {
      return {
        success: false,
        error: 'Transaction already in progress',
        retriesUsed: 0
      }
    }

    this.activeTransactions.add(transactionId)

    try {
      while (retriesUsed <= maxRetries) {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Transaction timeout exceeded')
        }

        try {
          // Begin transaction
          logger.info('Beginning bulk transaction', { 
            transactionId, 
            attempt: retriesUsed + 1 
          })

          // Execute the operation
          const result = await this.executeWithRollback(operation)

          logger.info('Bulk transaction completed successfully', { 
            transactionId,
            retriesUsed,
            duration: Date.now() - startTime
          })

          return {
            success: true,
            data: result,
            retriesUsed
          }

        } catch (error) {
          retriesUsed++
          
          logger.warn('Bulk transaction attempt failed', {
            transactionId,
            attempt: retriesUsed,
            error: error instanceof Error ? error.message : 'Unknown error',
            willRetry: retriesUsed <= maxRetries
          })

          // If this was the last retry, don't wait
          if (retriesUsed <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * retriesUsed))
          } else {
            throw error
          }
        }
      }

      throw new Error('Maximum retries exceeded')

    } catch (error) {
      logger.error('Bulk transaction failed permanently', {
        transactionId,
        retriesUsed,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retriesUsed,
        rollbackPerformed: true
      }

    } finally {
      this.activeTransactions.delete(transactionId)
    }
  }

  /**
   * Execute operation with automatic rollback on failure
   * Uses parameterized queries to prevent SQL injection
   */
  private async executeWithRollback<T>(operation: () => Promise<T>): Promise<T> {
    // Create a sanitized savepoint name with only alphanumeric characters
    const timestamp = Date.now()
    const randomId = crypto.randomBytes(8).toString('hex')
    const savepointName = `sp_${timestamp}_${randomId}`.replace(/[^a-zA-Z0-9_]/g, '')
    
    // Validate savepoint name length
    if (savepointName.length > 63) {
      throw new Error('Generated savepoint name too long')
    }
    
    const supabase = await this.getSupabaseClient()
    
    try {
      // Begin transaction with parameterized savepoint
      // Using RPC with proper parameter binding prevents SQL injection
      await supabase.rpc('begin_transaction_with_savepoint', { 
        savepoint_name: savepointName 
      })

      // Execute the operation
      const result = await operation()

      // Commit transaction using parameterized query
      await supabase.rpc('commit_transaction')

      return result

    } catch (error) {
      // Rollback to savepoint with parameterized query
      try {
        await supabase.rpc('rollback_to_savepoint', { 
          savepoint_name: savepointName 
        })
        logger.info('Successfully rolled back transaction', { 
          savepointName: savepointName.substring(0, 10) // Log only partial name
        })
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', {
          savepointName: savepointName.substring(0, 10),
          rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Unknown error'
        })
      }

      throw error
    }
  }

  /**
   * Execute multiple operations in parallel with individual transaction handling
   */
  async executeBatch<T>(
    transactionId: string,
    operations: Array<{
      id: string
      operation: () => Promise<T>
    }>,
    options: TransactionOptions & {
      continueOnError?: boolean
      maxConcurrency?: number
    } = {}
  ): Promise<{
    successful: Array<{ id: string; result: T }>
    failed: Array<{ id: string; error: string }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }> {
    const {
      continueOnError = true,
      maxConcurrency = 5
    } = options

    const successful: Array<{ id: string; result: T }> = []
    const failed: Array<{ id: string; error: string }> = []
    
    // Process operations in batches to control concurrency
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency)
      
      const batchPromises = batch.map(async ({ id, operation }) => {
        try {
          const result = await this.executeTransaction(
            `${transactionId}_${id}`,
            operation,
            options
          )

          if (result.success) {
            successful.push({ id, result: result.data! })
          } else {
            failed.push({ id, error: result.error || 'Unknown error' })
            if (!continueOnError) {
              throw new Error(`Operation ${id} failed: ${result.error}`)
            }
          }
        } catch (error) {
          failed.push({ 
            id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          
          if (!continueOnError) {
            throw error
          }
        }
      })

      // Wait for current batch to complete
      await Promise.all(batchPromises)
    }

    return {
      successful,
      failed,
      summary: {
        total: operations.length,
        successful: successful.length,
        failed: failed.length
      }
    }
  }

  /**
   * Check if a transaction is currently active
   */
  isTransactionActive(transactionId: string): boolean {
    return this.activeTransactions.has(transactionId)
  }

  /**
   * Get all active transaction IDs
   */
  getActiveTransactions(): string[] {
    return Array.from(this.activeTransactions)
  }

  /**
   * Force cancel an active transaction (use with caution)
   */
  async forceCancel(transactionId: string): Promise<void> {
    if (this.activeTransactions.has(transactionId)) {
      this.activeTransactions.delete(transactionId)
      
      // Attempt to rollback any open transactions
      try {
        const supabase = await this.getSupabaseClient()
        await supabase.rpc('rollback_transaction')
      } catch (error) {
        logger.warn('Failed to rollback during force cancel', {
          transactionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      logger.info('Force cancelled transaction', { transactionId })
    }
  }
}

// Singleton instance
export const transactionHandler = new BulkTransactionHandler()

// Utility function for creating database functions with SQL injection prevention
export const createTransactionFunctions = async () => {
  const supabase = await createClient()
  
  const functions = [
    // Begin transaction with savepoint - uses quote_ident for safe identifier quoting
    `
    CREATE OR REPLACE FUNCTION begin_transaction_with_savepoint(savepoint_name TEXT)
    RETURNS VOID AS $$
    BEGIN
      -- Validate savepoint name to prevent SQL injection
      IF savepoint_name !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid savepoint name: %', savepoint_name;
      END IF;
      
      IF LENGTH(savepoint_name) > 63 THEN
        RAISE EXCEPTION 'Savepoint name too long: %', savepoint_name;
      END IF;
      
      -- Use quote_ident to safely escape the identifier
      EXECUTE 'SAVEPOINT ' || quote_ident(savepoint_name);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
    
    // Rollback to savepoint with validation
    `
    CREATE OR REPLACE FUNCTION rollback_to_savepoint(savepoint_name TEXT)
    RETURNS VOID AS $$
    BEGIN
      -- Validate savepoint name to prevent SQL injection
      IF savepoint_name !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid savepoint name: %', savepoint_name;
      END IF;
      
      IF LENGTH(savepoint_name) > 63 THEN
        RAISE EXCEPTION 'Savepoint name too long: %', savepoint_name;
      END IF;
      
      -- Use quote_ident to safely escape the identifier
      EXECUTE 'ROLLBACK TO SAVEPOINT ' || quote_ident(savepoint_name);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
    
    // Begin transaction
    `
    CREATE OR REPLACE FUNCTION begin_transaction()
    RETURNS VOID AS $$
    BEGIN
      -- Transaction is automatically started
      NULL;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Commit transaction
    `
    CREATE OR REPLACE FUNCTION commit_transaction()
    RETURNS VOID AS $$
    BEGIN
      -- Commit happens automatically at end of function
      NULL;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Rollback transaction
    `
    CREATE OR REPLACE FUNCTION rollback_transaction()
    RETURNS VOID AS $$
    BEGIN
      RAISE EXCEPTION 'Transaction rolled back';
    END;
    $$ LANGUAGE plpgsql;
    `
  ]
  
  // Note: These functions should be created via migration scripts, not runtime execution
  // This prevents unauthorized SQL execution in production
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_SQL_EXECUTION === 'true') {
    for (const func of functions) {
      try {
        // Only execute in development with explicit permission
        await supabase.rpc('execute_sql', { sql: func })
      } catch (error) {
        logger.error('Failed to create transaction function', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  } else {
    logger.info('Transaction functions should be created via database migrations')
  }
}