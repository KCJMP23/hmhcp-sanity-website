import { logger } from '@/lib/logger';

// Authentication security hardening
export interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
  };
  sessionSecurity: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    regenerateOnLogin: boolean;
  };
  bruteForceProtection: {
    maxAttempts: number;
    lockoutDuration: number;
    progressiveLockout: boolean;
  };
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    backupCodes: boolean;
  };
}

export interface LoginAttempt {
  identifier: string;
  timestamp: number;
  success: boolean;
  ipAddress: string;
  userAgent: string;
}

export interface CSRFToken {
  token: string;
  expiry: number;
  used: boolean;
}

class AuthSecurityManager {
  private static instance: AuthSecurityManager;
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private lockedAccounts: Map<string, { lockedUntil: number; attempts: number }> = new Map();
  private csrfTokens: Map<string, CSRFToken> = new Map();
  private config: SecurityConfig;
  
  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
      },
      sessionSecurity: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        regenerateOnLogin: true,
      },
      bruteForceProtection: {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        progressiveLockout: true,
      },
      twoFactorAuth: {
        enabled: true,
        required: false,
        backupCodes: true,
      },
      ...config,
    };
  }
  
  static getInstance(config?: Partial<SecurityConfig>): AuthSecurityManager {
    if (!AuthSecurityManager.instance) {
      AuthSecurityManager.instance = new AuthSecurityManager(config);
    }
    return AuthSecurityManager.instance;
  }

  // Password validation
  validatePassword(password: string): {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  } {
    const errors: string[] = [];
    const { passwordPolicy } = this.config;

    // Length check
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    // Character requirements
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (passwordPolicy.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    // Calculate strength
    const strength = this.calculatePasswordStrength(password);

    return {
      valid: errors.length === 0,
      errors,
      strength,
    };
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'michael', 'jennifer',
    ];
    
    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    );
  }

  private calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Patterns
    if (!/(..).*\1/.test(password)) score += 1; // No repeated patterns
    if (!/01234|12345|23456|34567|45678|56789|67890/.test(password)) score += 1; // No sequences
    
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'strong';
    return 'very-strong';
  }

  // Track login attempts
  recordLoginAttempt(identifier: string, success: boolean, ipAddress: string, userAgent: string): void {
    const attempt: LoginAttempt = {
      identifier,
      timestamp: Date.now(),
      success,
      ipAddress,
      userAgent,
    };

    const attempts = this.loginAttempts.get(identifier) || [];
    attempts.push(attempt);
    
    // Keep only last 50 attempts
    if (attempts.length > 50) {
      attempts.splice(0, attempts.length - 50);
    }
    
    this.loginAttempts.set(identifier, attempts);

    // Handle failed attempts
    if (!success) {
      this.handleFailedLogin(identifier);
    } else {
      // Clear lockout on successful login
      this.lockedAccounts.delete(identifier);
    }
  }

  private handleFailedLogin(identifier: string): void {
    const recentAttempts = this.getRecentFailedAttempts(identifier);
    const { maxAttempts, lockoutDuration, progressiveLockout } = this.config.bruteForceProtection;

    if (recentAttempts >= maxAttempts) {
      const existing = this.lockedAccounts.get(identifier);
      const attemptCount = existing ? existing.attempts + 1 : 1;
      
      let lockDuration = lockoutDuration;
      if (progressiveLockout) {
        // Progressive lockout: 15min, 30min, 1hr, 2hr, etc.
        lockDuration = lockoutDuration * Math.pow(2, attemptCount - 1);
      }

      this.lockedAccounts.set(identifier, {
        lockedUntil: Date.now() + lockDuration,
        attempts: attemptCount,
      });

      logger.warn(`Account locked: ${identifier} for ${lockDuration / 1000 / 60} minutes`, { action: 'warning_logged' });
    }
  }

  private getRecentFailedAttempts(identifier: string): number {
    const attempts = this.loginAttempts.get(identifier) || [];
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    
    return attempts.filter(attempt => 
      !attempt.success && attempt.timestamp > fifteenMinutesAgo
    ).length;
  }

  // Check if account is locked
  isAccountLocked(identifier: string): { locked: boolean; lockedUntil?: number } {
    const lockData = this.lockedAccounts.get(identifier);
    
    if (!lockData) {
      return { locked: false };
    }

    if (Date.now() >= lockData.lockedUntil) {
      this.lockedAccounts.delete(identifier);
      return { locked: false };
    }

    return {
      locked: true,
      lockedUntil: lockData.lockedUntil,
    };
  }

  // CSRF Token management
  generateCSRFToken(sessionId: string): string {
    const token = this.generateSecureToken();
    const expiry = Date.now() + (60 * 60 * 1000); // 1 hour
    
    this.csrfTokens.set(sessionId, {
      token,
      expiry,
      used: false,
    });

    return token;
  }

  validateCSRFToken(sessionId: string, token: string, consumeToken: boolean = true): boolean {
    const csrfData = this.csrfTokens.get(sessionId);
    
    if (!csrfData) {
      return false;
    }

    // Check expiry
    if (Date.now() > csrfData.expiry) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    // Check if already used (for one-time tokens)
    if (csrfData.used) {
      return false;
    }

    // Validate token
    const isValid = csrfData.token === token;
    
    if (isValid && consumeToken) {
      csrfData.used = true;
    }

    return isValid;
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Session security
  generateSecureSession(): {
    sessionId: string;
    csrfToken: string;
    cookieOptions: Record<string, any>;
  } {
    const sessionId = this.generateSecureToken();
    const csrfToken = this.generateCSRFToken(sessionId);
    
    const cookieOptions = {
      httpOnly: this.config.sessionSecurity.httpOnly,
      secure: this.config.sessionSecurity.secure,
      sameSite: this.config.sessionSecurity.sameSite,
      maxAge: this.config.sessionSecurity.maxAge,
      path: '/',
    };

    return {
      sessionId,
      csrfToken,
      cookieOptions,
    };
  }

  // Detect suspicious activity
  detectSuspiciousActivity(identifier: string): {
    suspicious: boolean;
    reasons: string[];
  } {
    const attempts = this.loginAttempts.get(identifier) || [];
    const reasons: string[] = [];
    
    // Multiple failed attempts from different IPs
    const recentAttempts = attempts.filter(a => Date.now() - a.timestamp < 60 * 60 * 1000); // Last hour
    const uniqueIPs = new Set(recentAttempts.map(a => a.ipAddress));
    
    if (uniqueIPs.size > 3 && recentAttempts.length > 10) {
      reasons.push('Multiple login attempts from different IP addresses');
    }

    // Rapid succession attempts
    const rapidAttempts = attempts.filter(a => Date.now() - a.timestamp < 5 * 60 * 1000); // Last 5 minutes
    if (rapidAttempts.length > 10) {
      reasons.push('Rapid succession login attempts');
    }

    // Failed attempts followed by success from different IP
    const recentFailed = recentAttempts.filter(a => !a.success);
    const recentSuccess = recentAttempts.filter(a => a.success);
    
    if (recentFailed.length > 0 && recentSuccess.length > 0) {
      const failedIPs = new Set(recentFailed.map(a => a.ipAddress));
      const successIPs = new Set(recentSuccess.map(a => a.ipAddress));
      
      if (!Array.from(failedIPs).some(ip => successIPs.has(ip))) {
        reasons.push('Successful login from different IP after failed attempts');
      }
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  // Get security statistics
  getSecurityStats(): {
    totalAttempts: number;
    failedAttempts: number;
    lockedAccounts: number;
    suspiciousActivity: number;
  } {
    let totalAttempts = 0;
    let failedAttempts = 0;
    let suspiciousActivity = 0;
    
    for (const attempts of this.loginAttempts.values()) {
      totalAttempts += attempts.length;
      failedAttempts += attempts.filter(a => !a.success).length;
      
      const identifier = attempts[0]?.identifier;
      if (identifier && this.detectSuspiciousActivity(identifier).suspicious) {
        suspiciousActivity++;
      }
    }

    return {
      totalAttempts,
      failedAttempts,
      lockedAccounts: this.lockedAccounts.size,
      suspiciousActivity,
    };
  }

  // Cleanup old data
  cleanup(): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Clean old login attempts
    for (const [identifier, attempts] of this.loginAttempts.entries()) {
      const recentAttempts = attempts.filter(a => a.timestamp > oneDayAgo);
      if (recentAttempts.length === 0) {
        this.loginAttempts.delete(identifier);
      } else {
        this.loginAttempts.set(identifier, recentAttempts);
      }
    }

    // Clean expired lockouts
    for (const [identifier, lockData] of this.lockedAccounts.entries()) {
      if (now >= lockData.lockedUntil) {
        this.lockedAccounts.delete(identifier);
      }
    }

    // Clean expired CSRF tokens
    for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
      if (now > tokenData.expiry) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const authSecurity = AuthSecurityManager.getInstance();

// React hook for auth security
export function useAuthSecurity() {
  return {
    validatePassword: authSecurity.validatePassword.bind(authSecurity),
    recordLoginAttempt: authSecurity.recordLoginAttempt.bind(authSecurity),
    isAccountLocked: authSecurity.isAccountLocked.bind(authSecurity),
    generateCSRFToken: authSecurity.generateCSRFToken.bind(authSecurity),
    validateCSRFToken: authSecurity.validateCSRFToken.bind(authSecurity),
    generateSecureSession: authSecurity.generateSecureSession.bind(authSecurity),
    detectSuspiciousActivity: authSecurity.detectSuspiciousActivity.bind(authSecurity),
  };
}

// Cleanup interval (run every hour)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    authSecurity.cleanup();
  }, 60 * 60 * 1000);
}