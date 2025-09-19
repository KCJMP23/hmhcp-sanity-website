// Comprehensive logger service for CMS functionality
// This supports the full CMS system deployment

export interface LogLevel {
  error: 0
  warn: 1
  info: 2
  debug: 3
}

export interface LogEntry {
  level: keyof LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  requestId?: string
  ip?: string
  userAgent?: string
}

export interface LoggerConfig {
  level: keyof LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  maxFileSize: number
  maxFiles: number
  remoteEndpoint?: string
  remoteApiKey?: string
}

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private readonly maxBufferSize = 100

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { error: 0, warn: 1, info: 2, debug: 3 }
    return levels[level] <= levels[this.config.level]
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : ''
    const error = entry.error ? `\n${entry.error.stack}` : ''
    
    return `${timestamp} ${level} ${entry.message}${context}${error}`
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return

    const message = this.formatMessage(entry)
    const method = entry.level === 'error' ? 'error' : 
                   entry.level === 'warn' ? 'warn' : 
                   entry.level === 'info' ? 'info' : 'log'

    console[method](message)
  }

  private logToFile(entry: LogEntry): void {
    if (!this.config.enableFile) return
    
    // In a real implementation, this would write to a file
    // For now, we'll just buffer the logs
    this.logBuffer.push(entry)
    
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.remoteApiKey}`
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Remote logging failed:', error)
    }
  }

  private async log(level: keyof LogLevel, message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      userId: context?.userId,
      requestId: context?.requestId,
      ip: context?.ip,
      userAgent: context?.userAgent
    }

    // Log to all configured outputs
    this.logToConsole(entry)
    this.logToFile(entry)
    
    if (this.config.enableRemote) {
      await this.logToRemote(entry)
    }
  }

  // Public logging methods
  async error(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    await this.log('error', message, context, error)
  }

  async warn(message: string, context?: Record<string, any>): Promise<void> {
    await this.log('warn', message, context)
  }

  async info(message: string, context?: Record<string, any>): Promise<void> {
    await this.log('info', message, context)
  }

  async debug(message: string, context?: Record<string, any>): Promise<void> {
    await this.log('debug', message, context)
  }

  // Convenience methods
  async logRequest(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>): Promise<void> {
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`
    await this.info(message, { ...context, method, url, statusCode, duration })
  }

  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.error(error.message, context, error)
  }

  async logUserAction(action: string, userId: string, context?: Record<string, any>): Promise<void> {
    await this.info(`User action: ${action}`, { ...context, userId, action })
  }

  async logSecurityEvent(event: string, context?: Record<string, any>): Promise<void> {
    await this.warn(`Security event: ${event}`, { ...context, event, type: 'security' })
  }

  // Configuration methods
  setLevel(level: keyof LogLevel): void {
    this.config.level = level
  }

  enableConsole(enable: boolean): void {
    this.config.enableConsole = enable
  }

  enableFile(enable: boolean): void {
    this.config.enableFile = enable
  }

  enableRemote(enable: boolean): void {
    this.config.enableRemote = enable
  }

  // Utility methods
  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level)
    }
    return [...this.logBuffer]
  }

  clearLogs(): void {
    this.logBuffer = []
  }

  getStats(): { total: number; byLevel: Record<keyof LogLevel, number> } {
    const byLevel: Record<keyof LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0 }
    
    this.logBuffer.forEach(entry => {
      byLevel[entry.level]++
    })

    return {
      total: this.logBuffer.length,
      byLevel
    }
  }
}

// Create and export default logger instance
export const logger = new Logger()

// Export the class for custom instances
export { Logger }

// Export convenience functions
export const createRequestLogger = (requestId: string, userId?: string, ip?: string, userAgent?: string) => {
  return {
    error: (message: string, context?: Record<string, any>, error?: Error) => 
      logger.error(message, { ...context, requestId, userId, ip, userAgent }, error),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(message, { ...context, requestId, userId, ip, userAgent }),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(message, { ...context, requestId, userId, ip, userAgent }),
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(message, { ...context, requestId, userId, ip, userAgent })
  }
}

export default logger