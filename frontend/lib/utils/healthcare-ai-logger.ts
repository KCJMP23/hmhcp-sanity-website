interface LogContext {
  context?: string;
  [key: string]: any;
}

export class HealthcareAILogger {
  private componentName: string;

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Remove or mask sensitive healthcare data
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'patient_id',
      'patient_name',
      'medical_record',
      'diagnosis',
      'treatment',
      'symptoms',
      'medications',
      'ssn',
      'date_of_birth',
      'phone',
      'email',
      'address'
    ];
    
    return sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(this.sanitizeData(context))}]` : '';
    return `[${timestamp}] [${level}] [${this.componentName}] ${message}${contextStr}`;
  }

  log(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('INFO', message, context);
    console.log(formattedMessage);
    
    // In production, this would send to a logging service
    this.sendToLoggingService('info', message, context);
  }

  error(message: string, error: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
    
    const formattedMessage = this.formatMessage('ERROR', message, errorContext);
    console.error(formattedMessage);
    
    // In production, this would send to a logging service
    this.sendToLoggingService('error', message, errorContext);
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('WARN', message, context);
    console.warn(formattedMessage);
    
    // In production, this would send to a logging service
    this.sendToLoggingService('warn', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message, context);
      console.debug(formattedMessage);
    }
    
    // In production, this would send to a logging service
    this.sendToLoggingService('debug', message, context);
  }

  private sendToLoggingService(level: string, message: string, context?: LogContext): void {
    // In a real implementation, this would send to a healthcare-compliant logging service
    // For now, we'll just store in localStorage for development
    if (typeof window !== 'undefined') {
      try {
        const logEntry = {
          timestamp: new Date().toISOString(),
          level,
          component: this.componentName,
          message,
          context: this.sanitizeData(context || {}),
          sessionId: this.getSessionId()
        };

        const logs = JSON.parse(localStorage.getItem('healthcare_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 log entries
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('healthcare_logs', JSON.stringify(logs));
      } catch (error) {
        console.error('Failed to store log entry:', error);
      }
    }
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('healthcare_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('healthcare_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  // Method to retrieve logs for debugging
  getLogs(): any[] {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('healthcare_logs') || '[]');
      } catch (error) {
        console.error('Failed to retrieve logs:', error);
        return [];
      }
    }
    return [];
  }

  // Method to clear logs
  clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('healthcare_logs');
    }
  }
}