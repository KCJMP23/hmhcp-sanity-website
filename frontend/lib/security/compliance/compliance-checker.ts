/**
 * Automated Compliance Checking System
 * 
 * Real-time compliance monitoring and automated checking for healthcare frameworks:
 * - HIPAA compliance validation
 * - HITRUST control verification
 * - SOC 2 compliance assessment
 * - Automated policy enforcement
 * - Real-time violation detection
 * 
 * Story 1.6 Task 8: Compliance Reporting & Audit Exports
 */

import * as crypto from 'crypto'
import { createClient } from '@/lib/dal/supabase'
import { logger } from '@/lib/logger'
import { auditLogger, AuditEventType, AuditSeverity, ComplianceFramework, type AuditLogEntry } from '../audit-logging'

export interface ComplianceRule {
  id: string
  framework: ComplianceFramework
  ruleType: 'access_control' | 'data_protection' | 'audit' | 'technical' | 'administrative'
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  conditions: ComplianceCondition[]
  actions: ComplianceAction[]
  createdAt: string
  updatedAt: string
}

export interface ComplianceCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'in' | 'exists'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface ComplianceAction {
  type: 'alert' | 'block' | 'log' | 'escalate' | 'notify'
  parameters: Record<string, any>
}

export interface ComplianceViolationEvent {
  id: string
  ruleId: string
  framework: ComplianceFramework
  severity: 'low' | 'medium' | 'high' | 'critical'
  violationType: string
  description: string
  affectedResource: string
  userId?: string
  sessionId?: string
  clientIp: string
  detectedAt: string
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  auditLogIds: string[]
  automaticActions: string[]
  remediationSteps: string[]
}

export interface ComplianceCheckResult {
  success: boolean
  violations: ComplianceViolationEvent[]
  checksPerformed: number
  rulesEvaluated: number
  processingTime: number
  error?: string
}

export interface ComplianceScore {
  framework: ComplianceFramework
  overallScore: number
  categoryScores: {
    accessControl: number
    dataProtection: number
    auditCompliance: number
    technicalSafeguards: number
    administrativeControls: number
  }
  violationCount: number
  criticalViolations: number
  lastUpdated: string
}

export class ComplianceChecker {
  private static instance: ComplianceChecker
  private rules: Map<string, ComplianceRule> = new Map()
  private isInitialized: boolean = false
  
  private constructor() {}
  
  public static getInstance(): ComplianceChecker {
    if (!ComplianceChecker.instance) {
      ComplianceChecker.instance = new ComplianceChecker()
    }
    return ComplianceChecker.instance
  }
  
  /**
   * Initialize compliance checker with rules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      logger.info('Initializing compliance checker')
      
      // Load rules from database
      await this.loadComplianceRules()
      
      // Load default rules if none exist
      if (this.rules.size === 0) {
        await this.loadDefaultRules()
      }
      
      this.isInitialized = true
      logger.info(`Compliance checker initialized with ${this.rules.size} rules`)
      
    } catch (error) {
      logger.error('Failed to initialize compliance checker', { error })
      throw error
    }
  }
  
  /**
   * Check audit event for compliance violations
   */
  async checkAuditEvent(auditEvent: AuditLogEntry): Promise<ComplianceCheckResult> {
    const startTime = Date.now()
    const violations: ComplianceViolationEvent[] = []
    let checksPerformed = 0
    let rulesEvaluated = 0
    
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }
      
      // Get applicable rules for the audit event
      const applicableRules = this.getApplicableRules(auditEvent)
      
      for (const rule of applicableRules) {
        rulesEvaluated++
        
        // Evaluate rule conditions
        const violatesRule = await this.evaluateRule(rule, auditEvent)
        checksPerformed++
        
        if (violatesRule) {
          const violation = await this.createViolationEvent(rule, auditEvent)
          violations.push(violation)
          
          // Execute automatic actions
          await this.executeRuleActions(rule, violation, auditEvent)
        }
      }
      
      // Store violations in database
      if (violations.length > 0) {
        await this.storeViolations(violations)
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        violations,
        checksPerformed,
        rulesEvaluated,
        processingTime
      }
      
    } catch (error) {
      logger.error('Compliance check failed', { error, auditEventId: auditEvent.id })
      return {
        success: false,
        violations: [],
        checksPerformed,
        rulesEvaluated,
        processingTime: Date.now() - startTime,
        error: 'Compliance check failed'
      }
    }
  }
  
  /**
   * Batch check multiple audit events
   */
  async checkBatch(auditEvents: AuditLogEntry[]): Promise<ComplianceCheckResult> {
    const startTime = Date.now()
    const allViolations: ComplianceViolationEvent[] = []
    let totalChecks = 0
    let totalRules = 0
    
    for (const event of auditEvents) {
      const result = await this.checkAuditEvent(event)
      allViolations.push(...result.violations)
      totalChecks += result.checksPerformed
      totalRules += result.rulesEvaluated
    }
    
    return {
      success: true,
      violations: allViolations,
      checksPerformed: totalChecks,
      rulesEvaluated: totalRules,
      processingTime: Date.now() - startTime
    }
  }
  
  /**
   * Calculate compliance score for framework
   */
  async calculateComplianceScore(
    framework: ComplianceFramework,
    dateRange?: { start: string; end: string }
  ): Promise<ComplianceScore> {
    try {
      const endDate = dateRange?.end || new Date().toISOString()
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Get violations for the period
      const violations = await this.getViolationsForPeriod(framework, startDate, endDate)
      const criticalViolations = violations.filter(v => v.severity === 'critical').length
      
      // Get audit events for scoring
      const auditResult = await auditLogger.queryAuditLogs({
        compliance_frameworks: [framework],
        date_range: { start: startDate, end: endDate },
        limit: 10000
      })
      
      const auditEvents = auditResult.logs || []
      
      // Calculate category scores
      const categoryScores = {
        accessControl: this.calculateAccessControlScore(auditEvents, violations),
        dataProtection: this.calculateDataProtectionScore(auditEvents, violations),
        auditCompliance: this.calculateAuditComplianceScore(auditEvents, violations),
        technicalSafeguards: this.calculateTechnicalSafeguardsScore(auditEvents, violations),
        administrativeControls: this.calculateAdministrativeControlsScore(auditEvents, violations)
      }
      
      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (categoryScores.accessControl * 0.25) +
        (categoryScores.dataProtection * 0.25) +
        (categoryScores.auditCompliance * 0.2) +
        (categoryScores.technicalSafeguards * 0.2) +
        (categoryScores.administrativeControls * 0.1)
      )
      
      return {
        framework,
        overallScore,
        categoryScores,
        violationCount: violations.length,
        criticalViolations,
        lastUpdated: new Date().toISOString()
      }
      
    } catch (error) {
      logger.error('Failed to calculate compliance score', { error, framework })
      throw error
    }
  }
  
  /**
   * Get applicable rules for audit event
   */
  private getApplicableRules(auditEvent: AuditLogEntry): ComplianceRule[] {
    const applicableRules: ComplianceRule[] = []
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue
      
      // Check if rule applies to this event's compliance frameworks
      const eventFrameworks = auditEvent.compliance_frameworks || []
      if (!eventFrameworks.includes(rule.framework)) continue
      
      applicableRules.push(rule)
    }
    
    return applicableRules
  }
  
  /**
   * Evaluate if audit event violates rule
   */
  private async evaluateRule(rule: ComplianceRule, auditEvent: AuditLogEntry): Promise<boolean> {
    try {
      let result = true
      let currentOperator: 'AND' | 'OR' = 'AND'
      
      for (let i = 0; i < rule.conditions.length; i++) {
        const condition = rule.conditions[i]
        const conditionResult = this.evaluateCondition(condition, auditEvent)
        
        if (i === 0) {
          result = conditionResult
        } else {
          if (currentOperator === 'AND') {
            result = result && conditionResult
          } else {
            result = result || conditionResult
          }
        }
        
        currentOperator = condition.logicalOperator || 'AND'
      }
      
      return result
      
    } catch (error) {
      logger.error('Rule evaluation failed', { error, ruleId: rule.id })
      return false
    }
  }
  
  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: ComplianceCondition, auditEvent: AuditLogEntry): boolean {
    const fieldValue = this.getFieldValue(condition.field, auditEvent)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'regex':
        const regex = new RegExp(condition.value)
        return regex.test(String(fieldValue))
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      default:
        return false
    }
  }
  
  /**
   * Get field value from audit event
   */
  private getFieldValue(fieldPath: string, auditEvent: AuditLogEntry): any {
    const parts = fieldPath.split('.')
    let value: any = auditEvent
    
    for (const part of parts) {
      if (value === null || value === undefined) return undefined
      value = value[part]
    }
    
    return value
  }
  
  /**
   * Create violation event
   */
  private async createViolationEvent(
    rule: ComplianceRule,
    auditEvent: AuditLogEntry
  ): Promise<ComplianceViolationEvent> {
    return {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      framework: rule.framework,
      severity: rule.severity,
      violationType: rule.ruleType,
      description: `${rule.name}: ${rule.description}`,
      affectedResource: `${auditEvent.resource_type}:${auditEvent.resource_id}`,
      userId: auditEvent.user_id,
      sessionId: auditEvent.session_id,
      clientIp: auditEvent.client_ip,
      detectedAt: new Date().toISOString(),
      status: 'active',
      auditLogIds: [auditEvent.id!].filter(Boolean),
      automaticActions: rule.actions.map(a => a.type),
      remediationSteps: this.generateRemediationSteps(rule, auditEvent)
    }
  }
  
  /**
   * Execute rule actions
   */
  private async executeRuleActions(
    rule: ComplianceRule,
    violation: ComplianceViolationEvent,
    auditEvent: AuditLogEntry
  ): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, violation, auditEvent)
      } catch (error) {
        logger.error('Failed to execute compliance action', {
          error,
          actionType: action.type,
          ruleId: rule.id,
          violationId: violation.id
        })
      }
    }
  }
  
  /**
   * Execute individual action
   */
  private async executeAction(
    action: ComplianceAction,
    violation: ComplianceViolationEvent,
    auditEvent: AuditLogEntry
  ): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.sendAlert(violation, action.parameters)
        break
      case 'block':
        // In real implementation, this would block the user/session
        logger.warn('Blocking action triggered', { violationId: violation.id })
        break
      case 'log':
        await this.logViolation(violation, auditEvent)
        break
      case 'escalate':
        await this.escalateViolation(violation, action.parameters)
        break
      case 'notify':
        await this.notifyStakeholders(violation, action.parameters)
        break
    }
  }
  
  /**
   * Load compliance rules from database
   */
  private async loadComplianceRules(): Promise<void> {
    try {
      const supabase = createClient()
      const { data: rules, error } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('enabled', true)
      
      if (error) {
        logger.error('Failed to load compliance rules', { error })
        return
      }
      
      this.rules.clear()
      for (const rule of rules || []) {
        this.rules.set(rule.id, rule)
      }
      
    } catch (error) {
      logger.error('Error loading compliance rules', { error })
    }
  }
  
  /**
   * Load default compliance rules
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: ComplianceRule[] = [
      {
        id: 'hipaa-excessive-failed-logins',
        framework: ComplianceFramework.HIPAA,
        ruleType: 'access_control',
        name: 'Excessive Failed Login Attempts',
        description: 'Detects excessive failed login attempts from same IP',
        severity: 'high',
        enabled: true,
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: AuditEventType.LOGIN_FAILED
          },
          {
            field: 'risk_score',
            operator: 'greater_than',
            value: 5,
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            type: 'alert',
            parameters: { alertLevel: 'high' }
          },
          {
            type: 'log',
            parameters: {}
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hipaa-unauthorized-phi-access',
        framework: ComplianceFramework.HIPAA,
        ruleType: 'data_protection',
        name: 'Unauthorized PHI Access',
        description: 'Detects unauthorized access to PHI data',
        severity: 'critical',
        enabled: true,
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: AuditEventType.PHI_ACCESS
          },
          {
            field: 'status',
            operator: 'equals',
            value: 'blocked',
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            type: 'alert',
            parameters: { alertLevel: 'critical' }
          },
          {
            type: 'escalate',
            parameters: { escalationLevel: 1 }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hipaa-bulk-data-modification',
        framework: ComplianceFramework.HIPAA,
        ruleType: 'data_protection',
        name: 'Bulk Data Modification',
        description: 'Detects bulk modifications of healthcare data',
        severity: 'medium',
        enabled: true,
        conditions: [
          {
            field: 'event_type',
            operator: 'equals',
            value: AuditEventType.BULK_OPERATION
          },
          {
            field: 'sensitive_data_involved',
            operator: 'equals',
            value: true,
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            type: 'log',
            parameters: {}
          },
          {
            type: 'notify',
            parameters: { recipients: ['compliance@company.com'] }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Store default rules
    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule)
    }
    
    // Persist to database
    await this.persistRulesToDatabase(defaultRules)
  }
  
  /**
   * Persist rules to database
   */
  private async persistRulesToDatabase(rules: ComplianceRule[]): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('compliance_rules').upsert(rules)
    } catch (error) {
      logger.error('Failed to persist rules to database', { error })
    }
  }
  
  /**
   * Store violations in database
   */
  private async storeViolations(violations: ComplianceViolationEvent[]): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('compliance_violations').insert(violations)
    } catch (error) {
      logger.error('Failed to store violations', { error })
    }
  }
  
  /**
   * Get violations for time period
   */
  private async getViolationsForPeriod(
    framework: ComplianceFramework,
    startDate: string,
    endDate: string
  ): Promise<ComplianceViolationEvent[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('compliance_violations')
        .select('*')
        .eq('framework', framework)
        .gte('detected_at', startDate)
        .lte('detected_at', endDate)
      
      if (error) throw error
      return data || []
      
    } catch (error) {
      logger.error('Failed to get violations for period', { error })
      return []
    }
  }
  
  // Scoring methods
  private calculateAccessControlScore(events: AuditLogEntry[], violations: ComplianceViolationEvent[]): number {
    const accessEvents = events.filter(e => e.event_type.startsWith('authentication:') || e.event_type.startsWith('authorization:'))
    const accessViolations = violations.filter(v => v.violationType === 'access_control')
    
    if (accessEvents.length === 0) return 100
    
    const violationRate = accessViolations.length / accessEvents.length
    return Math.max(0, Math.round(100 - (violationRate * 100)))
  }
  
  private calculateDataProtectionScore(events: AuditLogEntry[], violations: ComplianceViolationEvent[]): number {
    const dataEvents = events.filter(e => e.event_type.startsWith('data_'))
    const dataViolations = violations.filter(v => v.violationType === 'data_protection')
    
    if (dataEvents.length === 0) return 100
    
    const violationRate = dataViolations.length / dataEvents.length
    return Math.max(0, Math.round(100 - (violationRate * 150)))
  }
  
  private calculateAuditComplianceScore(events: AuditLogEntry[], violations: ComplianceViolationEvent[]): number {
    const auditEvents = events.filter(e => e.event_type.startsWith('compliance:'))
    const auditViolations = violations.filter(v => v.violationType === 'audit')
    
    const completenessScore = Math.min(100, (events.length / 1000) * 100) // Expect at least 1000 events for full score
    const violationPenalty = auditViolations.length * 10
    
    return Math.max(0, Math.round(completenessScore - violationPenalty))
  }
  
  private calculateTechnicalSafeguardsScore(events: AuditLogEntry[], violations: ComplianceViolationEvent[]): number {
    const techEvents = events.filter(e => e.event_type.startsWith('system:') || e.event_type.startsWith('security:'))
    const techViolations = violations.filter(v => v.violationType === 'technical')
    
    if (techEvents.length === 0) return 50 // Neutral score if no tech events
    
    const violationRate = techViolations.length / techEvents.length
    return Math.max(0, Math.round(100 - (violationRate * 200)))
  }
  
  private calculateAdministrativeControlsScore(events: AuditLogEntry[], violations: ComplianceViolationEvent[]): number {
    const adminEvents = events.filter(e => e.event_type.startsWith('system_admin:'))
    const adminViolations = violations.filter(v => v.violationType === 'administrative')
    
    if (adminEvents.length === 0) return 80 // Assume good admin practices
    
    const violationRate = adminViolations.length / adminEvents.length
    return Math.max(0, Math.round(100 - (violationRate * 100)))
  }
  
  // Action execution methods
  private async sendAlert(violation: ComplianceViolationEvent, parameters: any): Promise<void> {
    logger.warn('Compliance violation alert', {
      violationId: violation.id,
      severity: violation.severity,
      description: violation.description
    })
  }
  
  private async logViolation(violation: ComplianceViolationEvent, auditEvent: AuditLogEntry): Promise<void> {
    await auditLogger.logEvent({
      event_type: AuditEventType.COMPLIANCE_AUDIT_ACCESSED,
      severity: violation.severity === 'critical' ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
      user_id: null,
      session_id: null,
      resource_type: 'compliance_violation',
      resource_id: violation.id,
      action_performed: 'compliance_violation_detected',
      client_ip: violation.clientIp,
      user_agent: 'Compliance-Checker',
      request_id: crypto.randomUUID(),
      compliance_frameworks: [violation.framework],
      sensitive_data_involved: true,
      status: 'success'
    })
  }
  
  private async escalateViolation(violation: ComplianceViolationEvent, parameters: any): Promise<void> {
    // In real implementation, would trigger escalation workflow
    logger.error('Compliance violation escalated', {
      violationId: violation.id,
      escalationLevel: parameters.escalationLevel
    })
  }
  
  private async notifyStakeholders(violation: ComplianceViolationEvent, parameters: any): Promise<void> {
    // In real implementation, would send notifications to specified recipients
    logger.info('Compliance violation notification sent', {
      violationId: violation.id,
      recipients: parameters.recipients
    })
  }
  
  private generateRemediationSteps(rule: ComplianceRule, auditEvent: AuditLogEntry): string[] {
    const steps: string[] = []
    
    switch (rule.ruleType) {
      case 'access_control':
        steps.push('Review user access permissions')
        steps.push('Verify authentication mechanisms')
        steps.push('Check for account compromise')
        break
      case 'data_protection':
        steps.push('Audit data access patterns')
        steps.push('Verify data encryption status')
        steps.push('Review data handling procedures')
        break
      case 'audit':
        steps.push('Check audit log completeness')
        steps.push('Verify audit trail integrity')
        steps.push('Review audit retention policies')
        break
    }
    
    return steps
  }
}

// Export singleton instance
export const complianceChecker = ComplianceChecker.getInstance()

export default ComplianceChecker