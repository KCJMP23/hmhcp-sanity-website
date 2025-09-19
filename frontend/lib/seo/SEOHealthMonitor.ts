// SEO Health Monitor
// Created: 2025-01-27
// Purpose: Continuous SEO health monitoring and alerting system

import { TechnicalSEOChecker } from './TechnicalSEOChecker';
import { SEOAuditSystem, AuditConfiguration } from './SEOAuditSystem';
import { HealthcareComplianceValidator } from './HealthcareComplianceValidator';

export interface SEOHealthStatus {
  organizationId: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;
  lastChecked: Date;
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trends: {
    score: number; // -100 to 100, positive means improving
    issues: number; // -100 to 100, negative means fewer issues
    performance: number; // -100 to 100, positive means better performance
  };
  alerts: SEOAlert[];
  recommendations: string[];
  nextCheck: Date;
}

export interface SEOAlert {
  id: string;
  type: 'performance' | 'compliance' | 'technical' | 'content' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  url?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actionRequired: string;
}

export interface MonitoringConfiguration {
  organizationId: string;
  urls: string[];
  checkInterval: 'hourly' | 'daily' | 'weekly';
  alertThresholds: {
    score: number;
    criticalIssues: number;
    highIssues: number;
  };
  healthcareSpecialty?: string;
  complianceLevel: 'basic' | 'comprehensive';
  enableAlerts: boolean;
  alertChannels: ('email' | 'webhook' | 'dashboard')[];
}

export class SEOHealthMonitor {
  private technicalChecker: TechnicalSEOChecker;
  private auditSystem: SEOAuditSystem;
  private complianceValidator: HealthcareComplianceValidator;
  private monitoringConfigs: Map<string, MonitoringConfiguration> = new Map();

  constructor() {
    this.technicalChecker = new TechnicalSEOChecker();
    this.auditSystem = new SEOAuditSystem();
    this.complianceValidator = new HealthcareComplianceValidator();
  }

  async startMonitoring(config: MonitoringConfiguration): Promise<void> {
    this.monitoringConfigs.set(config.organizationId, config);
    
    // Perform initial health check
    await this.performHealthCheck(config.organizationId);
    
    // Set up periodic monitoring
    this.schedulePeriodicChecks(config);
  }

  async stopMonitoring(organizationId: string): Promise<void> {
    this.monitoringConfigs.delete(organizationId);
  }

  async performHealthCheck(organizationId: string): Promise<SEOHealthStatus> {
    const config = this.monitoringConfigs.get(organizationId);
    if (!config) {
      throw new Error(`No monitoring configuration found for organization ${organizationId}`);
    }

    const healthStatus: SEOHealthStatus = {
      organizationId,
      overallHealth: 'excellent',
      score: 100,
      lastChecked: new Date(),
      issues: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      trends: {
        score: 0,
        issues: 0,
        performance: 0
      },
      alerts: [],
      recommendations: [],
      nextCheck: this.calculateNextCheck(config.checkInterval)
    };

    try {
      // Perform technical SEO checks on all URLs
      const technicalResults = await Promise.all(
        config.urls.map(url => this.technicalChecker.analyzePage(url))
      );

      // Calculate overall score and categorize issues
      let totalScore = 0;
      const allIssues: any[] = [];

      technicalResults.forEach(result => {
        totalScore += result.score;
        allIssues.push(...result.issues);
      });

      healthStatus.score = Math.round(totalScore / technicalResults.length);

      // Categorize issues by severity
      allIssues.forEach(issue => {
        switch (issue.impact) {
          case 'high':
            healthStatus.issues.critical++;
            break;
          case 'medium':
            healthStatus.issues.high++;
            break;
          case 'low':
            healthStatus.issues.medium++;
            break;
          default:
            healthStatus.issues.low++;
        }
      });

      // Determine overall health status
      healthStatus.overallHealth = this.determineHealthStatus(healthStatus.score, healthStatus.issues);

      // Generate alerts
      healthStatus.alerts = await this.generateAlerts(healthStatus, config);

      // Generate recommendations
      healthStatus.recommendations = this.generateRecommendations(healthStatus, allIssues);

      // Calculate trends (simplified - in real implementation, compare with historical data)
      healthStatus.trends = await this.calculateTrends(organizationId, healthStatus);

    } catch (error) {
      console.error('Health check failed:', error);
      healthStatus.overallHealth = 'critical';
      healthStatus.score = 0;
      healthStatus.alerts.push({
        id: `error_${Date.now()}`,
        type: 'technical',
        severity: 'critical',
        title: 'Health check failed',
        description: `Failed to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: 'Check system configuration and try again'
      });
    }

    return healthStatus;
  }

  async getHealthStatus(organizationId: string): Promise<SEOHealthStatus | null> {
    const config = this.monitoringConfigs.get(organizationId);
    if (!config) {
      return null;
    }

    return await this.performHealthCheck(organizationId);
  }

  async resolveAlert(organizationId: string, alertId: string): Promise<boolean> {
    // In a real implementation, this would update the database
    // For now, we'll just return true
    return true;
  }

  private schedulePeriodicChecks(config: MonitoringConfiguration): void {
    const intervalMs = this.getCheckIntervalMs(config.checkInterval);
    
    setInterval(async () => {
      try {
        await this.performHealthCheck(config.organizationId);
      } catch (error) {
        console.error(`Periodic health check failed for ${config.organizationId}:`, error);
      }
    }, intervalMs);
  }

  private getCheckIntervalMs(interval: string): number {
    switch (interval) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  private calculateNextCheck(interval: string): Date {
    const nextCheck = new Date();
    
    switch (interval) {
      case 'hourly':
        nextCheck.setHours(nextCheck.getHours() + 1);
        break;
      case 'daily':
        nextCheck.setDate(nextCheck.getDate() + 1);
        break;
      case 'weekly':
        nextCheck.setDate(nextCheck.getDate() + 7);
        break;
    }
    
    return nextCheck;
  }

  private determineHealthStatus(score: number, issues: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90 && issues.critical === 0) return 'excellent';
    if (score >= 80 && issues.critical <= 1) return 'good';
    if (score >= 70 && issues.critical <= 3) return 'fair';
    if (score >= 50 && issues.critical <= 5) return 'poor';
    return 'critical';
  }

  private async generateAlerts(healthStatus: SEOHealthStatus, config: MonitoringConfiguration): Promise<SEOAlert[]> {
    const alerts: SEOAlert[] = [];

    // Critical score alert
    if (healthStatus.score < config.alertThresholds.score) {
      alerts.push({
        id: `score_${Date.now()}`,
        type: 'technical',
        severity: 'critical',
        title: 'SEO Score Below Threshold',
        description: `Overall SEO score (${healthStatus.score}) is below the threshold (${config.alertThresholds.score})`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: 'Review and fix critical SEO issues immediately'
      });
    }

    // Critical issues alert
    if (healthStatus.issues.critical > config.alertThresholds.criticalIssues) {
      alerts.push({
        id: `critical_issues_${Date.now()}`,
        type: 'technical',
        severity: 'critical',
        title: 'Too Many Critical Issues',
        description: `${healthStatus.issues.critical} critical issues detected (threshold: ${config.alertThresholds.criticalIssues})`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: 'Address critical issues immediately to prevent further damage'
      });
    }

    // High issues alert
    if (healthStatus.issues.high > config.alertThresholds.highIssues) {
      alerts.push({
        id: `high_issues_${Date.now()}`,
        type: 'technical',
        severity: 'high',
        title: 'High Priority Issues Detected',
        description: `${healthStatus.issues.high} high-priority issues need attention`,
        timestamp: new Date(),
        resolved: false,
        actionRequired: 'Review and fix high-priority issues within 24 hours'
      });
    }

    // Healthcare compliance alert
    if (healthStatus.overallHealth === 'critical' || healthStatus.overallHealth === 'poor') {
      alerts.push({
        id: `compliance_${Date.now()}`,
        type: 'compliance',
        severity: 'high',
        title: 'Healthcare Compliance Risk',
        description: 'Poor SEO health may indicate compliance issues that need immediate attention',
        timestamp: new Date(),
        resolved: false,
        actionRequired: 'Review healthcare compliance requirements and ensure all content meets standards'
      });
    }

    return alerts;
  }

  private generateRecommendations(healthStatus: SEOHealthStatus, issues: any[]): string[] {
    const recommendations: string[] = [];

    if (healthStatus.issues.critical > 0) {
      recommendations.push('Address critical issues immediately to prevent search engine penalties');
    }

    if (healthStatus.issues.high > 0) {
      recommendations.push('Fix high-priority issues to improve search visibility');
    }

    if (healthStatus.score < 70) {
      recommendations.push('Focus on technical SEO improvements to boost overall score');
    }

    if (healthStatus.issues.medium > 5) {
      recommendations.push('Address medium-priority issues to optimize user experience');
    }

    // Healthcare-specific recommendations
    const healthcareIssues = issues.filter(issue => issue.category === 'healthcare');
    if (healthcareIssues.length > 0) {
      recommendations.push('Review healthcare compliance requirements and update content accordingly');
    }

    const performanceIssues = issues.filter(issue => issue.category === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push('Optimize page performance for better user experience and SEO');
    }

    const accessibilityIssues = issues.filter(issue => issue.category === 'accessibility');
    if (accessibilityIssues.length > 0) {
      recommendations.push('Improve accessibility to reach a broader audience and meet compliance requirements');
    }

    return recommendations;
  }

  private async calculateTrends(organizationId: string, currentHealth: SEOHealthStatus): Promise<{
    score: number;
    issues: number;
    performance: number;
  }> {
    // In a real implementation, this would compare with historical data
    // For now, return neutral trends
    return {
      score: 0,
      issues: 0,
      performance: 0
    };
  }

  // Public methods for external access
  async getActiveAlerts(organizationId: string): Promise<SEOAlert[]> {
    const healthStatus = await this.getHealthStatus(organizationId);
    return healthStatus?.alerts.filter(alert => !alert.resolved) || [];
  }

  async getHealthHistory(organizationId: string, days: number = 30): Promise<SEOHealthStatus[]> {
    // In a real implementation, this would fetch from database
    // For now, return empty array
    return [];
  }

  async updateMonitoringConfiguration(organizationId: string, config: Partial<MonitoringConfiguration>): Promise<void> {
    const existingConfig = this.monitoringConfigs.get(organizationId);
    if (existingConfig) {
      this.monitoringConfigs.set(organizationId, { ...existingConfig, ...config });
    }
  }

  async getMonitoringStatus(organizationId: string): Promise<{
    isActive: boolean;
    config?: MonitoringConfiguration;
    lastCheck?: Date;
    nextCheck?: Date;
  }> {
    const config = this.monitoringConfigs.get(organizationId);
    if (!config) {
      return { isActive: false };
    }

    const healthStatus = await this.getHealthStatus(organizationId);
    
    return {
      isActive: true,
      config,
      lastCheck: healthStatus?.lastChecked,
      nextCheck: healthStatus?.nextCheck
    };
  }
}
