// Email Service Error Handler
// Created: 2025-01-27
// Purpose: Centralized error handling and retry logic

import { EmailServiceError } from './EmailServiceProvider';

export interface ErrorContext {
  operation: string;
  provider: string;
  timestamp: Date;
  retryAttempt?: number;
  maxRetries?: number;
  originalError?: Error;
}

export interface RetryStrategy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorContext[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error, context: ErrorContext): EmailServiceError {
    // Log the error
    this.logError(context);
    
    // Determine if error is retryable
    const isRetryable = this.isRetryableError(error, context);
    
    // Create standardized error
    const emailError = new EmailServiceError(
      this.formatErrorMessage(error, context),
      this.getErrorCode(error),
      this.getStatusCode(error),
      context.provider,
      isRetryable,
      {
        operation: context.operation,
        timestamp: context.timestamp,
        retryAttempt: context.retryAttempt,
        maxRetries: context.maxRetries,
        originalError: error.message
      }
    );
    
    return emailError;
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'timestamp'>,
    strategy: RetryStrategy
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        const errorContext: ErrorContext = {
          ...context,
          timestamp: new Date(),
          retryAttempt: attempt,
          maxRetries: strategy.maxAttempts,
          originalError: lastError
        };
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, errorContext) || 
            !strategy.retryableErrors.includes(this.getErrorCode(lastError))) {
          throw this.handleError(lastError, errorContext);
        }
        
        // Don't retry on last attempt
        if (attempt === strategy.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, strategy);
        
        console.warn(
          `${context.operation} with ${context.provider} failed (attempt ${attempt}/${strategy.maxAttempts}), retrying in ${delay}ms:`,
          lastError.message
        );
        
        await this.delay(delay);
      }
    }
    
    throw this.handleError(lastError!, {
      ...context,
      timestamp: new Date(),
      retryAttempt: strategy.maxAttempts,
      maxRetries: strategy.maxAttempts,
      originalError: lastError
    });
  }

  private isRetryableError(error: Error, context: ErrorContext): boolean {
    const errorCode = this.getErrorCode(error);
    
    // Network and timeout errors are retryable
    if (errorCode.includes('TIMEOUT') || 
        errorCode.includes('NETWORK') || 
        errorCode.includes('CONNECTION')) {
      return true;
    }
    
    // Rate limiting errors are retryable
    if (errorCode.includes('RATE_LIMITED') || 
        errorCode.includes('TOO_MANY_REQUESTS')) {
      return true;
    }
    
    // Server errors (5xx) are retryable
    const statusCode = this.getStatusCode(error);
    if (statusCode && statusCode >= 500) {
      return true;
    }
    
    // Service unavailable errors are retryable
    if (errorCode.includes('SERVICE_UNAVAILABLE') || 
        errorCode.includes('TEMPORARY_FAILURE')) {
      return true;
    }
    
    // Provider-specific retryable errors
    switch (context.provider) {
      case 'sendgrid':
        return this.isSendGridRetryableError(error);
      case 'smtp':
        return this.isSMTPRetryableError(error);
      default:
        return false;
    }
  }

  private isSendGridRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // SendGrid specific retryable errors
    return message.includes('timeout') ||
           message.includes('rate limit') ||
           message.includes('service unavailable') ||
           message.includes('internal server error') ||
           message.includes('bad gateway') ||
           message.includes('service temporarily unavailable');
  }

  private isSMTPRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // SMTP specific retryable errors
    return message.includes('timeout') ||
           message.includes('connection') ||
           message.includes('network') ||
           message.includes('temporary') ||
           message.includes('try again') ||
           message.includes('service not available');
  }

  private getErrorCode(error: Error): string {
    if (error instanceof EmailServiceError) {
      return error.code;
    }
    
    const message = error.message.toLowerCase();
    
    // Map common error patterns to error codes
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit') || message.includes('too many requests')) return 'RATE_LIMITED';
    if (message.includes('unauthorized') || message.includes('forbidden')) return 'AUTHENTICATION_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('bad request')) return 'BAD_REQUEST';
    if (message.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
    if (message.includes('internal server error')) return 'INTERNAL_ERROR';
    if (message.includes('network') || message.includes('connection')) return 'NETWORK_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private getStatusCode(error: Error): number | undefined {
    if (error instanceof EmailServiceError) {
      return error.statusCode;
    }
    
    // Try to extract status code from error message
    const message = error.message;
    const statusMatch = message.match(/(\d{3})/);
    if (statusMatch) {
      return parseInt(statusMatch[1]);
    }
    
    return undefined;
  }

  private formatErrorMessage(error: Error, context: ErrorContext): string {
    const provider = context.provider ? ` via ${context.provider}` : '';
    const attempt = context.retryAttempt ? ` (attempt ${context.retryAttempt}/${context.maxRetries})` : '';
    
    return `${context.operation} failed${provider}${attempt}: ${error.message}`;
  }

  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, strategy.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (strategy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  private logError(context: ErrorContext): void {
    this.errorLog.push(context);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByProvider: Record<string, number>;
    errorsByOperation: Record<string, number>;
    errorsByCode: Record<string, number>;
    recentErrors: ErrorContext[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(error => error.timestamp > oneHourAgo);
    
    const errorsByProvider: Record<string, number> = {};
    const errorsByOperation: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    
    for (const error of this.errorLog) {
      errorsByProvider[error.provider] = (errorsByProvider[error.provider] || 0) + 1;
      errorsByOperation[error.operation] = (errorsByOperation[error.operation] || 0) + 1;
      
      if (error.originalError) {
        const code = this.getErrorCode(error.originalError);
        errorsByCode[code] = (errorsByCode[code] || 0) + 1;
      }
    }
    
    return {
      totalErrors: this.errorLog.length,
      errorsByProvider,
      errorsByOperation,
      errorsByCode,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
