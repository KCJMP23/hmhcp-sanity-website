// Email Services Index
// Created: 2025-01-27
// Purpose: Export all email service components

export * from './EmailServiceProvider';
export * from './SendGridService';
export * from './SMTPService';
export * from './EmailServiceManager';
export * from './ErrorHandler';
export * from './WebhookHandler';

// Re-export the singleton instances for easy access
export { emailServiceManager } from './EmailServiceManager';
export { errorHandler } from './ErrorHandler';
export { webhookHandler } from './WebhookHandler';
