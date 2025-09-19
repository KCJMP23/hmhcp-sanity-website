/**
 * Role-Based Access Control (RBAC) System
 * Enterprise-grade authorization with comprehensive audit trails
 */

import logger from '@/lib/logging/winston-logger';

// Permission System
export enum Permission {
  // Content Management
  CONTENT_READ = 'content:read',
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',
  
  // User Management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_IMPERSONATE = 'user:impersonate',
  
  // Data Security
  SENSITIVE_DATA_READ = 'sensitive:read',
  SENSITIVE_DATA_WRITE = 'sensitive:write',
  AUDIT_READ = 'audit:read',
  COMPLIANCE_MANAGE = 'compliance:manage',
  
  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_BACKUP = 'system:backup',
  
  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // API Access
  API_ADMIN = 'api:admin',
  API_WRITE = 'api:write',
  API_READ = 'api:read'
}

// Role Definitions with Security Considerations
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  VIEWER = 'viewer',
  MARKETING_ADMIN = 'marketing_admin',
  CONTENT_MANAGER = 'content_manager',
  COMPLIANCE_OFFICER = 'compliance_officer'
}

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  
  [Role.ADMIN]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_DELETE,
    Permission.CONTENT_PUBLISH,
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.SYSTEM_MONITOR,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.API_ADMIN
  ],
  
  [Role.MARKETING_ADMIN]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_PUBLISH,
    Permission.SENSITIVE_DATA_READ,
    Permission.SENSITIVE_DATA_WRITE,
    Permission.COMPLIANCE_MANAGE,
    Permission.AUDIT_READ,
    Permission.ANALYTICS_READ
  ],
  
  [Role.CONTENT_MANAGER]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.ANALYTICS_READ,
    Permission.API_READ
  ],
  
  [Role.COMPLIANCE_OFFICER]: [
    Permission.AUDIT_READ,
    Permission.COMPLIANCE_MANAGE,
    Permission.SYSTEM_MONITOR,
    Permission.USER_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT
  ],
  
  [Role.EDITOR]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.CONTENT_PUBLISH,
    Permission.API_WRITE,
    Permission.API_READ
  ],
  
  [Role.AUTHOR]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.API_READ
  ],
  
  [Role.VIEWER]: [
    Permission.CONTENT_READ,
    Permission.API_READ
  ]
};

// Session Management
interface UserSession {
  userId: string;
  email: string;
  role: Role;
  permissions: Permission[];
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  metadata: {
    loginMethod: 'password' | 'sso' | 'api_key';
    mfaVerified: boolean;
    deviceFingerprint?: string;
  };
}

export class RBACSystem {
  private activeSessions = new Map<string, UserSession>();
  private sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours for security
  
  /**
   * Create a new user session with comprehensive tracking
   */
  createSession(user: {
    id: string;
    email: string;
    role: string;
    metadata?: any;
  }, context: {
    ipAddress: string;
    userAgent: string;
    loginMethod: 'password' | 'sso' | 'api_key';
    mfaVerified?: boolean;
  }): UserSession {
    const sessionId = this.generateSecureSessionId();
    const role = this.validateRole(user.role);
    const permissions = this.getRolePermissions(role);
    
    const session: UserSession = {
      userId: user.id,
      email: user.email,
      role,
      permissions,
      sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        loginMethod: context.loginMethod,
        mfaVerified: context.mfaVerified || false,
        deviceFingerprint: this.generateDeviceFingerprint(context)
      }
    };
    
    this.activeSessions.set(sessionId, session);
    
    // Log session creation for audit trail
    this.logSecurityEvent('SESSION_CREATED', {
      userId: user.id,
      email: user.email,
      role,
      sessionId,
      ipAddress: context.ipAddress,
      loginMethod: context.loginMethod,
      mfaVerified: context.mfaVerified
    });
    
    return session;
  }
  
  /**
   * Validate and update session activity
   */
  validateSession(sessionId: string, ipAddress: string): UserSession | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      this.logSecurityEvent('SESSION_NOT_FOUND', { sessionId, ipAddress });
      return null;
    }
    
    // Check session timeout
    const now = new Date();
    if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
      this.invalidateSession(sessionId, 'TIMEOUT');
      return null;
    }
    
    // Security: Check IP address consistency for security
    if (session.ipAddress !== ipAddress) {
      this.logSecurityEvent('IP_ADDRESS_MISMATCH', {
        sessionId,
        originalIp: session.ipAddress,
        currentIp: ipAddress,
        userId: session.userId
      });
      
      // Strict security policy: invalidate on IP changes
      this.invalidateSession(sessionId, 'IP_MISMATCH');
      return null;
    }
    
    // Update last activity
    session.lastActivity = now;
    this.activeSessions.set(sessionId, session);
    
    return session;
  }
  
  /**
   * Check if user has specific permission
   */
  hasPermission(session: UserSession, permission: Permission): boolean {
    return session.permissions.includes(permission);
  }
  
  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(session: UserSession, permissions: Permission[]): boolean {
    return permissions.some(permission => session.permissions.includes(permission));
  }
  
  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(session: UserSession, permissions: Permission[]): boolean {
    return permissions.every(permission => session.permissions.includes(permission));
  }
  
  /**
   * Check sensitive data access authorization
   */
  canAccessSensitiveData(session: UserSession, resourceId?: string): boolean {
    if (!this.hasPermission(session, Permission.SENSITIVE_DATA_READ)) {
      return false;
    }
    
    // Log sensitive data access attempt for audit trail
    this.logSecurityEvent('SENSITIVE_DATA_ACCESS_ATTEMPT', {
      userId: session.userId,
      sessionId: session.sessionId,
      resourceId,
      timestamp: new Date(),
      ipAddress: session.ipAddress
    });
    
    return true;
  }
  
  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string, reason: string): void {
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      this.logSecurityEvent('SESSION_INVALIDATED', {
        sessionId,
        userId: session.userId,
        reason,
        duration: new Date().getTime() - session.createdAt.getTime()
      });
      
      this.activeSessions.delete(sessionId);
    }
  }
  
  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId);
  }
  
  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId: string, reason: string): void {
    const userSessions = this.getUserSessions(userId);
    
    userSessions.forEach(session => {
      this.invalidateSession(session.sessionId, reason);
    });
  }
  
  /**
   * Get session analytics for monitoring
   */
  getSessionAnalytics(): {
    totalActiveSessions: number;
    sessionsByRole: Record<string, number>;
    averageSessionDuration: number;
    securityEvents: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const now = new Date().getTime();
    
    const sessionsByRole = sessions.reduce((acc, session) => {
      acc[session.role] = (acc[session.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (now - session.createdAt.getTime());
    }, 0);
    
    return {
      totalActiveSessions: sessions.length,
      sessionsByRole,
      averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      securityEvents: 0 // Would track from security event log
    };
  }
  
  // Private utility methods
  private validateRole(roleString: string): Role {
    const role = Object.values(Role).find(r => r === roleString);
    if (!role) {
      throw new Error(`Invalid role: ${roleString}`);
    }
    return role;
  }
  
  private getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
  
  private generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `sess_${timestamp}_${randomBytes}`;
  }
  
  private generateDeviceFingerprint(context: {
    userAgent: string;
    ipAddress: string;
  }): string {
    // Simple fingerprinting - in production would be more sophisticated
    const data = `${context.userAgent}-${context.ipAddress}`;
    return btoa(data).substring(0, 32);
  }
  
  private logSecurityEvent(event: string, data: any): void {
    logger.warn(`Security Event: ${event}`, {
      event,
      data,
      timestamp: new Date().toISOString(),
      service: 'rbac-system'
    });
    
    // In production, would also send to SIEM system
    // await this.sendToSIEM(event, data);
  }
  
  /**
   * Cleanup expired sessions (run periodically)
   */
  cleanupExpiredSessions(): void {
    const now = new Date().getTime();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.invalidateSession(sessionId, 'EXPIRED');
    });
    
    if (expiredSessions.length > 0) {
      logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
}

// Permission Decorators for API Routes
export function requirePermission(permission: Permission) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const [request] = args;
      const sessionId = request.headers.get('x-session-id');
      
      if (!sessionId) {
        throw new Error('Session ID required');
      }
      
      const session = rbacSystem.validateSession(sessionId, request.ip || 'unknown');
      if (!session) {
        throw new Error('Invalid session');
      }
      
      if (!rbacSystem.hasPermission(session, permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
      
      // Add session to request context
      request.session = session;
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

export function requireRole(requiredRole: Role) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const [request] = args;
      const sessionId = request.headers.get('x-session-id');
      
      if (!sessionId) {
        throw new Error('Session ID required');
      }
      
      const session = rbacSystem.validateSession(sessionId, request.ip || 'unknown');
      if (!session) {
        throw new Error('Invalid session');
      }
      
      if (session.role !== requiredRole && session.role !== Role.SUPER_ADMIN) {
        throw new Error(`Role required: ${requiredRole}`);
      }
      
      request.session = session;
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// Singleton instance
export const rbacSystem = new RBACSystem();

// Cleanup interval (every 15 minutes)
setInterval(() => {
  rbacSystem.cleanupExpiredSessions();
}, 15 * 60 * 1000);