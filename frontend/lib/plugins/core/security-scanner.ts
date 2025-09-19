/**
 * Security Scanner - Plugin Security Validation and Vulnerability Detection
 * Story 02: WordPress-Style Plugin Architecture Implementation
 */

import { EventEmitter } from 'events';
import { PluginDefinition, SecurityScanResults, Vulnerability } from '@/types/plugins/marketplace';

export interface SecurityScannerConfig {
  enableScanning: boolean;
  scanOnLoad: boolean;
  quarantineOnFailure: boolean;
  scanTimeout: number; // seconds
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  blockedPatterns: RegExp[];
  vulnerabilityDatabase: string;
}

export interface ScanResult {
  safe: boolean;
  score: number; // 0-100
  vulnerabilities: Vulnerability[];
  warnings: string[];
  recommendations: string[];
  scanTime: number; // ms
  scannedFiles: number;
}

export class SecurityScanner extends EventEmitter {
  private readonly config: SecurityScannerConfig;
  private readonly scanCache = new Map<string, { result: ScanResult; timestamp: number }>();
  private readonly cacheTTL = 3600000; // 1 hour

  constructor(config: SecurityScannerConfig) {
    super();
    this.config = {
      enableScanning: true,
      scanOnLoad: true,
      quarantineOnFailure: true,
      scanTimeout: 30,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['.js', '.ts', '.json', '.md'],
      blockedPatterns: [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(\s*["']/gi,
        /setInterval\s*\(\s*["']/gi,
        /innerHTML\s*=/gi,
        /document\.write/gi,
        /require\s*\(\s*["']fs["']/gi,
        /require\s*\(\s*["']child_process["']/gi,
        /require\s*\(\s*["']os["']/gi,
        /process\.env/gi
      ],
      vulnerabilityDatabase: 'https://api.nvd.nist.gov/v2/vulnerabilities',
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * Scan a plugin for security vulnerabilities
   */
  async scanPlugin(plugin: PluginDefinition): Promise<ScanResult> {
    if (!this.config.enableScanning) {
      return {
        safe: true,
        score: 100,
        vulnerabilities: [],
        warnings: [],
        recommendations: [],
        scanTime: 0,
        scannedFiles: 0
      };
    }

    // Check cache first
    const cacheKey = `scan_${plugin.id}_${plugin.version}`;
    const cached = this.scanCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.result;
    }

    const startTime = Date.now();
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Scan plugin manifest
      const manifestScan = await this.scanManifest(plugin);
      vulnerabilities.push(...manifestScan.vulnerabilities);
      warnings.push(...manifestScan.warnings);
      recommendations.push(...manifestScan.recommendations);

      // Scan plugin code (if available)
      const codeScan = await this.scanPluginCode(plugin);
      vulnerabilities.push(...codeScan.vulnerabilities);
      warnings.push(...codeScan.warnings);
      recommendations.push(...codeScan.recommendations);

      // Scan dependencies
      const dependencyScan = await this.scanDependencies(plugin);
      vulnerabilities.push(...dependencyScan.vulnerabilities);
      warnings.push(...dependencyScan.warnings);
      recommendations.push(...dependencyScan.recommendations);

      // Scan healthcare compliance
      const complianceScan = await this.scanHealthcareCompliance(plugin);
      vulnerabilities.push(...complianceScan.vulnerabilities);
      warnings.push(...complianceScan.warnings);
      recommendations.push(...complianceScan.recommendations);

      // Calculate security score
      const score = this.calculateSecurityScore(vulnerabilities, warnings);
      const safe = score >= 70 && vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0;

      const result: ScanResult = {
        safe,
        score,
        vulnerabilities,
        warnings,
        recommendations,
        scanTime: Date.now() - startTime,
        scannedFiles: 1 // Mock: would count actual files scanned
      };

      // Cache result
      this.scanCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      this.emit('scan-completed', { pluginId: plugin.id, result });

      return result;

    } catch (error) {
      const result: ScanResult = {
        safe: false,
        score: 0,
        vulnerabilities: [{
          id: 'scan-error',
          severity: 'critical',
          title: 'Security scan failed',
          description: `Failed to complete security scan: ${error.message}`,
          affectedVersions: [plugin.version],
          references: []
        }],
        warnings: [],
        recommendations: ['Review plugin code manually', 'Contact plugin author'],
        scanTime: Date.now() - startTime,
        scannedFiles: 0
      };

      this.emit('scan-error', { pluginId: plugin.id, error: error.message });

      return result;
    }
  }

  /**
   * Scan plugin manifest for security issues
   */
  private async scanManifest(plugin: PluginDefinition): Promise<{
    vulnerabilities: Vulnerability[];
    warnings: string[];
    recommendations: string[];
  }> {
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for missing required fields
    if (!plugin.manifest.name) {
      vulnerabilities.push({
        id: 'missing-name',
        severity: 'high',
        title: 'Missing plugin name',
        description: 'Plugin manifest is missing required name field',
        affectedVersions: [plugin.version],
        references: []
      });
    }

    if (!plugin.manifest.version) {
      vulnerabilities.push({
        id: 'missing-version',
        severity: 'high',
        title: 'Missing plugin version',
        description: 'Plugin manifest is missing required version field',
        affectedVersions: [plugin.version],
        references: []
      });
    }

    // Check for suspicious permissions
    if (plugin.manifest.permissions) {
      if (plugin.manifest.permissions.network && plugin.manifest.permissions.fileSystem) {
        warnings.push('Plugin requests both network and file system access');
        recommendations.push('Review if both permissions are necessary');
      }

      if (plugin.manifest.permissions.healthcareData && !plugin.manifest.healthcareCompliance?.hipaa) {
        vulnerabilities.push({
          id: 'healthcare-data-no-hipaa',
          severity: 'critical',
          title: 'Healthcare data access without HIPAA compliance',
          description: 'Plugin requests healthcare data access but does not specify HIPAA compliance',
          affectedVersions: [plugin.version],
          references: []
        });
      }
    }

    // Check for suspicious dependencies
    if (plugin.manifest.dependencies) {
      const suspiciousDeps = ['eval', 'vm', 'child_process', 'fs', 'os'];
      for (const dep of Object.keys(plugin.manifest.dependencies)) {
        if (suspiciousDeps.includes(dep)) {
          warnings.push(`Suspicious dependency: ${dep}`);
          recommendations.push(`Review necessity of ${dep} dependency`);
        }
      }
    }

    return { vulnerabilities, warnings, recommendations };
  }

  /**
   * Scan plugin code for security issues
   */
  private async scanPluginCode(plugin: PluginDefinition): Promise<{
    vulnerabilities: Vulnerability[];
    warnings: string[];
    recommendations: string[];
  }> {
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // In a real implementation, this would:
    // 1. Download and analyze plugin code
    // 2. Use static analysis tools
    // 3. Check for dangerous patterns
    // 4. Validate against security best practices

    // Mock code scanning
    const mockCodeIssues = [
      {
        pattern: /eval\s*\(/gi,
        severity: 'critical' as const,
        title: 'Use of eval() function',
        description: 'eval() function can execute arbitrary code and is a security risk'
      },
      {
        pattern: /innerHTML\s*=/gi,
        severity: 'high' as const,
        title: 'Direct innerHTML assignment',
        description: 'Direct innerHTML assignment can lead to XSS vulnerabilities'
      },
      {
        pattern: /require\s*\(\s*["']fs["']/gi,
        severity: 'medium' as const,
        title: 'File system access',
        description: 'File system access should be carefully controlled'
      }
    ];

    // Simulate code scanning
    for (const issue of mockCodeIssues) {
      if (Math.random() > 0.7) { // 30% chance of finding each issue
        vulnerabilities.push({
          id: `code-${issue.title.toLowerCase().replace(/\s+/g, '-')}`,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          affectedVersions: [plugin.version],
          references: []
        });
      }
    }

    return { vulnerabilities, warnings, recommendations };
  }

  /**
   * Scan plugin dependencies for vulnerabilities
   */
  private async scanDependencies(plugin: PluginDefinition): Promise<{
    vulnerabilities: Vulnerability[];
    warnings: string[];
    recommendations: string[];
  }> {
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // In a real implementation, this would:
    // 1. Check dependency versions against vulnerability databases
    // 2. Use tools like npm audit or similar
    // 3. Check for known security issues

    // Mock dependency scanning
    if (plugin.manifest.dependencies) {
      const depCount = Object.keys(plugin.manifest.dependencies).length;
      if (depCount > 20) {
        warnings.push(`Plugin has many dependencies (${depCount})`);
        recommendations.push('Consider reducing dependencies to minimize attack surface');
      }

      // Simulate finding a vulnerable dependency
      if (Math.random() > 0.8) { // 20% chance
        vulnerabilities.push({
          id: 'vulnerable-dependency',
          severity: 'high',
          title: 'Vulnerable dependency detected',
          description: 'One or more dependencies have known security vulnerabilities',
          affectedVersions: [plugin.version],
          references: ['https://nvd.nist.gov/vuln/detail/CVE-2023-XXXX']
        });
      }
    }

    return { vulnerabilities, warnings, recommendations };
  }

  /**
   * Scan healthcare compliance
   */
  private async scanHealthcareCompliance(plugin: PluginDefinition): Promise<{
    vulnerabilities: Vulnerability[];
    warnings: string[];
    recommendations: string[];
  }> {
    const vulnerabilities: Vulnerability[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!plugin.healthcare_compliance) {
      vulnerabilities.push({
        id: 'missing-healthcare-compliance',
        severity: 'critical',
        title: 'Missing healthcare compliance configuration',
        description: 'Plugin does not specify healthcare compliance requirements',
        affectedVersions: [plugin.version],
        references: []
      });
      return { vulnerabilities, warnings, recommendations };
    }

    const compliance = plugin.healthcare_compliance;

    // Check HIPAA compliance
    if (!compliance.hipaa) {
      vulnerabilities.push({
        id: 'no-hipaa-compliance',
        severity: 'critical',
        title: 'No HIPAA compliance',
        description: 'Plugin does not specify HIPAA compliance',
        affectedVersions: [plugin.version],
        references: []
      });
    }

    // Check data classification
    if (!compliance.dataClassification) {
      warnings.push('No data classification specified');
      recommendations.push('Specify appropriate data classification level');
    } else if (compliance.dataClassification === 'restricted' && !compliance.encryptionRequired) {
      vulnerabilities.push({
        id: 'restricted-data-no-encryption',
        severity: 'high',
        title: 'Restricted data without encryption requirement',
        description: 'Plugin handles restricted data but does not require encryption',
        affectedVersions: [plugin.version],
        references: []
      });
    }

    // Check audit logging
    if (!compliance.auditLogging) {
      warnings.push('No audit logging specified');
      recommendations.push('Enable audit logging for healthcare compliance');
    }

    return { vulnerabilities, warnings, recommendations };
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(vulnerabilities: Vulnerability[], warnings: string[]): number {
    let score = 100;

    // Deduct points for vulnerabilities
    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score -= 30;
          break;
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Deduct points for warnings
    score -= warnings.length * 2;

    return Math.max(0, score);
  }

  /**
   * Get cached scan result
   */
  getCachedScanResult(pluginId: string, version: string): ScanResult | null {
    const cacheKey = `scan_${pluginId}_${version}`;
    const cached = this.scanCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.result;
    }
    
    return null;
  }

  /**
   * Clear scan cache
   */
  clearCache(): void {
    this.scanCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.scanCache.size,
      keys: Array.from(this.scanCache.keys())
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('scan-completed', (data) => {
      console.log(`Security scan completed for plugin: ${data.pluginId}`);
    });

    this.on('scan-error', (data) => {
      console.error(`Security scan error for plugin ${data.pluginId}:`, data.error);
    });
  }
}

export default SecurityScanner;
