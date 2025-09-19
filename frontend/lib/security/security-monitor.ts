import { createServerClient as createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export interface SecurityEvent {
  type: 'failed_login' | 'suspicious_request' | 'unauthorized_access' | 'data_breach_attempt' | 'rate_limit_exceeded' | 'malicious_file_upload' | 'sql_injection_attempt' | 'xss_attempt' | 'brute_force_attack' | 'suspicious_activity' | 'middleware_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  details: Record<string, any>;
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: Date;
  resolvedAt?: Date;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private anomalyThresholds = {
    failedLogins: { count: 5, window: 300000 }, // 5 failures in 5 minutes
    apiErrors: { count: 50, window: 60000 }, // 50 errors in 1 minute
    unusualActivity: { count: 100, window: 60000 }, // 100 requests in 1 minute
    suspiciousFiles: { count: 3, window: 3600000 }, // 3 suspicious files in 1 hour
    bruteForce: { count: 10, window: 900000 }, // 10 attempts in 15 minutes
  };

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store the event
      await this.storeEvent(event);
      
      // Check for anomalies
      await this.checkForAnomalies(event);
      
      // Create alert if severity is critical
      if (event.severity === 'critical') {
        await this.createSecurityAlert({
          type: event.type,
          severity: event.severity,
          title: `Critical Security Event: ${event.type}`,
          message: `Critical security event detected from IP ${event.ip}`,
          details: {
            event,
            automaticAlert: true,
          },
        });
      }
      
      // Real-time monitoring hooks
      if (process.env.NODE_ENV === 'production') {
        await this.notifySecurityTeam(event);
      }
    } catch (error) {
      logger.error('Failed to log security event', {
        error: error instanceof Error ? error : new Error(String(error)),
        action: 'log_security_event',
        metadata: { eventType: event.type, severity: event.severity }
      });
    }
  }

  /**
   * Store security event in database
   */
  private async storeEvent(event: SecurityEvent): Promise<void> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          ip_address: event.ip,
          user_agent: event.userAgent,
          endpoint: event.endpoint,
          method: event.method,
          payload: event.payload,
          details: event.details,
          timestamp: event.timestamp.toISOString(),
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        // Silently skip if table doesn't exist to avoid cluttering logs
        if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
          logger.error('Failed to store security event', {
            error,
            action: 'store_security_event',
            metadata: { eventType: event.type }
          });
        }
      }
    } catch (error) {
      // Silently skip logging errors in development
      if (process.env.NODE_ENV === 'production') {
        logger.error('Failed to store security event', {
          error: error instanceof Error ? error : new Error(String(error)),
          action: 'store_security_event_fallback',
          metadata: { eventType: event.type }
        });
      }
    }
  }

  /**
   * Check for security anomalies
   */
  private async checkForAnomalies(event: SecurityEvent): Promise<void> {
    const threshold = this.anomalyThresholds[event.type as keyof typeof this.anomalyThresholds];
    
    if (!threshold) return;
    
    const recentEvents = await this.getRecentEvents(event.type, threshold.window, event.ip);
    
    if (recentEvents.length >= threshold.count) {
      await this.createSecurityAlert({
        type: 'anomaly_detected',
        severity: 'high',
        title: `Security Anomaly: ${event.type}`,
        message: `Detected ${recentEvents.length} ${event.type} events from IP ${event.ip} in the last ${threshold.window / 1000} seconds`,
        details: {
          eventType: event.type,
          count: recentEvents.length,
          threshold: threshold.count,
          window: threshold.window,
          ip: event.ip,
          recentEvents: recentEvents.slice(0, 10), // Include first 10 events
        },
      });
    }
  }

  /**
   * Get recent security events
   */
  private async getRecentEvents(type: string, windowMs: number, ip?: string): Promise<any[]> {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - windowMs);
    
    let query = supabase
      .from('security_events')
      .select('*')
      .eq('event_type', type)
      .gte('timestamp', windowStart.toISOString())
      .order('timestamp', { ascending: false });
    
    if (ip) {
      query = query.eq('ip_address', ip);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Failed to fetch recent events', {
        error,
        action: 'fetch_recent_events',
        metadata: { eventType: type, windowMs }
      });
      return [];
    }
    
    return data || [];
  }

  /**
   * Create a security alert
   */
  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'status' | 'triggeredAt'>): Promise<void> {
    const supabase = await createClient();
    
    // Check if similar alert exists in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: existingAlerts } = await supabase
      .from('security_alerts')
      .select('id')
      .eq('type', alert.type)
      .eq('status', 'active')
      .gte('triggered_at', oneHourAgo.toISOString())
      .limit(1);
    
    // Don't create duplicate alerts
    if (existingAlerts && existingAlerts.length > 0) {
      return;
    }
    
    const { error } = await supabase
      .from('security_alerts')
      .insert({
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        details: alert.details,
        status: 'active',
        triggered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      logger.error('Failed to create security alert', {
        error,
        action: 'create_security_alert',
        metadata: { alertType: alert.type, severity: alert.severity }
      });
    }
  }

  /**
   * Notify security team of critical events
   */
  private async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    if (event.severity === 'critical' || event.severity === 'high') {
      // In production, integrate with:
      // - Slack/Teams notifications
      // - Email alerts
      // - PagerDuty/incident management
      // - SIEM systems
      
      logger.warn(`SECURITY ALERT: ${event.type} from ${event.ip}`, {
        action: 'security_team_notification',
        metadata: {
          eventType: event.type,
          severity: event.severity,
          ip: event.ip,
          details: event.details
        }
      });
    }
  }

  /**
   * Detect brute force attacks
   */
  async detectBruteForce(ip: string, endpoint: string): Promise<boolean> {
    const recentAttempts = await this.getRecentEvents('failed_login', this.anomalyThresholds.bruteForce.window, ip);
    
    if (recentAttempts.length >= this.anomalyThresholds.bruteForce.count) {
      await this.logSecurityEvent({
        type: 'brute_force_attack',
        severity: 'critical',
        ip,
        endpoint,
        details: {
          attemptCount: recentAttempts.length,
          timeWindow: this.anomalyThresholds.bruteForce.window,
        },
        timestamp: new Date(),
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
      /(\<|\>|\"|\'|%3c|%3e|%22|%27)/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*onerror[^>]*>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Scan for vulnerabilities in dependencies
   */
  async scanDependencies(): Promise<{ vulnerabilities: any[]; criticalCount: number }> {
    const vulnerabilities: any[] = [];
    let criticalCount = 0;
    
    try {
      // Run npm audit to check for vulnerabilities
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        const { stdout } = await execAsync('npm audit --json', { maxBuffer: 1024 * 1024 * 10 });
        const auditResult = JSON.parse(stdout);
        
        if (auditResult.vulnerabilities) {
          Object.entries(auditResult.vulnerabilities).forEach(([pkgName, vuln]: [string, any]) => {
            vulnerabilities.push({
              package: pkgName,
              severity: vuln.severity,
              via: vuln.via,
              range: vuln.range,
              fixAvailable: vuln.fixAvailable
            });
            
            if (vuln.severity === 'critical') {
              criticalCount++;
            }
          });
        }
      } catch (auditError: any) {
        // npm audit returns non-zero exit code when vulnerabilities found
        // Parse the output even on error
        if (auditError?.stdout) {
          try {
            const auditResult = JSON.parse(auditError.stdout);
            if (auditResult.vulnerabilities) {
              Object.entries(auditResult.vulnerabilities).forEach(([pkgName, vuln]: [string, any]) => {
                vulnerabilities.push({
                  package: pkgName,
                  severity: vuln.severity,
                  via: vuln.via,
                  range: vuln.range,
                  fixAvailable: vuln.fixAvailable
                });
                
                if (vuln.severity === 'critical') {
                  criticalCount++;
                }
              });
            }
          } catch (parseError) {
            logger.error('Failed to parse npm audit output', {
              error: parseError instanceof Error ? parseError : new Error(String(parseError)),
              action: 'parse_npm_audit'
            });
          }
        }
      }
      
      // Create alert if vulnerabilities found
      if (vulnerabilities.length > 0) {
        const severity = criticalCount > 0 ? 'critical' : 
                        vulnerabilities.some(v => v.severity === 'high') ? 'high' : 
                        vulnerabilities.some(v => v.severity === 'moderate') ? 'medium' : 'low';
        
        await this.createSecurityAlert({
          type: 'dependency_vulnerability',
          severity,
          title: 'Dependency vulnerabilities detected',
          message: `Found ${vulnerabilities.length} vulnerabilities in dependencies (${criticalCount} critical)`,
          details: { 
            vulnerabilities: vulnerabilities.slice(0, 10), // Limit to first 10
            totalCount: vulnerabilities.length,
            criticalCount 
          },
        });
      }
    } catch (error) {
      logger.error('Failed to scan dependencies', {
        error: error instanceof Error ? error : new Error(String(error)),
        action: 'dependency_scan'
      });
    }
    
    return {
      vulnerabilities,
      criticalCount,
    };
  }

  /**
   * Monitor for suspicious user behavior
   */
  async monitorUserBehavior(userId: string, action: string, context: Record<string, any>): Promise<void> {
    const suspiciousActions = [
      'multiple_failed_logins',
      'rapid_api_requests',
      'unusual_access_patterns',
      'privilege_escalation_attempt',
      'data_export_anomaly',
    ];
    
    if (suspiciousActions.includes(action)) {
      await this.logSecurityEvent({
        type: 'suspicious_request',
        severity: 'medium',
        userId,
        ip: context.ip || 'unknown',
        userAgent: context.userAgent,
        endpoint: context.endpoint,
        details: {
          action,
          context,
          suspiciousIndicators: this.analyzeBehavior(action, context),
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Analyze user behavior for suspicious patterns
   */
  private analyzeBehavior(action: string, context: Record<string, any>): string[] {
    const indicators: string[] = [];
    
    // Time-based analysis
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      indicators.push('unusual_time');
    }
    
    // Location-based analysis (if available)
    if (context.country && context.expectedCountry && context.country !== context.expectedCountry) {
      indicators.push('unusual_location');
    }
    
    // Frequency analysis
    if (context.requestCount && context.requestCount > 100) {
      indicators.push('high_frequency');
    }
    
    return indicators;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(days: number = 7): Promise<any> {
    const supabase = await createClient();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: events, error } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to generate security report: ${error.message}`);
    }
    
    const report = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      summary: {
        totalEvents: events?.length || 0,
        eventsBySeverity: this.groupBy(events || [], 'severity'),
        eventsByType: this.groupBy(events || [], 'event_type'),
        topIPs: this.getTopIPs(events || [], 10),
        hourlyDistribution: this.getHourlyDistribution(events || []),
      },
      recommendations: this.generateRecommendations(events || []),
    };
    
    return report;
  }

  /**
   * Group events by a field
   */
  private groupBy(events: any[], field: string): Record<string, number> {
    return events.reduce((acc, event) => {
      const key = event[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get top IP addresses by event count
   */
  private getTopIPs(events: any[], limit: number): Array<{ ip: string; count: number; types: string[] }> {
    const ipMap = new Map<string, { count: number; types: Set<string> }>();
    
    events.forEach(event => {
      const ip = event.ip_address;
      if (!ipMap.has(ip)) {
        ipMap.set(ip, { count: 0, types: new Set() });
      }
      const entry = ipMap.get(ip)!;
      entry.count++;
      entry.types.add(event.event_type);
    });
    
    return Array.from(ipMap.entries())
      .map(([ip, data]) => ({ ip, count: data.count, types: Array.from(data.types) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get hourly distribution of events
   */
  private getHourlyDistribution(events: any[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      distribution[i] = 0;
    }
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      distribution[hour]++;
    });
    
    return distribution;
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(events: any[]): string[] {
    const recommendations: string[] = [];
    
    const eventsBySeverity = this.groupBy(events, 'severity');
    const eventsByType = this.groupBy(events, 'event_type');
    
    if (eventsBySeverity.critical > 0) {
      recommendations.push('Investigate and address critical security events immediately');
    }
    
    if (eventsByType.failed_login > 50) {
      recommendations.push('Consider implementing stronger rate limiting for authentication');
    }
    
    if (eventsByType.brute_force_attack > 0) {
      recommendations.push('Implement IP blocking for detected brute force attacks');
    }
    
    if (eventsByType.sql_injection_attempt > 0) {
      recommendations.push('Review and strengthen input validation and parameterized queries');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('No immediate security concerns detected. Continue monitoring.');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();
