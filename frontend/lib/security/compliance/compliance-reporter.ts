/**
 * Healthcare Compliance Report Generation Engine
 * 
 * Generates comprehensive compliance reports for healthcare frameworks:
 * - HIPAA (Health Insurance Portability and Accountability Act)
 * - HITRUST (Health Information Trust Alliance)
 * - SOC 2 (Service Organization Control 2)
 * - HITECH (Health Information Technology for Economic and Clinical Health)
 * 
 * Story 1.6 Task 8: Compliance Reporting & Audit Exports
 */

import * as crypto from 'crypto'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditSeverity, ComplianceFramework, type AuditLogEntry, type AuditQueryFilters } from '../audit-logging'

export interface ComplianceReportOptions {
  framework: ComplianceFramework
  reportType: 'summary' | 'detailed' | 'violation' | 'access_control' | 'data_integrity'
  dateRange: {
    start: string
    end: string
  }
  includeCharts?: boolean
  includeRecommendations?: boolean
  exportFormat: 'pdf' | 'json' | 'csv'
  customFilters?: AuditQueryFilters
}

export interface ComplianceMetrics {
  totalEvents: number
  criticalEvents: number
  warningEvents: number
  complianceViolations: number
  accessControlEvents: number
  dataIntegrityEvents: number
  authenticationFailures: number
  unauthorizedAccess: number
  phiAccessEvents: number
  dataModifications: number
  systemAdminActions: number
  riskScore: number
  complianceScore: number
}

export interface ComplianceReportData {
  id: string
  framework: ComplianceFramework
  reportType: string
  generatedAt: string
  reportingPeriod: {
    start: string
    end: string
  }
  metrics: ComplianceMetrics
  violations: ComplianceViolation[]
  recommendations: ComplianceRecommendation[]
  auditTrail: AuditLogEntry[]
  riskAssessment: RiskAssessment
  controlEffectiveness: ControlEffectiveness
}

export interface ComplianceViolation {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  description: string
  affectedSystems: string[]
  detectedAt: string
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  remediationSteps: string[]
  relatedAuditIds: string[]
}

export interface ComplianceRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'access_control' | 'data_protection' | 'monitoring' | 'training' | 'policy'
  title: string
  description: string
  implementationSteps: string[]
  expectedImpact: string
  estimatedEffort: string
}

export interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: {
    category: string
    level: number
    description: string
  }[]
  topThreats: {
    threat: string
    likelihood: number
    impact: number
    riskScore: number
  }[]
}

export interface ControlEffectiveness {
  accessControls: number
  auditControls: number
  integrityControls: number
  transmissionSecurity: number
  overallEffectiveness: number
}

export class ComplianceReporter {
  private static instance: ComplianceReporter
  
  private constructor() {}
  
  public static getInstance(): ComplianceReporter {
    if (!ComplianceReporter.instance) {
      ComplianceReporter.instance = new ComplianceReporter()
    }
    return ComplianceReporter.instance
  }
  
  /**
   * Generate comprehensive compliance report
   */
  async generateReport(options: ComplianceReportOptions): Promise<{
    success: boolean
    reportId?: string
    data?: ComplianceReportData
    exportedFile?: Buffer
    error?: string
  }> {
    try {
      logger.info('Generating compliance report', { framework: options.framework, type: options.reportType })
      
      // Generate unique report ID
      const reportId = `${options.framework}_${options.reportType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
      
      // Collect audit data for the reporting period
      const auditData = await this.collectAuditData(options)
      if (!auditData.success) {
        return { success: false, error: auditData.error }
      }
      
      // Calculate compliance metrics
      const metrics = this.calculateComplianceMetrics(auditData.logs!)
      
      // Analyze violations
      const violations = await this.analyzeViolations(auditData.logs!, options.framework)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, violations, options.framework)
      
      // Perform risk assessment
      const riskAssessment = this.performRiskAssessment(auditData.logs!, violations)
      
      // Evaluate control effectiveness
      const controlEffectiveness = this.evaluateControlEffectiveness(auditData.logs!, options.framework)
      
      // Compile report data
      const reportData: ComplianceReportData = {
        id: reportId,
        framework: options.framework,
        reportType: options.reportType,
        generatedAt: new Date().toISOString(),
        reportingPeriod: options.dateRange,
        metrics,
        violations,
        recommendations,
        auditTrail: auditData.logs!,
        riskAssessment,
        controlEffectiveness
      }
      
      // Export in requested format
      let exportedFile: Buffer | undefined
      if (options.exportFormat === 'pdf') {
        exportedFile = await this.generatePDFReport(reportData)
      } else if (options.exportFormat === 'csv') {
        exportedFile = await this.generateCSVReport(reportData)
      }
      
      // Store report metadata
      await this.storeReportMetadata(reportData)
      
      // Log report generation
      await auditLogger.logEvent({
        event_type: AuditEventType.COMPLIANCE_REPORT,
        severity: AuditSeverity.INFO,
        user_id: null, // System generated
        session_id: null,
        resource_type: 'compliance_report',
        resource_id: reportId,
        action_performed: 'compliance_report_generated',
        client_ip: '127.0.0.1',
        user_agent: 'Compliance-Reporter',
        request_id: crypto.randomUUID(),
        compliance_frameworks: [options.framework],
        sensitive_data_involved: true,
        status: 'success'
      })
      
      return {
        success: true,
        reportId,
        data: reportData,
        exportedFile
      }
      
    } catch (error) {
      logger.error('Compliance report generation failed', { error, options })
      return { success: false, error: 'Report generation failed' }
    }
  }
  
  /**
   * Collect audit data for compliance analysis
   */
  private async collectAuditData(options: ComplianceReportOptions): Promise<{
    success: boolean
    logs?: AuditLogEntry[]
    error?: string
  }> {
    const filters: AuditQueryFilters = {
      compliance_frameworks: [options.framework],
      date_range: options.dateRange,
      limit: 50000, // Large limit for comprehensive analysis
      ...options.customFilters
    }
    
    // Apply report type specific filters
    if (options.reportType === 'violation') {
      filters.status = ['failure', 'blocked']
    } else if (options.reportType === 'access_control') {
      filters.event_types = [
        AuditEventType.LOGIN,
        AuditEventType.LOGIN_FAILED,
        AuditEventType.ROLE_ASSIGNED,
        AuditEventType.PERMISSION_DENIED,
        AuditEventType.ELEVATED_ACCESS,
        AuditEventType.PHI_ACCESS
      ]
    } else if (options.reportType === 'data_integrity') {
      filters.event_types = [
        AuditEventType.DATA_CREATE,
        AuditEventType.DATA_UPDATE,
        AuditEventType.DATA_DELETE,
        AuditEventType.BULK_OPERATION
      ]
    }
    
    return await auditLogger.queryAuditLogs(filters)
  }
  
  /**
   * Calculate comprehensive compliance metrics
   */
  private calculateComplianceMetrics(logs: AuditLogEntry[]): ComplianceMetrics {
    const totalEvents = logs.length
    const criticalEvents = logs.filter(log => log.severity === AuditSeverity.CRITICAL).length
    const warningEvents = logs.filter(log => log.severity === AuditSeverity.WARNING).length
    const complianceViolations = logs.filter(log => log.status === 'blocked' || log.status === 'failure').length
    
    const accessControlEvents = logs.filter(log => 
      log.event_type.startsWith('authentication:') || 
      log.event_type.startsWith('authorization:')
    ).length
    
    const dataIntegrityEvents = logs.filter(log => 
      log.event_type.startsWith('data_modification:')
    ).length
    
    const authenticationFailures = logs.filter(log => 
      log.event_type === AuditEventType.LOGIN_FAILED
    ).length
    
    const unauthorizedAccess = logs.filter(log => 
      log.event_type === AuditEventType.ACCESS_VIOLATION
    ).length
    
    const phiAccessEvents = logs.filter(log => 
      log.event_type === AuditEventType.PHI_ACCESS || 
      log.event_type === AuditEventType.PHI_READ
    ).length
    
    const dataModifications = logs.filter(log => 
      log.event_type.startsWith('data_modification:')
    ).length
    
    const systemAdminActions = logs.filter(log => 
      log.event_type.startsWith('system_admin:')
    ).length
    
    // Calculate overall risk score (0-100)
    const avgRiskScore = logs.reduce((sum, log) => sum + (log.risk_score || 0), 0) / totalEvents
    const riskScore = Math.round(avgRiskScore * 10)
    
    // Calculate compliance score (0-100, higher is better)
    const violationRate = totalEvents > 0 ? complianceViolations / totalEvents : 0
    const criticalRate = totalEvents > 0 ? criticalEvents / totalEvents : 0
    const complianceScore = Math.round(100 - (violationRate * 50) - (criticalRate * 30) - (riskScore * 0.2))
    
    return {
      totalEvents,
      criticalEvents,
      warningEvents,
      complianceViolations,
      accessControlEvents,
      dataIntegrityEvents,
      authenticationFailures,
      unauthorizedAccess,
      phiAccessEvents,
      dataModifications,
      systemAdminActions,
      riskScore: Math.min(Math.max(riskScore, 0), 100),
      complianceScore: Math.min(Math.max(complianceScore, 0), 100)
    }
  }
  
  /**
   * Analyze potential compliance violations
   */
  private async analyzeViolations(logs: AuditLogEntry[], framework: ComplianceFramework): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []
    
    // Group events by type for pattern analysis
    const failedLogins = logs.filter(log => log.event_type === AuditEventType.LOGIN_FAILED)
    const accessViolations = logs.filter(log => log.event_type === AuditEventType.ACCESS_VIOLATION)
    const unauthorizedPHI = logs.filter(log => 
      log.event_type === AuditEventType.PHI_ACCESS && log.status === 'blocked'
    )
    
    // Analyze excessive failed login attempts
    if (failedLogins.length > 10) {
      violations.push({
        id: crypto.randomUUID(),
        severity: failedLogins.length > 50 ? 'critical' : 'high',
        type: 'authentication_security',
        description: `Excessive failed login attempts detected (${failedLogins.length} attempts)`,
        affectedSystems: ['authentication_system'],
        detectedAt: new Date().toISOString(),
        status: 'open',
        remediationSteps: [
          'Implement account lockout policies',
          'Enable multi-factor authentication',
          'Review user access patterns',
          'Consider IP-based access restrictions'
        ],
        relatedAuditIds: failedLogins.map(log => log.id!).filter(Boolean)
      })
    }
    
    // Analyze access control violations
    if (accessViolations.length > 0) {
      violations.push({
        id: crypto.randomUUID(),
        severity: 'critical',
        type: 'access_control_violation',
        description: `Unauthorized access attempts detected (${accessViolations.length} violations)`,
        affectedSystems: ['access_control_system'],
        detectedAt: new Date().toISOString(),
        status: 'investigating',
        remediationSteps: [
          'Review user permissions and roles',
          'Audit access control policies',
          'Implement principle of least privilege',
          'Consider additional monitoring controls'
        ],
        relatedAuditIds: accessViolations.map(log => log.id!).filter(Boolean)
      })
    }
    
    // HIPAA-specific violations
    if (framework === ComplianceFramework.HIPAA) {
      if (unauthorizedPHI.length > 0) {
        violations.push({
          id: crypto.randomUUID(),
          severity: 'critical',
          type: 'phi_access_violation',
          description: `Unauthorized PHI access attempts (${unauthorizedPHI.length} attempts)`,
          affectedSystems: ['phi_access_system'],
          detectedAt: new Date().toISOString(),
          status: 'investigating',
          remediationSteps: [
            'Immediate review of PHI access controls',
            'Audit user permissions for PHI access',
            'Implement minimum necessary standard',
            'Enhance PHI access monitoring'
          ],
          relatedAuditIds: unauthorizedPHI.map(log => log.id!).filter(Boolean)
        })
      }
    }
    
    return violations
  }
  
  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(
    metrics: ComplianceMetrics, 
    violations: ComplianceViolation[], 
    framework: ComplianceFramework
  ): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = []
    
    // Recommendation based on authentication failures
    if (metrics.authenticationFailures > 20) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'high',
        category: 'access_control',
        title: 'Strengthen Authentication Controls',
        description: 'High number of authentication failures detected. Implement stronger authentication mechanisms.',
        implementationSteps: [
          'Enable multi-factor authentication for all users',
          'Implement account lockout after failed attempts',
          'Add CAPTCHA for repeated failures',
          'Consider risk-based authentication'
        ],
        expectedImpact: 'Reduce unauthorized access risk by 80%',
        estimatedEffort: '2-3 weeks'
      })
    }
    
    // Low compliance score recommendations
    if (metrics.complianceScore < 70) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'critical',
        category: 'monitoring',
        title: 'Enhance Compliance Monitoring',
        description: 'Compliance score is below acceptable threshold. Implement comprehensive monitoring.',
        implementationSteps: [
          'Review and update audit logging policies',
          'Implement real-time compliance monitoring',
          'Establish compliance reporting cadence',
          'Train staff on compliance requirements'
        ],
        expectedImpact: 'Improve compliance score to 85+',
        estimatedEffort: '4-6 weeks'
      })
    }
    
    // Framework-specific recommendations
    if (framework === ComplianceFramework.HIPAA) {
      if (metrics.phiAccessEvents > 1000) {
        recommendations.push({
          id: crypto.randomUUID(),
          priority: 'medium',
          category: 'data_protection',
          title: 'Implement PHI Access Governance',
          description: 'High volume of PHI access detected. Establish minimum necessary access controls.',
          implementationSteps: [
            'Audit PHI access patterns',
            'Implement role-based PHI access',
            'Establish minimum necessary policies',
            'Add PHI access justification requirements'
          ],
          expectedImpact: 'Reduce unnecessary PHI exposure by 60%',
          estimatedEffort: '3-4 weeks'
        })
      }
    }
    
    return recommendations
  }
  
  /**
   * Perform comprehensive risk assessment
   */
  private performRiskAssessment(logs: AuditLogEntry[], violations: ComplianceViolation[]): RiskAssessment {
    const riskFactors = [
      {
        category: 'Authentication Security',
        level: this.calculateAuthRiskLevel(logs),
        description: 'Risk from authentication-related events'
      },
      {
        category: 'Data Access Control',
        level: this.calculateAccessRiskLevel(logs),
        description: 'Risk from data access control events'
      },
      {
        category: 'System Administration',
        level: this.calculateAdminRiskLevel(logs),
        description: 'Risk from system administration activities'
      }
    ]
    
    const overallRiskLevel = this.calculateOverallRisk(riskFactors, violations)
    
    const topThreats = [
      {
        threat: 'Unauthorized Data Access',
        likelihood: Math.min(logs.filter(log => log.event_type === AuditEventType.ACCESS_VIOLATION).length / 10, 10),
        impact: 9,
        riskScore: 0
      },
      {
        threat: 'Authentication Bypass',
        likelihood: Math.min(logs.filter(log => log.event_type === AuditEventType.LOGIN_FAILED).length / 20, 10),
        impact: 8,
        riskScore: 0
      },
      {
        threat: 'Data Integrity Compromise',
        likelihood: Math.min(logs.filter(log => log.event_type.startsWith('data_modification:')).length / 100, 10),
        impact: 7,
        riskScore: 0
      }
    ].map(threat => ({
      ...threat,
      riskScore: Math.round((threat.likelihood * threat.impact) / 10)
    }))
    
    return {
      overallRiskLevel,
      riskFactors,
      topThreats
    }
  }
  
  /**
   * Evaluate control effectiveness
   */
  private evaluateControlEffectiveness(logs: AuditLogEntry[], framework: ComplianceFramework): ControlEffectiveness {
    const totalEvents = logs.length
    const failedEvents = logs.filter(log => log.status === 'failure' || log.status === 'blocked').length
    
    const accessControls = this.calculateControlEffectiveness(logs, 'authentication:', 'authorization:')
    const auditControls = this.calculateControlEffectiveness(logs, 'compliance:')
    const integrityControls = this.calculateControlEffectiveness(logs, 'data_modification:')
    const transmissionSecurity = this.calculateControlEffectiveness(logs, 'system:')
    
    const overallEffectiveness = Math.round(
      (accessControls + auditControls + integrityControls + transmissionSecurity) / 4
    )
    
    return {
      accessControls,
      auditControls,
      integrityControls,
      transmissionSecurity,
      overallEffectiveness
    }
  }
  
  /**
   * Generate PDF compliance report
   */
  private async generatePDFReport(reportData: ComplianceReportData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Title page
    const titlePage = pdfDoc.addPage([612, 792])
    titlePage.drawText('Compliance Report', {
      x: 50,
      y: 700,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    
    titlePage.drawText(`Framework: ${reportData.framework.toUpperCase()}`, {
      x: 50,
      y: 650,
      size: 16,
      font: font
    })
    
    titlePage.drawText(`Report Period: ${reportData.reportingPeriod.start} to ${reportData.reportingPeriod.end}`, {
      x: 50,
      y: 620,
      size: 12,
      font: font
    })
    
    titlePage.drawText(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, {
      x: 50,
      y: 590,
      size: 12,
      font: font
    })
    
    // Compliance Score
    const scoreColor = reportData.metrics.complianceScore >= 80 ? rgb(0, 0.8, 0) : 
                      reportData.metrics.complianceScore >= 60 ? rgb(1, 0.6, 0) : rgb(1, 0, 0)
    
    titlePage.drawText(`Compliance Score: ${reportData.metrics.complianceScore}/100`, {
      x: 50,
      y: 550,
      size: 18,
      font: boldFont,
      color: scoreColor
    })
    
    // Summary metrics page
    const summaryPage = pdfDoc.addPage([612, 792])
    let yPosition = 750
    
    summaryPage.drawText('Executive Summary', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont
    })
    
    yPosition -= 40
    const metricsText = [
      `Total Events: ${reportData.metrics.totalEvents}`,
      `Critical Events: ${reportData.metrics.criticalEvents}`,
      `Compliance Violations: ${reportData.metrics.complianceViolations}`,
      `Access Control Events: ${reportData.metrics.accessControlEvents}`,
      `PHI Access Events: ${reportData.metrics.phiAccessEvents}`,
      `Risk Score: ${reportData.metrics.riskScore}/100`
    ]
    
    metricsText.forEach(text => {
      summaryPage.drawText(text, {
        x: 50,
        y: yPosition,
        size: 12,
        font: font
      })
      yPosition -= 25
    })
    
    // Violations page
    if (reportData.violations.length > 0) {
      const violationsPage = pdfDoc.addPage([612, 792])
      yPosition = 750
      
      violationsPage.drawText('Compliance Violations', {
        x: 50,
        y: yPosition,
        size: 20,
        font: boldFont
      })
      
      yPosition -= 30
      
      reportData.violations.forEach((violation, index) => {
        if (yPosition < 100) {
          violationsPage.addPage([612, 792])
          yPosition = 750
        }
        
        violationsPage.drawText(`${index + 1}. ${violation.title || violation.type}`, {
          x: 50,
          y: yPosition,
          size: 14,
          font: boldFont
        })
        
        yPosition -= 20
        
        violationsPage.drawText(`Severity: ${violation.severity.toUpperCase()}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font: font
        })
        
        yPosition -= 15
        
        violationsPage.drawText(violation.description, {
          x: 60,
          y: yPosition,
          size: 10,
          font: font
        })
        
        yPosition -= 30
      })
    }
    
    return await pdfDoc.save()
  }
  
  /**
   * Generate CSV compliance report
   */
  private async generateCSVReport(reportData: ComplianceReportData): Promise<Buffer> {
    const csvRows = [
      'Report ID,Framework,Type,Generated At,Start Date,End Date,Total Events,Critical Events,Compliance Score,Risk Score'
    ]
    
    csvRows.push([
      reportData.id,
      reportData.framework,
      reportData.reportType,
      reportData.generatedAt,
      reportData.reportingPeriod.start,
      reportData.reportingPeriod.end,
      reportData.metrics.totalEvents.toString(),
      reportData.metrics.criticalEvents.toString(),
      reportData.metrics.complianceScore.toString(),
      reportData.metrics.riskScore.toString()
    ].join(','))
    
    // Add violations
    if (reportData.violations.length > 0) {
      csvRows.push('')
      csvRows.push('Violations')
      csvRows.push('ID,Severity,Type,Description,Status,Detected At')
      
      reportData.violations.forEach(violation => {
        csvRows.push([
          violation.id,
          violation.severity,
          violation.type,
          `"${violation.description.replace(/"/g, '""')}"`,
          violation.status,
          violation.detectedAt
        ].join(','))
      })
    }
    
    return Buffer.from(csvRows.join('\n'), 'utf-8')
  }
  
  /**
   * Store report metadata in database
   */
  private async storeReportMetadata(reportData: ComplianceReportData): Promise<void> {
    try {
      const supabase = createClient()
      
      await supabase.from('compliance_reports').insert({
        id: reportData.id,
        framework: reportData.framework,
        report_type: reportData.reportType,
        generated_at: reportData.generatedAt,
        reporting_period_start: reportData.reportingPeriod.start,
        reporting_period_end: reportData.reportingPeriod.end,
        compliance_score: reportData.metrics.complianceScore,
        risk_score: reportData.metrics.riskScore,
        total_events: reportData.metrics.totalEvents,
        critical_events: reportData.metrics.criticalEvents,
        violations_count: reportData.violations.length,
        recommendations_count: reportData.recommendations.length,
        metadata: {
          metrics: reportData.metrics,
          riskAssessment: reportData.riskAssessment,
          controlEffectiveness: reportData.controlEffectiveness
        }
      })
      
    } catch (error) {
      logger.error('Failed to store report metadata', { error, reportId: reportData.id })
    }
  }
  
  // Helper methods for risk calculations
  private calculateAuthRiskLevel(logs: AuditLogEntry[]): number {
    const authEvents = logs.filter(log => log.event_type.startsWith('authentication:'))
    const failedAuth = logs.filter(log => log.event_type === AuditEventType.LOGIN_FAILED)
    
    if (authEvents.length === 0) return 0
    
    const failureRate = failedAuth.length / authEvents.length
    return Math.min(Math.round(failureRate * 10), 10)
  }
  
  private calculateAccessRiskLevel(logs: AuditLogEntry[]): number {
    const accessEvents = logs.filter(log => log.event_type.startsWith('data_access:'))
    const violations = logs.filter(log => log.event_type === AuditEventType.ACCESS_VIOLATION)
    
    if (accessEvents.length === 0) return 0
    
    const violationRate = violations.length / accessEvents.length
    return Math.min(Math.round(violationRate * 10), 10)
  }
  
  private calculateAdminRiskLevel(logs: AuditLogEntry[]): number {
    const adminEvents = logs.filter(log => log.event_type.startsWith('system_admin:'))
    const failedAdmin = adminEvents.filter(log => log.status === 'failure')
    
    if (adminEvents.length === 0) return 0
    
    const failureRate = failedAdmin.length / adminEvents.length
    return Math.min(Math.round(failureRate * 10), 10)
  }
  
  private calculateOverallRisk(
    riskFactors: { level: number }[], 
    violations: ComplianceViolation[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const avgRisk = riskFactors.reduce((sum, factor) => sum + factor.level, 0) / riskFactors.length
    const criticalViolations = violations.filter(v => v.severity === 'critical').length
    
    if (criticalViolations > 0 || avgRisk >= 8) return 'critical'
    if (avgRisk >= 6) return 'high'
    if (avgRisk >= 3) return 'medium'
    return 'low'
  }
  
  private calculateControlEffectiveness(logs: AuditLogEntry[], ...eventPrefixes: string[]): number {
    const relevantEvents = logs.filter(log => 
      eventPrefixes.some(prefix => log.event_type.startsWith(prefix))
    )
    
    if (relevantEvents.length === 0) return 100
    
    const successfulEvents = relevantEvents.filter(log => log.status === 'success')
    const effectiveness = (successfulEvents.length / relevantEvents.length) * 100
    
    return Math.round(effectiveness)
  }
}

// Export singleton instance
export const complianceReporter = ComplianceReporter.getInstance()

export default ComplianceReporter