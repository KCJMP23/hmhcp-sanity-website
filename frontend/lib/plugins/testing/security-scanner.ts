import { SecurityScanResult, SecurityVulnerability } from '@/types/plugins/testing';

export class SecurityScanner {
  private config: SecurityScannerConfig;

  constructor(config: SecurityScannerConfig) {
    this.config = config;
  }

  async scanCode(code: string): Promise<SecurityScanResult> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // SQL Injection Detection
    const sqlInjectionVulns = this.detectSQLInjection(code);
    vulnerabilities.push(...sqlInjectionVulns);

    // XSS Detection
    const xssVulns = this.detectXSS(code);
    vulnerabilities.push(...xssVulns);

    // Authentication Bypass Detection
    const authBypassVulns = this.detectAuthenticationBypass(code);
    vulnerabilities.push(...authBypassVulns);

    // Data Exposure Detection
    const dataExposureVulns = this.detectDataExposure(code);
    vulnerabilities.push(...dataExposureVulns);

    // Insecure Direct Object Reference Detection
    const idorVulns = this.detectIDOR(code);
    vulnerabilities.push(...idorVulns);

    // Security Misconfiguration Detection
    const misconfigVulns = this.detectSecurityMisconfiguration(code);
    vulnerabilities.push(...misconfigVulns);

    // Sensitive Data Exposure Detection
    const sensitiveDataVulns = this.detectSensitiveDataExposure(code);
    vulnerabilities.push(...sensitiveDataVulns);

    // Cross-Site Request Forgery Detection
    const csrfVulns = this.detectCSRF(code);
    vulnerabilities.push(...csrfVulns);

    // Insecure Deserialization Detection
    const deserializationVulns = this.detectInsecureDeserialization(code);
    vulnerabilities.push(...deserializationVulns);

    // Using Components with Known Vulnerabilities
    const componentVulns = this.detectVulnerableComponents(code);
    vulnerabilities.push(...componentVulns);

    // Insufficient Logging and Monitoring
    const loggingVulns = this.detectInsufficientLogging(code);
    vulnerabilities.push(...loggingVulns);

    const score = this.calculateSecurityScore(vulnerabilities);
    
    return {
      vulnerabilities,
      score,
      passed: vulnerabilities.length === 0,
      timestamp: new Date().toISOString(),
      details: {
        totalChecks: 11,
        passedChecks: 11 - vulnerabilities.length,
        failedChecks: vulnerabilities.length,
        scanLevel: this.config.scanLevel
      }
    };
  }

  private detectSQLInjection(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for string concatenation in SQL queries
    const sqlPatterns = [
      /SELECT\s+.*\+.*FROM/i,
      /INSERT\s+.*\+.*INTO/i,
      /UPDATE\s+.*\+.*SET/i,
      /DELETE\s+.*\+.*FROM/i,
      /query\s*\(\s*['"`].*\+.*['"`]/i,
      /execute\s*\(\s*['"`].*\+.*['"`]/i
    ];

    sqlPatterns.forEach((pattern, index) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'SQL Injection',
          severity: 'high',
          description: 'Potential SQL injection vulnerability detected. Code uses string concatenation in SQL queries.',
          recommendation: 'Use parameterized queries or prepared statements instead of string concatenation.',
          cve: 'CWE-89',
          cvss: 8.8,
          affectedComponents: ['Database queries']
        });
      }
    });

    return vulnerabilities;
  }

  private detectXSS(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for unescaped user input in HTML output
    const xssPatterns = [
      /innerHTML\s*=\s*[^;]+user/i,
      /document\.write\s*\(\s*[^;]+user/i,
      /\.html\s*\(\s*[^;]+user/i,
      /dangerouslySetInnerHTML/i
    ];

    xssPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Cross-Site Scripting (XSS)',
          severity: 'high',
          description: 'Potential XSS vulnerability detected. User input is directly inserted into HTML without proper escaping.',
          recommendation: 'Sanitize and escape all user input before rendering in HTML. Use Content Security Policy (CSP) headers.',
          cve: 'CWE-79',
          cvss: 6.1,
          affectedComponents: ['User interface', 'Data rendering']
        });
      }
    });

    return vulnerabilities;
  }

  private detectAuthenticationBypass(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for hardcoded credentials or weak authentication
    const authPatterns = [
      /password\s*=\s*['"`][^'"`]+['"`]/i,
      /apiKey\s*=\s*['"`][^'"`]+['"`]/i,
      /token\s*=\s*['"`][^'"`]+['"`]/i,
      /secret\s*=\s*['"`][^'"`]+['"`]/i,
      /if\s*\(\s*user\s*==\s*['"`]admin['"`]\s*\)/i,
      /bypass.*auth/i
    ];

    authPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Authentication Bypass',
          severity: 'critical',
          description: 'Hardcoded credentials or weak authentication mechanism detected.',
          recommendation: 'Use environment variables for sensitive data and implement proper authentication mechanisms.',
          cve: 'CWE-798',
          cvss: 9.8,
          affectedComponents: ['Authentication', 'Authorization']
        });
      }
    });

    return vulnerabilities;
  }

  private detectDataExposure(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for sensitive data in logs or error messages
    const exposurePatterns = [
      /console\.log\s*\(\s*[^;]*password/i,
      /console\.log\s*\(\s*[^;]*token/i,
      /console\.log\s*\(\s*[^;]*secret/i,
      /console\.error\s*\(\s*[^;]*password/i,
      /throw\s+new\s+Error\s*\(\s*[^;]*password/i
    ];

    exposurePatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Sensitive Data Exposure',
          severity: 'high',
          description: 'Sensitive data may be exposed in logs or error messages.',
          recommendation: 'Remove sensitive data from logs and error messages. Use structured logging with data masking.',
          cve: 'CWE-200',
          cvss: 7.5,
          affectedComponents: ['Logging', 'Error handling']
        });
      }
    });

    return vulnerabilities;
  }

  private detectIDOR(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for direct object references without authorization
    const idorPatterns = [
      /\/api\/users\/\$\{userId\}/i,
      /\/api\/patients\/\$\{patientId\}/i,
      /\/api\/organizations\/\$\{orgId\}/i,
      /findById\s*\(\s*req\.params\.id\s*\)/i,
      /findOne\s*\(\s*\{\s*id:\s*req\.params\.id\s*\}/i
    ];

    idorPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Insecure Direct Object Reference',
          severity: 'medium',
          description: 'Direct object reference without proper authorization checks detected.',
          recommendation: 'Implement proper authorization checks before accessing resources. Use indirect references or access control lists.',
          cve: 'CWE-639',
          cvss: 5.3,
          affectedComponents: ['API endpoints', 'Data access']
        });
      }
    });

    return vulnerabilities;
  }

  private detectSecurityMisconfiguration(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for security misconfigurations
    const misconfigPatterns = [
      /cors\s*:\s*\{\s*origin:\s*true\s*\}/i,
      /helmet\s*\(\s*\)/i,
      /https:\s*false/i,
      /secure:\s*false/i,
      /httpOnly:\s*false/i
    ];

    misconfigPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Security Misconfiguration',
          severity: 'medium',
          description: 'Security misconfiguration detected that may expose the application to attacks.',
          recommendation: 'Review and fix security configurations. Enable proper CORS, HTTPS, and security headers.',
          cve: 'CWE-16',
          cvss: 4.3,
          affectedComponents: ['Configuration', 'Security headers']
        });
      }
    });

    return vulnerabilities;
  }

  private detectSensitiveDataExposure(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for sensitive data in comments or code
    const sensitivePatterns = [
      /\/\/\s*password:\s*[^\s]+/i,
      /\/\/\s*api_key:\s*[^\s]+/i,
      /\/\/\s*token:\s*[^\s]+/i,
      /\/\*\s*password:\s*[^*]+\*\//i,
      /TODO.*password/i,
      /FIXME.*secret/i
    ];

    sensitivePatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Sensitive Data in Comments',
          severity: 'low',
          description: 'Sensitive data found in comments or code documentation.',
          recommendation: 'Remove sensitive data from comments and code. Use secure configuration management.',
          cve: 'CWE-200',
          cvss: 3.7,
          affectedComponents: ['Code comments', 'Documentation']
        });
      }
    });

    return vulnerabilities;
  }

  private detectCSRF(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for missing CSRF protection
    const csrfPatterns = [
      /app\.use\s*\(\s*csurf\s*\)/i,
      /csrfProtection/i,
      /_csrf/i
    ];

    const hasCSRFProtection = csrfPatterns.some(pattern => pattern.test(code));
    
    if (!hasCSRFProtection && code.includes('POST') && code.includes('PUT') && code.includes('DELETE')) {
      vulnerabilities.push({
        type: 'Cross-Site Request Forgery (CSRF)',
        severity: 'medium',
        description: 'No CSRF protection detected for state-changing operations.',
        recommendation: 'Implement CSRF protection using tokens or SameSite cookies.',
        cve: 'CWE-352',
        cvss: 6.5,
        affectedComponents: ['API endpoints', 'Form handling']
      });
    }

    return vulnerabilities;
  }

  private detectInsecureDeserialization(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for insecure deserialization
    const deserializationPatterns = [
      /JSON\.parse\s*\(\s*req\.body/i,
      /eval\s*\(\s*req\.body/i,
      /Function\s*\(\s*req\.body/i,
      /deserialize\s*\(\s*req\.body/i
    ];

    deserializationPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        vulnerabilities.push({
          type: 'Insecure Deserialization',
          severity: 'high',
          description: 'Insecure deserialization of user-controlled data detected.',
          recommendation: 'Avoid deserializing untrusted data. Use safe serialization formats and validate input.',
          cve: 'CWE-502',
          cvss: 8.1,
          affectedComponents: ['Data processing', 'Serialization']
        });
      }
    });

    return vulnerabilities;
  }

  private detectVulnerableComponents(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for known vulnerable packages (simplified check)
    const vulnerablePackages = [
      'lodash@4.17.4',
      'express@4.16.0',
      'mongoose@5.0.0',
      'moment@2.19.0'
    ];

    vulnerablePackages.forEach((pkg) => {
      if (code.includes(pkg)) {
        vulnerabilities.push({
          type: 'Vulnerable Component',
          severity: 'high',
          description: `Using component with known vulnerabilities: ${pkg}`,
          recommendation: 'Update to the latest secure version of the component.',
          cve: 'CVE-2018-16487',
          cvss: 7.5,
          affectedComponents: ['Dependencies', 'Third-party libraries']
        });
      }
    });

    return vulnerabilities;
  }

  private detectInsufficientLogging(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for insufficient logging
    const loggingPatterns = [
      /console\.log/i,
      /console\.error/i,
      /logger\.info/i,
      /logger\.error/i,
      /winston/i,
      /pino/i
    ];

    const hasLogging = loggingPatterns.some(pattern => pattern.test(code));
    
    if (!hasLogging && (code.includes('auth') || code.includes('login') || code.includes('error'))) {
      vulnerabilities.push({
        type: 'Insufficient Logging and Monitoring',
        severity: 'medium',
        description: 'Insufficient logging and monitoring for security events.',
        recommendation: 'Implement comprehensive logging for authentication, authorization, and error events.',
        cve: 'CWE-778',
        cvss: 4.3,
        affectedComponents: ['Logging', 'Monitoring', 'Audit trail']
      });
    }

    return vulnerabilities;
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  async scanFile(filePath: string): Promise<SecurityScanResult> {
    // In a real implementation, this would read the file content
    // For now, we'll simulate the file reading
    const code = `// Simulated file content for ${filePath}`;
    return this.scanCode(code);
  }

  async scanDirectory(directoryPath: string): Promise<SecurityScanResult> {
    // In a real implementation, this would scan all files in the directory
    // For now, we'll simulate scanning multiple files
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Simulate scanning multiple files
    const files = ['index.ts', 'plugin.ts', 'api.ts', 'database.ts'];
    
    for (const file of files) {
      const fileResult = await this.scanFile(`${directoryPath}/${file}`);
      vulnerabilities.push(...fileResult.vulnerabilities);
    }

    const score = this.calculateSecurityScore(vulnerabilities);
    
    return {
      vulnerabilities,
      score,
      passed: vulnerabilities.length === 0,
      timestamp: new Date().toISOString(),
      details: {
        totalFiles: files.length,
        scannedFiles: files.length,
        totalChecks: files.length * 11,
        passedChecks: files.length * 11 - vulnerabilities.length,
        failedChecks: vulnerabilities.length
      }
    };
  }
}

interface SecurityScannerConfig {
  scanLevel: 'basic' | 'comprehensive' | 'penetration';
  includeComments: boolean;
  includeTests: boolean;
  excludePatterns: string[];
  customRules: SecurityRule[];
}

interface SecurityRule {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}
