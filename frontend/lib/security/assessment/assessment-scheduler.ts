/**
 * Security Assessment Scheduling System
 * Automated and scheduled security assessments
 */

import { logger } from '@/lib/logger'
import { securityScanner, ScanType, ScanScope, SecurityScan } from './security-scanner'
import { vulnerabilityAnalyzer } from './vulnerability-analyzer'
import { recommendationEngine, OrganizationProfile } from './recommendation-engine'
import { auditLogger, AuditEventType, AuditOutcome } from '../audit-logging'

export interface AssessmentSchedule {
  id: string
  name: string
  description: string
  enabled: boolean
  schedule: ScheduleConfig
  scanTypes: ScanType[]
  scope: ScanScope
  notifications: NotificationConfig
  lastRun?: Date
  nextRun: Date
  history: AssessmentRun[]
  metadata: ScheduleMetadata
}

export interface ScheduleConfig {
  type: 'cron' | 'interval' | 'manual' | 'event-driven'
  cronExpression?: string // For cron type
  intervalMinutes?: number // For interval type
  triggers?: EventTrigger[] // For event-driven
  timezone: string
  blackoutWindows?: BlackoutWindow[]
}

export interface EventTrigger {
  type: 'deployment' | 'code_change' | 'config_change' | 'threat_detected' | 'compliance_deadline'
  conditions?: Record<string, any>
}

export interface BlackoutWindow {
  start: string // Time in HH:MM format
  end: string
  days?: string[] // Days of week
  reason?: string
}

export interface NotificationConfig {
  enabled: boolean
  recipients: NotificationRecipient[]
  channels: NotificationChannel[]
  conditions: NotificationCondition[]
  template?: string
}

export interface NotificationRecipient {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  address: string
  role?: string
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook'
  config: Record<string, any>
}

export interface NotificationCondition {
  event: 'scan_started' | 'scan_completed' | 'critical_vulnerability' | 'scan_failed' | 'compliance_failure'
  severity?: string
}

export interface AssessmentRun {
  id: string
  scheduleId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  scanId?: string
  results?: AssessmentResults
  error?: string
}

export interface AssessmentResults {
  scanResults: SecurityScan
  vulnerabilityCount: {
    critical: number
    high: number
    medium: number
    low: number
  }
  complianceStatus: {
    passed: number
    failed: number
    partial: number
  }
  recommendations: number
  scoreChange: number
  trends: SecurityTrends
}

export interface SecurityTrends {
  vulnerabilityTrend: 'increasing' | 'stable' | 'decreasing'
  complianceTrend: 'improving' | 'stable' | 'declining'
  scoreTrend: 'improving' | 'stable' | 'declining'
  comparison: TrendComparison
}

export interface TrendComparison {
  previousScore: number
  currentScore: number
  percentageChange: number
  newVulnerabilities: number
  fixedVulnerabilities: number
  newComplianceIssues: number
  resolvedComplianceIssues: number
}

export interface ScheduleMetadata {
  createdBy: string
  createdAt: Date
  updatedBy?: string
  updatedAt?: Date
  tags?: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  complianceFrameworks?: string[]
}

export class AssessmentScheduler {
  private schedules: Map<string, AssessmentSchedule> = new Map()
  private runningAssessments: Map<string, AssessmentRun> = new Map()
  private schedulerInterval: NodeJS.Timeout | null = null
  private organizationProfile: OrganizationProfile
  
  constructor() {
    this.organizationProfile = this.loadOrganizationProfile()
    this.initializeDefaultSchedules()
    this.startScheduler()
  }
  
  /**
   * Create a new assessment schedule
   */
  async createSchedule(
    name: string,
    config: ScheduleConfig,
    scanTypes: ScanType[],
    scope: ScanScope,
    notifications?: NotificationConfig
  ): Promise<AssessmentSchedule> {
    const scheduleId = this.generateScheduleId()
    
    const schedule: AssessmentSchedule = {
      id: scheduleId,
      name,
      description: `Automated security assessment: ${name}`,
      enabled: true,
      schedule: config,
      scanTypes,
      scope,
      notifications: notifications || this.getDefaultNotifications(),
      nextRun: this.calculateNextRun(config),
      history: [],
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        priority: this.determinePriority(scanTypes),
        complianceFrameworks: this.identifyFrameworks(scanTypes)
      }
    }
    
    this.schedules.set(scheduleId, schedule)
    
    // Log schedule creation
    await auditLogger.logSecurityEvent({
      eventType: AuditEventType.CONFIGURATION_CHANGE,
      resource: `assessment_schedule_${scheduleId}`,
      outcome: AuditOutcome.SUCCESS,
      userId: 'system',
      details: {
        action: 'create_schedule',
        name,
        scanTypes,
        schedule: config
      }
    })
    
    logger.info('Assessment schedule created:', { scheduleId, name })
    
    return schedule
  }
  
  /**
   * Run a scheduled assessment
   */
  async runScheduledAssessment(scheduleId: string): Promise<AssessmentRun> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`)
    }
    
    if (!schedule.enabled) {
      throw new Error(`Schedule ${scheduleId} is disabled`)
    }
    
    const runId = this.generateRunId()
    const run: AssessmentRun = {
      id: runId,
      scheduleId,
      startTime: new Date(),
      status: 'running'
    }
    
    this.runningAssessments.set(runId, run)
    
    // Send start notification
    await this.sendNotification(schedule, 'scan_started', run)
    
    try {
      // Run assessments based on scan types
      const results = await this.executeAssessments(schedule)
      
      run.endTime = new Date()
      run.status = 'completed'
      run.results = results
      run.scanId = results.scanResults.id
      
      // Update schedule
      schedule.lastRun = run.startTime
      schedule.nextRun = this.calculateNextRun(schedule.schedule)
      schedule.history.push(run)
      
      // Keep only last 100 runs in history
      if (schedule.history.length > 100) {
        schedule.history = schedule.history.slice(-100)
      }
      
      // Check for critical findings
      if (results.vulnerabilityCount.critical > 0) {
        await this.sendNotification(schedule, 'critical_vulnerability', run, results)
      }
      
      // Check for compliance failures
      if (results.complianceStatus.failed > 0) {
        await this.sendNotification(schedule, 'compliance_failure', run, results)
      }
      
      // Send completion notification
      await this.sendNotification(schedule, 'scan_completed', run, results)
      
      // Log assessment completion
      await auditLogger.logSecurityEvent({
        eventType: AuditEventType.SECURITY_SCAN,
        resource: `assessment_${runId}`,
        outcome: AuditOutcome.SUCCESS,
        userId: 'system',
        details: {
          scheduleId,
          vulnerabilities: results.vulnerabilityCount,
          compliance: results.complianceStatus,
          score: results.scanResults.score
        }
      })
      
    } catch (error) {
      run.endTime = new Date()
      run.status = 'failed'
      run.error = error instanceof Error ? error.message : 'Unknown error'
      
      // Send failure notification
      await this.sendNotification(schedule, 'scan_failed', run)
      
      logger.error('Scheduled assessment failed:', { runId, scheduleId, error })
      
      await auditLogger.logSecurityEvent({
        eventType: AuditEventType.SECURITY_SCAN,
        resource: `assessment_${runId}`,
        outcome: AuditOutcome.FAILURE,
        userId: 'system',
        details: {
          scheduleId,
          error: run.error
        }
      })
    } finally {
      this.runningAssessments.delete(runId)
    }
    
    return run
  }
  
  /**
   * Execute assessments based on schedule configuration
   */
  private async executeAssessments(schedule: AssessmentSchedule): Promise<AssessmentResults> {
    // Determine scan type to run
    const primaryScanType = this.getPrimaryScanType(schedule.scanTypes)
    
    // Run security scan
    const scan = await securityScanner.runScan(
      primaryScanType,
      schedule.scope,
      {
        triggeredBy: `schedule_${schedule.id}`
      }
    )
    
    // Wait for scan completion
    await this.waitForScanCompletion(scan.id)
    
    // Get completed scan
    const completedScan = securityScanner.getScan(scan.id)
    if (!completedScan) {
      throw new Error('Scan results not found')
    }
    
    // Analyze vulnerabilities
    for (const vulnerability of completedScan.vulnerabilities) {
      await vulnerabilityAnalyzer.analyzeVulnerability(vulnerability)
    }
    
    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations({
      vulnerabilities: completedScan.vulnerabilities,
      analyses: completedScan.vulnerabilities.map(v => 
        vulnerabilityAnalyzer.getAnalysis(v.id)!
      ).filter(Boolean),
      complianceResults: completedScan.complianceResults,
      securityScore: completedScan.score,
      scanResults: completedScan.results,
      organizationProfile: this.organizationProfile
    })
    
    // Calculate vulnerability counts
    const vulnerabilityCount = {
      critical: completedScan.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: completedScan.vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: completedScan.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: completedScan.vulnerabilities.filter(v => v.severity === 'LOW').length
    }
    
    // Calculate compliance status
    const complianceStatus = {
      passed: completedScan.complianceResults.filter(r => r.status === 'PASS').length,
      failed: completedScan.complianceResults.filter(r => r.status === 'FAIL').length,
      partial: completedScan.complianceResults.filter(r => r.status === 'PARTIAL').length
    }
    
    // Calculate trends
    const trends = this.calculateTrends(schedule, completedScan)
    
    return {
      scanResults: completedScan,
      vulnerabilityCount,
      complianceStatus,
      recommendations: recommendations.length,
      scoreChange: trends.comparison.percentageChange,
      trends
    }
  }
  
  /**
   * Wait for scan completion
   */
  private async waitForScanCompletion(scanId: string, maxWaitMs: number = 3600000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitMs) {
      const scan = securityScanner.getScan(scanId)
      
      if (!scan) {
        throw new Error('Scan not found')
      }
      
      if (scan.status === 'COMPLETED' || scan.status === 'FAILED') {
        return
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    throw new Error('Scan timeout')
  }
  
  /**
   * Calculate security trends
   */
  private calculateTrends(schedule: AssessmentSchedule, currentScan: SecurityScan): SecurityTrends {
    // Get previous scan from history
    const previousRun = schedule.history
      .filter(h => h.status === 'completed' && h.results)
      .slice(-2)[0] // Get second to last completed run
    
    if (!previousRun || !previousRun.results) {
      return {
        vulnerabilityTrend: 'stable',
        complianceTrend: 'stable',
        scoreTrend: 'stable',
        comparison: {
          previousScore: currentScan.score.overall,
          currentScore: currentScan.score.overall,
          percentageChange: 0,
          newVulnerabilities: currentScan.vulnerabilities.length,
          fixedVulnerabilities: 0,
          newComplianceIssues: currentScan.complianceResults.filter(r => r.status === 'FAIL').length,
          resolvedComplianceIssues: 0
        }
      }
    }
    
    const previousScan = previousRun.results.scanResults
    
    // Calculate vulnerability trend
    const currentVulnCount = currentScan.vulnerabilities.length
    const previousVulnCount = previousScan.vulnerabilities.length
    const vulnerabilityTrend = currentVulnCount > previousVulnCount ? 'increasing' :
                              currentVulnCount < previousVulnCount ? 'decreasing' : 'stable'
    
    // Calculate compliance trend
    const currentCompliance = currentScan.complianceResults.filter(r => r.status === 'PASS').length
    const previousCompliance = previousScan.complianceResults.filter(r => r.status === 'PASS').length
    const complianceTrend = currentCompliance > previousCompliance ? 'improving' :
                           currentCompliance < previousCompliance ? 'declining' : 'stable'
    
    // Calculate score trend
    const scoreTrend = currentScan.score.overall > previousScan.score.overall ? 'improving' :
                      currentScan.score.overall < previousScan.score.overall ? 'declining' : 'stable'
    
    // Calculate detailed comparison
    const percentageChange = previousScan.score.overall > 0 
      ? ((currentScan.score.overall - previousScan.score.overall) / previousScan.score.overall) * 100
      : 0
    
    // Find new and fixed vulnerabilities
    const previousVulnIds = new Set(previousScan.vulnerabilities.map(v => v.cve || v.id))
    const currentVulnIds = new Set(currentScan.vulnerabilities.map(v => v.cve || v.id))
    
    const newVulnerabilities = Array.from(currentVulnIds).filter(id => !previousVulnIds.has(id)).length
    const fixedVulnerabilities = Array.from(previousVulnIds).filter(id => !currentVulnIds.has(id)).length
    
    // Find compliance changes
    const previousFailures = new Set(
      previousScan.complianceResults
        .filter(r => r.status === 'FAIL')
        .map(r => r.requirement)
    )
    const currentFailures = new Set(
      currentScan.complianceResults
        .filter(r => r.status === 'FAIL')
        .map(r => r.requirement)
    )
    
    const newComplianceIssues = Array.from(currentFailures).filter(r => !previousFailures.has(r)).length
    const resolvedComplianceIssues = Array.from(previousFailures).filter(r => !currentFailures.has(r)).length
    
    return {
      vulnerabilityTrend,
      complianceTrend,
      scoreTrend,
      comparison: {
        previousScore: previousScan.score.overall,
        currentScore: currentScan.score.overall,
        percentageChange: Math.round(percentageChange * 10) / 10,
        newVulnerabilities,
        fixedVulnerabilities,
        newComplianceIssues,
        resolvedComplianceIssues
      }
    }
  }
  
  /**
   * Send notifications
   */
  private async sendNotification(
    schedule: AssessmentSchedule,
    event: NotificationCondition['event'],
    run: AssessmentRun,
    results?: AssessmentResults
  ): Promise<void> {
    if (!schedule.notifications.enabled) {
      return
    }
    
    const condition = schedule.notifications.conditions.find(c => c.event === event)
    if (!condition) {
      return
    }
    
    const message = this.formatNotificationMessage(schedule, event, run, results)
    
    for (const recipient of schedule.notifications.recipients) {
      try {
        await this.sendToRecipient(recipient, message, schedule.notifications.channels)
      } catch (error) {
        logger.error('Failed to send notification:', { recipient, error })
      }
    }
  }
  
  /**
   * Format notification message
   */
  private formatNotificationMessage(
    schedule: AssessmentSchedule,
    event: NotificationCondition['event'],
    run: AssessmentRun,
    results?: AssessmentResults
  ): string {
    const baseInfo = `Assessment: ${schedule.name}\nRun ID: ${run.id}\n`
    
    switch (event) {
      case 'scan_started':
        return `${baseInfo}Security assessment started at ${run.startTime.toISOString()}`
      
      case 'scan_completed':
        if (!results) return `${baseInfo}Assessment completed`
        return `${baseInfo}Assessment completed successfully\n` +
               `Score: ${results.scanResults.score.overall}/100 (${results.scanResults.score.grade})\n` +
               `Vulnerabilities: ${results.vulnerabilityCount.critical} critical, ${results.vulnerabilityCount.high} high\n` +
               `Compliance: ${results.complianceStatus.passed} passed, ${results.complianceStatus.failed} failed\n` +
               `Recommendations: ${results.recommendations}`
      
      case 'critical_vulnerability':
        if (!results) return `${baseInfo}Critical vulnerabilities detected`
        return `${baseInfo}⚠️ CRITICAL: ${results.vulnerabilityCount.critical} critical vulnerabilities detected!\n` +
               `Immediate action required. Review assessment results.`
      
      case 'scan_failed':
        return `${baseInfo}❌ Assessment failed: ${run.error || 'Unknown error'}`
      
      case 'compliance_failure':
        if (!results) return `${baseInfo}Compliance failures detected`
        return `${baseInfo}⚠️ Compliance Alert: ${results.complianceStatus.failed} compliance requirements failed\n` +
               `Review and remediate to maintain compliance.`
      
      default:
        return `${baseInfo}Assessment event: ${event}`
    }
  }
  
  /**
   * Send notification to recipient
   */
  private async sendToRecipient(
    recipient: NotificationRecipient,
    message: string,
    channels: NotificationChannel[]
  ): Promise<void> {
    // In production, integrate with actual notification services
    logger.info('Sending notification:', { recipient: recipient.address, message })
    
    // Simulate notification sending
    switch (recipient.type) {
      case 'email':
        // Send email via email service
        break
      case 'slack':
        // Send to Slack via webhook
        break
      case 'webhook':
        // POST to webhook URL
        break
      case 'sms':
        // Send SMS via SMS service
        break
    }
  }
  
  /**
   * Initialize default assessment schedules
   */
  private initializeDefaultSchedules(): void {
    // Daily OWASP scan
    this.createSchedule(
      'Daily OWASP Security Scan',
      {
        type: 'cron',
        cronExpression: '0 2 * * *', // 2 AM daily
        timezone: 'America/New_York',
        blackoutWindows: [
          {
            start: '00:00',
            end: '06:00',
            days: ['Saturday', 'Sunday'],
            reason: 'Weekend maintenance window'
          }
        ]
      },
      [ScanType.OWASP_TOP_10],
      {
        targets: ['https://api.hmhcp.com'],
        depth: 'normal',
        modules: ['web', 'api']
      }
    ).catch(error => {
      logger.error('Failed to create default OWASP schedule:', { error })
    })
    
    // Weekly HIPAA compliance scan
    this.createSchedule(
      'Weekly HIPAA Compliance Assessment',
      {
        type: 'cron',
        cronExpression: '0 3 * * 1', // 3 AM Monday
        timezone: 'America/New_York'
      },
      [ScanType.HIPAA_COMPLIANCE],
      {
        targets: ['https://api.hmhcp.com', 'https://app.hmhcp.com'],
        depth: 'deep',
        modules: ['compliance', 'audit']
      }
    ).catch(error => {
      logger.error('Failed to create default HIPAA schedule:', { error })
    })
    
    // Event-driven deployment scan
    this.createSchedule(
      'Post-Deployment Security Scan',
      {
        type: 'event-driven',
        triggers: [
          {
            type: 'deployment',
            conditions: { environment: 'production' }
          }
        ],
        timezone: 'UTC'
      },
      [ScanType.QUICK_SCAN],
      {
        targets: ['https://api.hmhcp.com'],
        depth: 'shallow',
        modules: ['web', 'api']
      }
    ).catch(error => {
      logger.error('Failed to create default deployment schedule:', { error })
    })
  }
  
  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    // Check schedules every minute
    this.schedulerInterval = setInterval(() => {
      this.checkSchedules()
    }, 60000) // 1 minute
    
    logger.info('Assessment scheduler started')
  }
  
  /**
   * Check and run due schedules
   */
  private async checkSchedules(): Promise<void> {
    const now = new Date()
    
    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled) continue
      
      // Check if schedule is due
      if (this.isScheduleDue(schedule, now)) {
        // Check if not in blackout window
        if (!this.isInBlackoutWindow(schedule, now)) {
          // Check if not already running
          const isRunning = Array.from(this.runningAssessments.values())
            .some(run => run.scheduleId === schedule.id && run.status === 'running')
          
          if (!isRunning) {
            this.runScheduledAssessment(schedule.id).catch(error => {
              logger.error('Failed to run scheduled assessment:', { 
                scheduleId: schedule.id,
                error
              })
            })
          }
        }
      }
    }
  }
  
  /**
   * Check if schedule is due
   */
  private isScheduleDue(schedule: AssessmentSchedule, now: Date): boolean {
    if (schedule.schedule.type === 'manual') {
      return false
    }
    
    if (schedule.schedule.type === 'event-driven') {
      // Event-driven schedules are triggered by events, not time
      return false
    }
    
    return schedule.nextRun <= now
  }
  
  /**
   * Check if in blackout window
   */
  private isInBlackoutWindow(schedule: AssessmentSchedule, now: Date): boolean {
    if (!schedule.schedule.blackoutWindows) {
      return false
    }
    
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    for (const window of schedule.schedule.blackoutWindows) {
      // Check day of week
      if (window.days && !window.days.includes(dayOfWeek)) {
        continue
      }
      
      // Check time range
      if (currentTime >= window.start && currentTime <= window.end) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Calculate next run time
   */
  private calculateNextRun(config: ScheduleConfig): Date {
    const now = new Date()
    
    switch (config.type) {
      case 'interval':
        return new Date(now.getTime() + (config.intervalMinutes || 60) * 60000)
      
      case 'cron':
        // Simplified cron calculation (in production, use a cron parser)
        return this.calculateNextCronRun(config.cronExpression || '0 * * * *', now)
      
      case 'manual':
      case 'event-driven':
        return new Date(8640000000000000) // Max date (not scheduled)
      
      default:
        return new Date(now.getTime() + 86400000) // 24 hours
    }
  }
  
  /**
   * Calculate next cron run (simplified)
   */
  private calculateNextCronRun(cronExpression: string, from: Date): Date {
    // This is a simplified implementation
    // In production, use a proper cron parser like node-cron
    
    const parts = cronExpression.split(' ')
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    
    const next = new Date(from)
    
    // Simple daily schedule at specific hour/minute
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      next.setHours(parseInt(hour) || 0)
      next.setMinutes(parseInt(minute) || 0)
      next.setSeconds(0)
      next.setMilliseconds(0)
      
      if (next <= from) {
        next.setDate(next.getDate() + 1)
      }
      
      return next
    }
    
    // Default to 24 hours from now
    return new Date(from.getTime() + 86400000)
  }
  
  /**
   * Get primary scan type
   */
  private getPrimaryScanType(scanTypes: ScanType[]): ScanType {
    // Prioritize comprehensive scans
    if (scanTypes.includes(ScanType.FULL_SCAN)) return ScanType.FULL_SCAN
    if (scanTypes.includes(ScanType.DEEP_SCAN)) return ScanType.DEEP_SCAN
    if (scanTypes.includes(ScanType.OWASP_TOP_10)) return ScanType.OWASP_TOP_10
    if (scanTypes.includes(ScanType.HIPAA_COMPLIANCE)) return ScanType.HIPAA_COMPLIANCE
    
    return scanTypes[0] || ScanType.QUICK_SCAN
  }
  
  /**
   * Load organization profile
   */
  private loadOrganizationProfile(): OrganizationProfile {
    // In production, load from database or configuration
    return {
      industry: 'healthcare',
      size: 'enterprise',
      regulatoryRequirements: ['HIPAA', 'HITECH', 'GDPR'],
      securityMaturity: 'defined',
      budget: 'substantial',
      technicalCapabilities: 'advanced',
      currentTools: ['WAF', 'SIEM', 'DLP', 'EDR'],
      priorities: ['PHI Protection', 'Compliance', 'Availability']
    }
  }
  
  /**
   * Determine priority based on scan types
   */
  private determinePriority(scanTypes: ScanType[]): AssessmentSchedule['metadata']['priority'] {
    if (scanTypes.includes(ScanType.HIPAA_COMPLIANCE) || 
        scanTypes.includes(ScanType.HITRUST_COMPLIANCE)) {
      return 'critical'
    }
    
    if (scanTypes.includes(ScanType.OWASP_TOP_10) ||
        scanTypes.includes(ScanType.FULL_SCAN)) {
      return 'high'
    }
    
    if (scanTypes.includes(ScanType.API_SECURITY) ||
        scanTypes.includes(ScanType.AUTH_SECURITY)) {
      return 'medium'
    }
    
    return 'low'
  }
  
  /**
   * Identify compliance frameworks
   */
  private identifyFrameworks(scanTypes: ScanType[]): string[] {
    const frameworks: string[] = []
    
    if (scanTypes.includes(ScanType.HIPAA_COMPLIANCE)) frameworks.push('HIPAA')
    if (scanTypes.includes(ScanType.HITRUST_COMPLIANCE)) frameworks.push('HITRUST')
    if (scanTypes.includes(ScanType.PCI_DSS_COMPLIANCE)) frameworks.push('PCI DSS')
    if (scanTypes.includes(ScanType.GDPR_COMPLIANCE)) frameworks.push('GDPR')
    if (scanTypes.includes(ScanType.OWASP_TOP_10)) frameworks.push('OWASP')
    
    return frameworks
  }
  
  /**
   * Get default notification configuration
   */
  private getDefaultNotifications(): NotificationConfig {
    return {
      enabled: true,
      recipients: [
        {
          type: 'email',
          address: 'security-team@hmhcp.com',
          role: 'security'
        }
      ],
      channels: [
        {
          type: 'email',
          config: {}
        }
      ],
      conditions: [
        { event: 'scan_started' },
        { event: 'scan_completed' },
        { event: 'critical_vulnerability' },
        { event: 'scan_failed' },
        { event: 'compliance_failure' }
      ]
    }
  }
  
  /**
   * Generate unique schedule ID
   */
  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Get schedule by ID
   */
  getSchedule(scheduleId: string): AssessmentSchedule | undefined {
    return this.schedules.get(scheduleId)
  }
  
  /**
   * Get all schedules
   */
  getAllSchedules(): AssessmentSchedule[] {
    return Array.from(this.schedules.values())
  }
  
  /**
   * Update schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<AssessmentSchedule>
  ): Promise<AssessmentSchedule> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`)
    }
    
    Object.assign(schedule, updates)
    
    if (updates.schedule) {
      schedule.nextRun = this.calculateNextRun(updates.schedule)
    }
    
    schedule.metadata.updatedBy = 'system'
    schedule.metadata.updatedAt = new Date()
    
    await auditLogger.logConfigurationChange({
      resource: `assessment_schedule_${scheduleId}`,
      userId: 'system',
      changes: updates,
      outcome: AuditOutcome.SUCCESS
    })
    
    return schedule
  }
  
  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`)
    }
    
    this.schedules.delete(scheduleId)
    
    await auditLogger.logConfigurationChange({
      resource: `assessment_schedule_${scheduleId}`,
      userId: 'system',
      changes: { action: 'delete' },
      outcome: AuditOutcome.SUCCESS
    })
  }
  
  /**
   * Trigger event-driven schedule
   */
  async triggerEventSchedule(eventType: EventTrigger['type'], conditions?: Record<string, any>): Promise<void> {
    const eventSchedules = Array.from(this.schedules.values()).filter(s => 
      s.enabled &&
      s.schedule.type === 'event-driven' &&
      s.schedule.triggers?.some(t => 
        t.type === eventType &&
        this.matchesConditions(t.conditions, conditions)
      )
    )
    
    for (const schedule of eventSchedules) {
      await this.runScheduledAssessment(schedule.id).catch(error => {
        logger.error('Failed to run event-triggered assessment:', {
          scheduleId: schedule.id,
          eventType,
          error
        })
      })
    }
  }
  
  /**
   * Check if conditions match
   */
  private matchesConditions(
    triggerConditions?: Record<string, any>,
    eventConditions?: Record<string, any>
  ): boolean {
    if (!triggerConditions) return true
    if (!eventConditions) return false
    
    for (const [key, value] of Object.entries(triggerConditions)) {
      if (eventConditions[key] !== value) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
    
    logger.info('Assessment scheduler stopped')
  }
}

// Export singleton instance
export const assessmentScheduler = new AssessmentScheduler()