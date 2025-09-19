/**
 * Comprehensive Transaction Rollback Examples
 * Demonstrates how to use the enhanced transaction system for various scenarios
 */

import { SupabaseClient } from '@supabase/supabase-js'
import DatabaseTransactionManager, {
  TransactionExecutionContext,
  TransactionIsolationLevel
} from '../transaction-manager'
import TransactionalBulkOperationsManager, {
  TransactionalBulkConfig,
  BulkRollbackStrategy,
  BulkErrorAction,
  BulkOperationError
} from '../bulk-operations-transactional'
import { BaseDAL } from '../base'
import { 
  DataAccessContext, 
  AdminRole, 
  DataClassification,
  BlogPostCreate,
  BlogPostUpdate,
  BlogPost
} from '../types'
import { logger } from '@/lib/logger'

// ================================
// Example 1: Basic Transaction with Rollback
// ================================

export async function basicTransactionExample(supabase: SupabaseClient) {
  const transactionManager = new DatabaseTransactionManager(supabase)
  
  const userContext: DataAccessContext = {
    userId: 'admin-user-123',
    role: AdminRole.ADMIN,
    permissions: ['read', 'write', 'delete'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: false,
      complianceLevel: 'basic',
      auditRequired: false,
      encryptionRequired: false
    },
    auditRequired: true
  }

  console.log('🔄 Starting basic transaction example...')

  const result = await transactionManager.executeTransaction(
    async (txContext: TransactionExecutionContext) => {
      console.log('📝 Creating user...')
      
      // Simulate user creation
      txContext.recordOperation({
        type: 'INSERT',
        table: 'users',
        data: { email: 'newuser@example.com', name: 'New User' },
        affectedRows: 1,
        duration: 50
      })

      console.log('📧 Sending welcome email...')
      
      // Simulate email sending that might fail
      const emailSent = await simulateEmailService('newuser@example.com')
      if (!emailSent) {
        throw new Error('Failed to send welcome email')
      }

      console.log('✅ User created and email sent successfully')
      return { userId: 'user-123', emailSent: true }
    },
    {
      isolationLevel: 'READ_COMMITTED',
      timeout: 30000,
      retryCount: 3
    },
    userContext
  )

  if (result.success) {
    console.log(`✅ Transaction completed successfully in ${result.duration}ms`)
    console.log(`📊 Operations executed: ${result.operationsExecuted}`)
    console.log(`🔄 Deadlock retries: ${result.deadlockRetries}`)
  } else {
    console.log(`❌ Transaction failed: ${result.error}`)
    console.log(`🔙 Rollback performed: ${result.rollbackPerformed}`)
    console.log(`📝 Rollback reason: ${result.rollbackReason}`)
  }

  return result
}

// ================================
// Example 2: Savepoint Management
// ================================

export async function savepointExample(supabase: SupabaseClient) {
  const transactionManager = new DatabaseTransactionManager(supabase)
  
  const userContext: DataAccessContext = {
    userId: 'admin-user-456',
    role: AdminRole.EDITOR,
    permissions: ['read', 'write'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: false,
      complianceLevel: 'basic',
      auditRequired: false,
      encryptionRequired: false
    },
    auditRequired: true
  }

  console.log('🔄 Starting savepoint management example...')

  const result = await transactionManager.executeTransaction(
    async (txContext: TransactionExecutionContext) => {
      const results = []

      // Phase 1: Create blog post
      console.log('📝 Phase 1: Creating blog post...')
      
      const blogPost = {
        title: 'Understanding Healthcare Technology',
        content: 'This is a comprehensive guide...',
        author_id: userContext.userId
      }
      
      txContext.recordOperation({
        type: 'INSERT',
        table: 'blog_posts',
        data: blogPost,
        affectedRows: 1,
        duration: 25
      })
      
      results.push('blog_post_created')

      // Create savepoint before risky operations
      console.log('💾 Creating savepoint before image processing...')
      const savepointResult = await txContext.createSavepoint('before_images')
      if (!savepointResult.success) {
        throw new Error('Failed to create savepoint')
      }

      // Phase 2: Process and upload images (potentially failing operation)
      console.log('🖼️ Phase 2: Processing images...')
      
      try {
        const images = ['hero.jpg', 'diagram1.png', 'chart.svg']
        for (const image of images) {
          const processed = await simulateImageProcessing(image)
          if (!processed) {
            throw new Error(`Failed to process image: ${image}`)
          }
          
          txContext.recordOperation({
            type: 'INSERT',
            table: 'blog_images',
            data: { blog_post_id: 'post-123', image_url: `processed_${image}` },
            affectedRows: 1,
            duration: 100
          })
        }
        
        results.push('images_processed')
        console.log('✅ Images processed successfully')

      } catch (error) {
        console.log(`⚠️ Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log('🔙 Rolling back to savepoint...')
        
        const rollbackResult = await txContext.rollbackToSavepoint(
          'before_images',
          'Image processing failed'
        )
        
        if (rollbackResult.success) {
          console.log(`✅ Rolled back ${rollbackResult.affectedOperations} operations`)
          results.push('images_skipped_due_to_error')
        } else {
          throw new Error('Savepoint rollback failed')
        }
      }

      // Phase 3: Publish blog post (continues regardless of image issues)
      console.log('📢 Phase 3: Publishing blog post...')
      
      txContext.recordOperation({
        type: 'UPDATE',
        table: 'blog_posts',
        data: { id: 'post-123', status: 'published', published_at: new Date() },
        affectedRows: 1,
        duration: 15
      })
      
      results.push('blog_post_published')
      
      console.log('✅ Blog post published successfully')
      return results
    },
    {
      isolationLevel: 'REPEATABLE_READ',
      timeout: 60000
    },
    userContext
  )

  if (result.success) {
    console.log(`✅ Savepoint transaction completed: ${JSON.stringify(result.data)}`)
    console.log(`⏱️ Duration: ${result.duration}ms`)
  } else {
    console.log(`❌ Savepoint transaction failed: ${result.error}`)
  }

  return result
}

// ================================
// Example 3: Bulk Operations with Comprehensive Rollback
// ================================

export async function bulkOperationsExample(supabase: SupabaseClient) {
  const bulkManager = new TransactionalBulkOperationsManager(supabase)
  
  const userContext: DataAccessContext = {
    userId: 'bulk-admin-789',
    role: AdminRole.ADMIN,
    permissions: ['read', 'write', 'delete'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: false,
      complianceLevel: 'basic',
      auditRequired: false,
      encryptionRequired: false
    },
    auditRequired: true
  }

  console.log('🔄 Starting bulk operations example...')

  // Generate test data
  const blogPosts = Array.from({ length: 50 }, (_, i) => ({
    title: `Healthcare Innovation Article ${i + 1}`,
    slug: `healthcare-innovation-${i + 1}`,
    content: `This is the content for article ${i + 1} about healthcare innovations...`,
    author_id: userContext.userId,
    category_ids: ['health-tech', 'innovation'],
    tags: ['healthcare', 'technology', 'innovation'],
    status: 'draft' as const
  }))

  const bulkConfig: TransactionalBulkConfig = {
    tableName: 'blog_posts',
    operation: 'insert',
    data: blogPosts,
    batchSize: 10, // Process 10 posts per batch
    enableSavepoints: true,
    savepointFrequency: 3, // Create savepoint every 3 batches
    rollbackStrategy: BulkRollbackStrategy.SAVEPOINT_LEVEL,
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    timeout: 120000, // 2 minutes
    continueOnError: true,
    maxErrors: 5,
    errorThreshold: 10, // Abort if more than 10% fail
    
    // Integrity checks
    integrityChecks: [
      {
        type: 'unique',
        constraint: 'blog_posts_slug_key',
        onViolation: 'abort'
      },
      {
        type: 'foreign_key',
        constraint: 'blog_posts_author_id_fkey',
        onViolation: 'abort'
      }
    ],
    
    // Progress tracking
    progressCallback: (progress) => {
      console.log(`📊 Progress: ${progress.processed}/${progress.total} (${progress.percentage.toFixed(1)}%)`)
      console.log(`✅ Succeeded: ${progress.succeeded}, ❌ Failed: ${progress.failed}, ⏭️ Skipped: ${progress.skipped}`)
      console.log(`💾 Savepoints: ${progress.savepointsCreated}, 🔄 Rollbacks: ${progress.rollbacksPerformed}`)
      
      if (progress.errors.length > 0) {
        console.log(`🚨 Recent errors: ${progress.errors.slice(-3).map(e => e.message).join(', ')}`)
      }
    },
    
    // Error handling
    errorHandler: async (error: BulkOperationError, context) => {
      console.log(`🚨 Bulk operation error in batch ${context.batchIndex}:`)
      console.log(`   Type: ${error.type}`)
      console.log(`   Message: ${error.message}`)
      console.log(`   Severity: ${error.severity}`)
      console.log(`   Recoverable: ${error.recoverable}`)
      
      // Decision logic for error handling
      if (error.severity === 'critical') {
        console.log('💥 Critical error detected - aborting operation')
        return BulkErrorAction.ABORT_OPERATION
      }
      
      if (error.type === 'CONSTRAINT_VIOLATION' && error.recoverable) {
        console.log('🔄 Constraint violation detected - rolling back to savepoint')
        return BulkErrorAction.ROLLBACK_TO_SAVEPOINT
      }
      
      if (error.severity === 'low' || error.severity === 'medium') {
        console.log('⏭️ Minor error - skipping item and continuing')
        return BulkErrorAction.SKIP_ITEM
      }
      
      console.log('🛑 Error requires batch rollback')
      return BulkErrorAction.ROLLBACK_BATCH
    },
    
    // Data validation
    validateFn: async (item) => {
      // Custom validation logic
      if (!item.title || item.title.length < 10) {
        console.log(`❌ Validation failed: Title too short for "${item.title}"`)
        return false
      }
      
      if (!item.slug || !/^[a-z0-9-]+$/.test(item.slug)) {
        console.log(`❌ Validation failed: Invalid slug "${item.slug}"`)
        return false
      }
      
      return true
    },
    
    // Data transformation
    transformFn: async (item) => {
      // Add metadata and clean data
      return {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0,
        read_time_minutes: Math.ceil(item.content.length / 200), // Estimate reading time
        meta_description: item.content.substring(0, 155) + '...'
      }
    }
  }

  const result = await bulkManager.executeBulkTransactional(bulkConfig, userContext)

  // Report results
  console.log('\n📊 Bulk Operation Results:')
  console.log(`🆔 Transaction ID: ${result.transactionId}`)
  console.log(`✅ Success: ${result.success}`)
  console.log(`📝 Processed: ${result.processed}`)
  console.log(`✅ Succeeded: ${result.succeeded}`)
  console.log(`❌ Failed: ${result.failed}`)
  console.log(`⏭️ Skipped: ${result.skipped}`)
  console.log(`⏱️ Duration: ${result.duration}ms`)
  console.log(`🔙 Rollback performed: ${result.rollbackPerformed}`)
  
  if (result.rollbackReason) {
    console.log(`📝 Rollback reason: ${result.rollbackReason}`)
  }
  
  console.log(`💾 Savepoints used: ${result.savepointsUsed}`)
  console.log(`🚨 Total errors: ${result.errors.length}`)
  
  // Performance metrics
  console.log('\n⚡ Performance Metrics:')
  const metrics = result.performanceMetrics
  console.log(`📈 Operations/sec: ${metrics.operationsPerSecond.toFixed(2)}`)
  console.log(`📊 Rows/sec: ${metrics.rowsPerSecond.toFixed(2)}`)
  console.log(`🏠 Memory peak: ${(metrics.memoryPeakUsage / 1024 / 1024).toFixed(2)} MB`)
  console.log(`🔐 Deadlocks: ${metrics.deadlockCount}`)
  console.log(`🔗 Connections used: ${metrics.connectionsUsed}`)
  
  // Error analysis
  if (result.errors.length > 0) {
    console.log('\n🚨 Error Analysis:')
    const errorsByType = result.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(errorsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })
    
    console.log('\nTop 5 Errors:')
    result.errors.slice(0, 5).forEach((error, i) => {
      console.log(`   ${i + 1}. [${error.type}] ${error.message}`)
    })
  }
  
  // Recovery suggestions
  if (result.recoveryData?.suggestedActions.length) {
    console.log('\n🔧 Recovery Suggestions:')
    result.recoveryData.suggestedActions.forEach((action, i) => {
      console.log(`   ${i + 1}. ${action.type}: ${action.description}`)
      console.log(`      Risk: ${action.riskLevel}, Automated: ${action.automated}`)
      if (action.estimatedTime) {
        console.log(`      Estimated time: ${action.estimatedTime}ms`)
      }
    })
  }

  return result
}

// ================================
// Example 4: Complex Multi-Table Transaction
// ================================

export async function complexTransactionExample(supabase: SupabaseClient) {
  const transactionManager = new DatabaseTransactionManager(supabase)
  
  const userContext: DataAccessContext = {
    userId: 'complex-admin-999',
    role: AdminRole.SUPER_ADMIN,
    permissions: ['read', 'write', 'delete', 'admin'],
    classification: DataClassification.CONFIDENTIAL,
    hipaaContext: {
      isHealthcareData: true,
      complianceLevel: 'strict',
      auditRequired: true,
      encryptionRequired: true
    },
    auditRequired: true
  }

  console.log('🔄 Starting complex multi-table transaction example...')

  const result = await transactionManager.executeTransaction(
    async (txContext: TransactionExecutionContext) => {
      const operationResults = []

      // Create savepoints for different phases
      console.log('💾 Creating savepoints for transaction phases...')
      await txContext.createSavepoint('before_user_ops')
      await txContext.createSavepoint('before_content_ops')
      await txContext.createSavepoint('before_audit_ops')

      try {
        // Phase 1: User Management Operations
        console.log('👥 Phase 1: User management operations...')
        
        const newUsers = [
          { email: 'doctor1@hospital.com', role: 'doctor', department: 'cardiology' },
          { email: 'nurse1@hospital.com', role: 'nurse', department: 'cardiology' },
          { email: 'admin1@hospital.com', role: 'admin', department: 'administration' }
        ]
        
        for (const user of newUsers) {
          txContext.recordOperation({
            type: 'INSERT',
            table: 'users',
            data: user,
            affectedRows: 1,
            duration: 30
          })
        }
        
        operationResults.push(`Created ${newUsers.length} users`)

        // Phase 2: Content Operations
        console.log('📄 Phase 2: Content operations...')
        
        const contentItems = [
          { type: 'patient_guide', title: 'Cardiology Patient Guide', department: 'cardiology' },
          { type: 'protocol', title: 'Emergency Response Protocol', department: 'emergency' },
          { type: 'training', title: 'HIPAA Compliance Training', department: 'administration' }
        ]
        
        for (const content of contentItems) {
          // Simulate potential constraint violation
          if (content.title.includes('Emergency') && Math.random() < 0.7) {
            console.log('⚠️ Emergency protocol creation failed - rolling back content operations')
            
            const rollbackResult = await txContext.rollbackToSavepoint(
              'before_content_ops',
              'Emergency protocol validation failed'
            )
            
            if (rollbackResult.success) {
              console.log(`✅ Content operations rolled back successfully`)
              operationResults.push('Content operations rolled back due to validation failure')
              break // Skip remaining content items
            }
          } else {
            txContext.recordOperation({
              type: 'INSERT',
              table: 'content_items',
              data: content,
              affectedRows: 1,
              duration: 45
            })
          }
        }

        // Phase 3: Audit and Compliance Operations
        console.log('📋 Phase 3: Audit and compliance operations...')
        
        const auditEntries = [
          { action: 'user_batch_created', details: { count: newUsers.length } },
          { action: 'content_batch_processed', details: { types: ['patient_guide', 'protocol', 'training'] } },
          { action: 'compliance_check_completed', details: { status: 'passed' } }
        ]
        
        for (const audit of auditEntries) {
          txContext.recordOperation({
            type: 'INSERT',
            table: 'audit_logs',
            data: {
              ...audit,
              user_id: userContext.userId,
              timestamp: new Date(),
              classification: userContext.classification
            },
            affectedRows: 1,
            duration: 20
          })
        }
        
        operationResults.push(`Created ${auditEntries.length} audit entries`)

        // Final validation
        console.log('✅ Performing final compliance validation...')
        
        const complianceCheck = await simulateComplianceValidation(operationResults)
        if (!complianceCheck.passed) {
          throw new Error(`Compliance validation failed: ${complianceCheck.reason}`)
        }
        
        operationResults.push('Compliance validation passed')
        
        console.log('✅ All phases completed successfully')
        return {
          phases_completed: 3,
          operations: operationResults,
          compliance_status: 'validated',
          total_records_created: newUsers.length + contentItems.length + auditEntries.length
        }

      } catch (error) {
        console.log(`❌ Transaction failed in complex operations: ${error instanceof Error ? error.message : 'Unknown error'}`)
        throw error
      }
    },
    {
      isolationLevel: 'SERIALIZABLE', // Highest isolation for healthcare data
      timeout: 180000, // 3 minutes for complex operations
      retryCount: 2
    },
    userContext
  )

  if (result.success) {
    console.log('✅ Complex transaction completed successfully!')
    console.log(`📊 Transaction summary:`)
    console.log(`   - Operations executed: ${result.operationsExecuted}`)
    console.log(`   - Duration: ${result.duration}ms`)
    console.log(`   - Phases completed: ${result.data?.phases_completed}`)
    console.log(`   - Records created: ${result.data?.total_records_created}`)
    console.log(`   - Compliance status: ${result.data?.compliance_status}`)
  } else {
    console.log('❌ Complex transaction failed!')
    console.log(`   - Error: ${result.error}`)
    console.log(`   - Rollback performed: ${result.rollbackPerformed}`)
    console.log(`   - Operations before failure: ${result.operationsExecuted}`)
  }

  return result
}

// ================================
// Example 5: Using Enhanced BaseDAL
// ================================

class BlogPostDAL extends BaseDAL<BlogPost, BlogPostCreate, BlogPostUpdate> {
  constructor(supabase: SupabaseClient) {
    super(
      supabase,
      'blog_posts',
      ['title', 'content', 'tags'], // searchable columns
      true, // requires audit
      DataClassification.INTERNAL,
      true // enable versioning
    )
  }

  protected getCreateSchema() {
    // Return your Zod schema for BlogPostCreate
    return {} as any // Simplified for example
  }

  protected getUpdateSchema() {
    // Return your Zod schema for BlogPostUpdate  
    return {} as any // Simplified for example
  }

  protected transformForSave(data: any, context?: DataAccessContext) {
    return data
  }

  protected transformFromDatabase(data: any) {
    return data as BlogPost
  }
}

export async function enhancedDALExample(supabase: SupabaseClient) {
  const blogDAL = new BlogPostDAL(supabase)
  
  const userContext: DataAccessContext = {
    userId: 'dal-user-456',
    role: AdminRole.EDITOR,
    permissions: ['read', 'write'],
    classification: DataClassification.INTERNAL,
    hipaaContext: {
      isHealthcareData: false,
      complianceLevel: 'basic',
      auditRequired: false,
      encryptionRequired: false
    },
    auditRequired: true
  }

  // Set context for all operations
  blogDAL.setContext(userContext)

  console.log('🔄 Starting enhanced DAL transaction example...')

  // Example: Transactional batch create with enhanced error handling
  const blogPosts: BlogPostCreate[] = [
    {
      title: 'AI in Healthcare: Current Applications',
      slug: 'ai-healthcare-applications',
      content: 'Artificial Intelligence is revolutionizing healthcare...',
      author_id: userContext.userId,
      category_ids: ['ai', 'healthcare'],
      tags: ['AI', 'healthcare', 'technology'],
      status: 'draft' as const
    },
    {
      title: 'Telemedicine: The Future of Patient Care',
      slug: 'telemedicine-future-patient-care',
      content: 'Telemedicine has transformed how we deliver healthcare...',
      author_id: userContext.userId,
      category_ids: ['telemedicine', 'patient-care'],
      tags: ['telemedicine', 'digital-health', 'patient-care'],
      status: 'draft' as const
    },
    {
      title: 'Healthcare Data Analytics: Insights and Opportunities',
      slug: 'healthcare-data-analytics-insights',
      content: 'Data analytics is providing unprecedented insights...',
      author_id: userContext.userId,
      category_ids: ['data-analytics', 'healthcare'],
      tags: ['data-analytics', 'healthcare', 'insights'],
      status: 'draft' as const
    }
  ]

  // Batch create with enhanced transaction support
  const batchResult = await blogDAL.createBatch(blogPosts, {
    batchSize: 2,
    enableSavepoints: true,
    rollbackStrategy: 'SAVEPOINT_LEVEL' as any,
    continueOnError: false,
    errorThreshold: 0, // Strict - no errors allowed
    timeout: 60000,
    progressCallback: (progress) => {
      console.log(`📊 DAL Progress: ${progress.processed}/${progress.total} posts processed`)
    }
  })

  if (batchResult.data) {
    console.log(`✅ Successfully created ${batchResult.data.length} blog posts`)
    
    // Example: Transactional batch update
    const updates = batchResult.data.map(post => ({
      id: post.id,
      status: 'published' as const,
      published_at: new Date().toISOString()
    }))

    const updateResult = await blogDAL.updateBatch(updates, {
      batchSize: 3,
      enableSavepoints: true,
      rollbackStrategy: 'BATCH_LEVEL' as any
    })

    if (updateResult.data) {
      console.log(`✅ Successfully published ${updateResult.data.length} blog posts`)
    } else {
      console.log(`❌ Failed to publish posts: ${updateResult.error}`)
    }

  } else {
    console.log(`❌ Failed to create blog posts: ${batchResult.error}`)
  }

  // Example: Using complex transaction with savepoints
  const complexResult = await blogDAL.executeWithSavepoints(
    async (txContext) => {
      console.log('📝 Creating blog post with complex workflow...')
      
      // Create post
      const post = await simulatePostCreation()
      
      // Process images with savepoint protection
      try {
        const images = await simulateImageProcessing('complex-post-images')
        if (!images) {
          throw new Error('Image processing failed')
        }
        return { post, images, status: 'completed' }
      } catch (error) {
        // Rollback to savepoint and continue with just text
        await txContext.rollbackToSavepoint('before_images', 'Image processing failed')
        return { post, images: null, status: 'text_only' }
      }
    },
    ['before_images', 'before_publishing'], // Savepoint names
    {
      isolationLevel: 'REPEATABLE_READ',
      timeout: 90000
    }
  )

  if (complexResult.data) {
    console.log(`✅ Complex workflow completed: ${complexResult.data.status}`)
  } else {
    console.log(`❌ Complex workflow failed: ${complexResult.error}`)
  }

  return { batchResult, complexResult }
}

// ================================
// Utility Functions for Examples
// ================================

async function simulateEmailService(email: string): Promise<boolean> {
  // Simulate email service that might fail
  await new Promise(resolve => setTimeout(resolve, 100))
  return Math.random() > 0.2 // 80% success rate
}

async function simulateImageProcessing(imageName: string): Promise<boolean> {
  // Simulate image processing that might fail
  await new Promise(resolve => setTimeout(resolve, 200))
  return !imageName.includes('complex') || Math.random() > 0.3 // Complex images fail more often
}

async function simulateComplianceValidation(operations: string[]): Promise<{ passed: boolean; reason?: string }> {
  // Simulate compliance validation
  await new Promise(resolve => setTimeout(resolve, 50))
  
  if (operations.some(op => op.includes('Emergency'))) {
    return { passed: false, reason: 'Emergency protocols require additional approval' }
  }
  
  return { passed: true }
}

async function simulatePostCreation(): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return { id: 'post-123', title: 'Complex Post', status: 'draft' }
}

// ================================
// Main Example Runner
// ================================

export async function runAllTransactionExamples(supabase: SupabaseClient) {
  console.log('🚀 Running all transaction rollback examples...\n')

  try {
    // Example 1: Basic transaction
    console.log('=' .repeat(60))
    console.log('Example 1: Basic Transaction with Rollback')
    console.log('=' .repeat(60))
    await basicTransactionExample(supabase)
    
    // Example 2: Savepoint management
    console.log('\n' + '=' .repeat(60))
    console.log('Example 2: Savepoint Management')
    console.log('=' .repeat(60))
    await savepointExample(supabase)
    
    // Example 3: Bulk operations
    console.log('\n' + '=' .repeat(60))
    console.log('Example 3: Bulk Operations with Rollback')
    console.log('=' .repeat(60))
    await bulkOperationsExample(supabase)
    
    // Example 4: Complex multi-table transaction
    console.log('\n' + '=' .repeat(60))
    console.log('Example 4: Complex Multi-Table Transaction')
    console.log('=' .repeat(60))
    await complexTransactionExample(supabase)
    
    // Example 5: Enhanced BaseDAL
    console.log('\n' + '=' .repeat(60))
    console.log('Example 5: Enhanced BaseDAL with Transactions')
    console.log('=' .repeat(60))
    await enhancedDALExample(supabase)
    
    console.log('\n🎉 All examples completed successfully!')

  } catch (error) {
    console.error('❌ Example runner failed:', error)
    throw error
  }
}

export default {
  basicTransactionExample,
  savepointExample,
  bulkOperationsExample,
  complexTransactionExample,
  enhancedDALExample,
  runAllTransactionExamples
}