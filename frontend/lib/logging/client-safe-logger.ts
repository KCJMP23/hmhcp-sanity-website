// Client-safe logger that doesn't expose sensitive information
export class ClientSafeLogger {
  private static instance: ClientSafeLogger
  private logs: Array<{ level: string; message: string; timestamp: Date }> = []

  static getInstance(): ClientSafeLogger {
    if (!ClientSafeLogger.instance) {
      ClientSafeLogger.instance = new ClientSafeLogger()
    }
    return ClientSafeLogger.instance
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta)
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta)
  }

  private log(level: string, message: string, meta?: Record<string, any>): void {
    const sanitizedMeta = this.sanitizeMeta(meta)
    this.logs.push({
      level,
      message,
      timestamp: new Date()
    })
    
    // In production, this would send to a logging service
    if (process.env.NODE_ENV === 'development') {
      console[level as keyof Console](`[${level.toUpperCase()}] ${message}`, sanitizedMeta)
    }
  }

  private sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta) return undefined
    
    const sanitized = { ...meta }
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential']
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  getLogs(): Array<{ level: string; message: string; timestamp: Date }> {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }
}

export const logger = ClientSafeLogger.getInstance()

// Default export for compatibility
export default logger