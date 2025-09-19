'use client';

// Security headers configuration and management
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
    reportUri?: string;
  };
  httpStrictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  xContentTypeOptions?: boolean;
  xXSSProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  crossOriginEmbedderPolicy?: 'unsafe-none' | 'require-corp';
  crossOriginOpenerPolicy?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
}

class SecurityHeadersManager {
  private static instance: SecurityHeadersManager;
  private config: SecurityHeadersConfig;
  
  constructor(config: SecurityHeadersConfig = {}) {
    this.config = {
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.google.com', 'https://www.gstatic.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:', 'blob:'],
          'connect-src': ["'self'", 'https://api.sentry.io'],
          'frame-src': ["'self'", 'https://www.google.com'],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': [],
        },
        reportOnly: process.env.NODE_ENV === 'development',
        reportUri: '/api/security/csp-report',
      },
      httpStrictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: true,
      xXSSProtection: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: ["'self'"],
        payment: [],
        usb: [],
        magnetometer: [],
        accelerometer: [],
        gyroscope: [],
      },
      crossOriginEmbedderPolicy: 'unsafe-none',
      crossOriginOpenerPolicy: 'same-origin-allow-popups',
      crossOriginResourcePolicy: 'same-origin',
      ...config,
    };
  }
  
  static getInstance(config?: SecurityHeadersConfig): SecurityHeadersManager {
    if (!SecurityHeadersManager.instance) {
      SecurityHeadersManager.instance = new SecurityHeadersManager(config);
    }
    return SecurityHeadersManager.instance;
  }

  // Generate Content Security Policy header value
  generateCSPHeader(): string {
    const { directives } = this.config.contentSecurityPolicy!;
    
    const cspDirectives = Object.entries(directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
    
    return cspDirectives;
  }

  // Generate all security headers
  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const cspHeader = this.generateCSPHeader();
      const headerName = this.config.contentSecurityPolicy.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      
      headers[headerName] = cspHeader;
      
      if (this.config.contentSecurityPolicy.reportUri) {
        headers[headerName] += `; report-uri ${this.config.contentSecurityPolicy.reportUri}`;
      }
    }

    // HTTP Strict Transport Security
    if (this.config.httpStrictTransportSecurity) {
      const { maxAge, includeSubDomains, preload } = this.config.httpStrictTransportSecurity;
      let hsts = `max-age=${maxAge}`;
      
      if (includeSubDomains) hsts += '; includeSubDomains';
      if (preload) hsts += '; preload';
      
      headers['Strict-Transport-Security'] = hsts;
    }

    // X-Frame-Options
    if (this.config.xFrameOptions) {
      headers['X-Frame-Options'] = this.config.xFrameOptions;
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection
    if (this.config.xXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    // Permissions Policy
    if (this.config.permissionsPolicy) {
      const permissionsDirectives = Object.entries(this.config.permissionsPolicy)
        .map(([feature, allowlist]) => {
          if (allowlist.length === 0) {
            return `${feature}=()`;
          }
          return `${feature}=(${allowlist.join(' ')})`;
        })
        .join(', ');
      
      headers['Permissions-Policy'] = permissionsDirectives;
    }

    // Cross-Origin Embedder Policy
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy;
    }

    // Cross-Origin Opener Policy
    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy;
    }

    // Cross-Origin Resource Policy
    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy;
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';
    headers['X-Powered-By'] = ''; // Remove X-Powered-By header

    return headers;
  }

  // Apply headers to response
  applyHeaders(response: Response): Response {
    const headers = this.generateHeaders();
    
    Object.entries(headers).forEach(([name, value]) => {
      if (value) {
        response.headers.set(name, value);
      } else {
        response.headers.delete(name);
      }
    });

    return response;
  }

  // Update CSP for specific pages
  updateCSPForPage(pagePath: string): void {
    const pageSpecificPolicies: Record<string, Partial<Record<string, string[]>>> = {
      '/admin': {
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.google.com'],
        'frame-src': ["'self'"],
      },
      '/contact': {
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.google.com', 'https://www.gstatic.com'],
        'frame-src': ["'self'", 'https://www.google.com'],
      },
      '/blog': {
        'img-src': ["'self'", 'data:', 'https:', 'blob:', '*'],
        'media-src': ["'self'", 'https:'],
      },
    };

    const pagePolicy = pageSpecificPolicies[pagePath];
    if (pagePolicy && this.config.contentSecurityPolicy) {
      Object.entries(pagePolicy).forEach(([directive, sources]) => {
        if (!sources) return; // Skip if sources is undefined
        
        if (this.config.contentSecurityPolicy!.directives[directive]) {
          this.config.contentSecurityPolicy!.directives[directive] = [
            ...new Set([...(this.config.contentSecurityPolicy!.directives[directive] || []), ...sources])
          ];
        } else {
          this.config.contentSecurityPolicy!.directives[directive] = sources;
        }
      });
    }
  }

  // Validate CSP compliance
  validateCSPCompliance(scriptContent: string): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    // Check for inline scripts
    if (scriptContent.includes('<script>') && !scriptContent.includes('nonce=')) {
      violations.push('Inline script without nonce detected');
    }
    
    // Check for eval usage
    if (scriptContent.includes('eval(') || scriptContent.includes('new Function(')) {
      violations.push('Use of eval() or Function() constructor detected');
    }
    
    // Check for unsafe-inline style
    if (scriptContent.includes('style=') && !scriptContent.includes('nonce=')) {
      violations.push('Inline styles without nonce detected');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  // Generate nonce for CSP
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Get current configuration
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default security configurations
export const SECURITY_CONFIGS = {
  strict: {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': [],
      },
      reportOnly: false,
    },
    xFrameOptions: 'DENY',
    xXSSProtection: true,
  } as SecurityHeadersConfig,
  
  moderate: {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'"],
        'frame-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': [],
      },
      reportOnly: false,
    },
    xFrameOptions: 'SAMEORIGIN',
    xXSSProtection: true,
  } as SecurityHeadersConfig,
  
  development: {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'connect-src': ["'self'", 'ws:', 'wss:'],
        'frame-src': ["'self'"],
        'object-src': ["'none'"],
      },
      reportOnly: true,
    },
    xFrameOptions: 'SAMEORIGIN',
    xXSSProtection: false, // Can interfere with development
  } as SecurityHeadersConfig,
};

// Singleton instance
export const securityHeaders = SecurityHeadersManager.getInstance(
  SECURITY_CONFIGS[process.env.NODE_ENV === 'production' ? 'moderate' : 'development']
);

// React hook for security headers
export function useSecurityHeaders() {
  return {
    generateHeaders: securityHeaders.generateHeaders.bind(securityHeaders),
    applyHeaders: securityHeaders.applyHeaders.bind(securityHeaders),
    updateCSPForPage: securityHeaders.updateCSPForPage.bind(securityHeaders),
    validateCSP: securityHeaders.validateCSPCompliance.bind(securityHeaders),
    generateNonce: securityHeaders.generateNonce.bind(securityHeaders),
  };
}

// Initialize security headers for Next.js
export function initializeSecurityHeaders(config?: SecurityHeadersConfig) {
  const manager = SecurityHeadersManager.getInstance(config);
  
  // Apply to all responses
  if (typeof window === 'undefined') {
    const headers = manager.generateHeaders();
    // Security headers initialized
  }
  
  return manager;
}