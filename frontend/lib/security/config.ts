/**
 * Centralized Security Configuration
 * Enterprise-grade security settings for 10/10 security rating
 */

export const SECURITY_CONFIG = {
  // Authentication & Authorization
  auth: {
    // Account lockout settings
    lockout: {
      maxAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      progressiveDelays: [0, 2000, 5000, 10000, 20000, 30000], // ms
    },
    
    // Password requirements
    password: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '@$!%*?&#',
      preventCommonPasswords: true,
      preventUserInfoInPassword: true,
      passwordHistory: 5, // Remember last 5 passwords
      expirationDays: 90,
    },
    
    // Session management
    session: {
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes
      absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
      concurrentSessionLimit: 3,
      regenerateIdOnLogin: true,
      secureCookie: true,
      sameSite: 'strict' as const,
      httpOnly: true,
    },
    
    // Multi-factor authentication
    mfa: {
      required: true,
      methods: ['totp', 'backup-codes'],
      backupCodeCount: 10,
      totpWindow: 1, // Time window for TOTP
      totpDigits: 6,
    },
    
    // JWT settings
    jwt: {
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      algorithm: 'RS256' as const,
      issuer: 'hmhcp-security',
      audience: 'hmhcp-api',
    },
  },
  
  // Rate limiting
  rateLimit: {
    // General rate limits
    general: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      message: 'Too many requests, please try again later',
    },
    
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      skipSuccessfulRequests: false,
      message: 'Too many authentication attempts',
    },
    
    // API endpoints
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      message: 'API rate limit exceeded',
    },
    
    // Admin endpoints
    admin: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Admin rate limit exceeded',
    },
    
    // File upload
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      message: 'Upload rate limit exceeded',
    },
  },
  
  // Input validation
  validation: {
    // Maximum sizes
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxJsonDepth: 10,
    maxUrlLength: 2048,
    maxHeaderSize: 8192,
    
    // File upload
    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
      ],
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.txt', '.json'
      ],
      scanForMalware: true,
    },
    
    // Dangerous patterns to block
    blockPatterns: {
      sql: true,
      xss: true,
      commandInjection: true,
      pathTraversal: true,
      xxe: true,
      ldap: true,
      noSql: true,
      templateInjection: true,
    },
  },
  
  // Security headers
  headers: {
    // Content Security Policy
    csp: {
      enabled: true,
      reportOnly: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "'unsafe-eval'", // Required for development
          'https://cdn.jsdelivr.net',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        'img-src': [
          "'self'",
          'data:',
          'https:',
          'blob:',
        ],
        'font-src': [
          "'self'",
          'https://fonts.gstatic.com',
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'https://www.google-analytics.com',
        ],
        'frame-src': [
          "'self'",
          'https://www.youtube.com',
          'https://player.vimeo.com',
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
      },
      reportUri: '/api/security/csp-report',
    },
    
    // HSTS
    hsts: {
      enabled: true,
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    
    // Other headers
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      microphone: [],
      payment: [],
      usb: [],
    },
  },
  
  // Encryption & Cryptography
  crypto: {
    // Hashing
    bcryptRounds: 12,
    scryptCost: 16384,
    scryptBlockSize: 8,
    scryptParallelization: 1,
    
    // Encryption
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2',
    keyIterations: 100000,
    saltLength: 32,
    ivLength: 16,
    tagLength: 16,
    
    // TLS
    minTlsVersion: 'TLSv1.3',
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ],
  },
  
  // Logging & Monitoring
  logging: {
    // Log levels
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    
    // Security events to log
    logSecurityEvents: true,
    logAuthAttempts: true,
    logAdminActions: true,
    logDataAccess: true,
    logErrors: true,
    
    // Retention
    retentionDays: 90,
    
    // Sensitive data masking
    maskSensitiveData: true,
    sensitiveFields: [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'ssn',
      'creditCard',
      'cvv',
    ],
  },
  
  // CORS configuration
  cors: {
    enabled: true,
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  // Security monitoring
  monitoring: {
    // Anomaly detection
    anomalyDetection: {
      enabled: true,
      suspiciousUserAgents: [
        'sqlmap', 'nikto', 'nmap', 'metasploit',
        'burp', 'owasp', 'acunetix', 'nessus',
      ],
      blockAutomatedTools: true,
      detectProxies: true,
      geoAnomalyDetection: true,
    },
    
    // Threat intelligence
    threatIntelligence: {
      enabled: true,
      checkIpReputation: true,
      blockKnownBadIps: true,
      blockTorExitNodes: false,
      blockVpnProviders: false,
    },
    
    // Alerting thresholds
    alerts: {
      criticalEvents: 1,
      highEvents: 5,
      mediumEvents: 20,
      failedLogins: 10,
      blockedRequests: 50,
    },
  },
  
  // Compliance & Standards
  compliance: {
    // Standards to comply with
    standards: [
      'OWASP Top 10 2024',
      'PCI DSS 4.0',
      'SOC 2 Type II',
      'ISO 27001',
      'NIST Cybersecurity Framework',
    ],
    
    // Audit settings
    audit: {
      enabled: true,
      frequency: 'quarterly',
      autoReport: true,
      reportFormats: ['json', 'html', 'pdf'],
    },
    
    // Data protection
    dataProtection: {
      encryptAtRest: true,
      encryptInTransit: true,
      dataClassification: true,
      dataMinimization: true,
      rightToErasure: true,
    },
  },
  
  // Environment-specific overrides
  environments: {
    development: {
      headers: {
        csp: {
          enabled: false,
        },
        hsts: {
          enabled: false,
        },
      },
      rateLimit: {
        general: {
          maxRequests: 1000,
        },
      },
    },
    staging: {
      headers: {
        csp: {
          reportOnly: true,
        },
      },
    },
    production: {
      auth: {
        mfa: {
          required: true,
        },
      },
      logging: {
        level: 'warn',
      },
    },
  },
}

// Helper function to get environment-specific config
export function getSecurityConfig(env: string = process.env.NODE_ENV || 'development') {
  const baseConfig = { ...SECURITY_CONFIG }
  const envConfig = SECURITY_CONFIG.environments[env as keyof typeof SECURITY_CONFIG.environments]
  
  if (envConfig) {
    // Deep merge environment-specific config
    return deepMerge(baseConfig, envConfig)
  }
  
  return baseConfig
}

// Deep merge helper
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

export default SECURITY_CONFIG