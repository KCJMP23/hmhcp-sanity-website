// Mock audit logger for testing
export interface AuditEvent {
  action: string;
  userId?: string;
  resource?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    // Mock implementation
    console.log('Audit log:', event);
  }

  async logAccess(userId: string, resource: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: 'access',
      userId,
      resource,
      metadata
    });
  }

  async logModification(userId: string, resource: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      action: 'modify',
      userId,
      resource,
      metadata
    });
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
