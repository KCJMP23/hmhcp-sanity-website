/**
 * Healthcare-Specific Activity Monitoring System
 * Real-time monitoring with HIPAA compliance and healthcare context
 * 
 * Story 1.6 Task 5: Admin Activity Monitoring & Threat Detection
 */

import { HIPAAAuditLogger, AuditEventType, AuditSeverity } from './audit-logging'
import { createClient } from '@supabase/supabase-js'
import { HealthcareRole } from './healthcare-role-manager'
import { threatDetection, ThreatType, ThreatSeverity } from './threat-detection'

// Healthcare-specific activity patterns
export interface HealthcareActivityPattern {
  user_id: string
  session_id: string
  timestamp: Date
  action: string
  resource_type: string
  resource_id?: string
  healthcare_context: boolean
  phi_accessed: boolean
  ip_address: string
  user_agent: string
  user_role: HealthcareRole
  department?: string
  location?: {
    facility: string
    department: string
    workstation_id?: string
  }
  clinical_context?: {
    patient_id?: string
    encounter_id?: string
    procedure_code?: string
    diagnosis_code?: string
  }
  data_volume?: {
    records_accessed: number
    data_exported: boolean
    export_format?: string
  }
}

// Suspicious behavior indicators
export enum SuspiciousActivityType {
  EXCESSIVE_PHI_ACCESS = 'excessive_phi_access',
  AFTER_HOURS_ACCESS = 'after_hours_access',
  UNUSUAL_EXPORT_PATTERN = 'unusual_export_pattern',
  CROSS_DEPARTMENT_ACCESS = 'cross_department_access',
  RAPID_RECORD_ACCESS = 'rapid_record_access',
  BULK_DATA_RETRIEVAL = 'bulk_data_retrieval',
  UNAUTHORIZED_ADMIN_ACCESS = 'unauthorized_admin_access',
  UNUSUAL_IP_PATTERN = 'unusual_ip_pattern',
  DEVICE_ANOMALY = 'device_anomaly',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_MINING_PATTERN = 'data_mining_pattern',
  CONCURRENT_SESSION_ABUSE = 'concurrent_session_abuse'
}

export interface SuspiciousActivityAlert {
  id: string
  user_id: string
  activity_type: SuspiciousActivityType
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence_score: number // 0-1
  risk_factors: string[]
  patterns: HealthcareActivityPattern[]
  detection_time: Date
  healthcare_data_involved: boolean
  recommended_actions: string[]
  auto_actions_taken: string[]
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved'
}

// Real-time monitoring configuration
export interface ActivityMonitorConfig {
  // PHI access thresholds
  max_phi_records_per_hour: number
  max_phi_records_per_day: number
  phi_access_velocity_threshold: number // records per minute
  
  // Time-based thresholds
  after_hours_start: number // hour 0-23
  after_hours_end: number // hour 0-23
  weekend_access_threshold: number
  
  // Export and bulk access
  max_export_size_mb: number
  max_bulk_records: number
  unusual_export_formats: string[]
  
  // Geographic and device
  enable_ip_geolocation: boolean
  max_concurrent_sessions: number
  device_fingerprint_variance_threshold: number
  
  // Role-based thresholds
  role_specific_limits: Record<string, {
    max_records_per_hour: number
    allowed_departments: string[]
    after_hours_allowed: boolean
  }>
  
  // Machine learning thresholds
  anomaly_detection_threshold: number
  behavioral_deviation_threshold: number
}

export const DEFAULT_MONITOR_CONFIG: ActivityMonitorConfig = {
  max_phi_records_per_hour: 100,
  max_phi_records_per_day: 500,
  phi_access_velocity_threshold: 5, // 5 records per minute
  
  after_hours_start: 22, // 10 PM
  after_hours_end: 6, // 6 AM
  weekend_access_threshold: 10,
  
  max_export_size_mb: 100,
  max_bulk_records: 50,
  unusual_export_formats: ['csv', 'xml', 'json'],
  
  enable_ip_geolocation: true,
  max_concurrent_sessions: 3,
  device_fingerprint_variance_threshold: 0.8,
  
  role_specific_limits: {
    'system_admin': {
      max_records_per_hour: 200,
      allowed_departments: ['*'],
      after_hours_allowed: true
    },
    'healthcare_admin': {
      max_records_per_hour: 150,
      allowed_departments: ['*'],
      after_hours_allowed: true
    },
    'physician': {
      max_records_per_hour: 80,
      allowed_departments: ['cardiology', 'internal_medicine', 'emergency'],
      after_hours_allowed: true
    },
    'nurse': {
      max_records_per_hour: 60,
      allowed_departments: ['nursing', 'emergency', 'icu'],
      after_hours_allowed: true
    },
    'medical_assistant': {
      max_records_per_hour: 40,
      allowed_departments: ['outpatient', 'clinic'],
      after_hours_allowed: false
    }
  },
  
  anomaly_detection_threshold: 0.8,
  behavioral_deviation_threshold: 2.5
}

/**
 * Real-time healthcare activity monitoring system
 */
export class HealthcareActivityMonitor {
  private config: ActivityMonitorConfig
  private auditLogger: HIPAAAuditLogger
  private supabase: ReturnType<typeof createDALClient>
  private activeAlerts: Map<string, SuspiciousActivityAlert> = new Map()
  private userBaselines: Map<string, UserActivityBaseline> = new Map()
  private monitoringActive: boolean = false

  constructor(config: ActivityMonitorConfig = DEFAULT_MONITOR_CONFIG) {
    this.config = config
    this.auditLogger = new HIPAAAuditLogger()
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  }

  /**
   * Start real-time activity monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      return
    }

    this.monitoringActive = true
    console.log('Healthcare activity monitoring started')

    await this.auditLogger.logEvent({
      event_type: AuditEventType.SYSTEM_CONFIGURATION_CHANGE,
      user_id: 'system',
      severity: AuditSeverity.INFO,
      resource_type: 'activity_monitoring',
      action_performed: 'monitoring_started',
      metadata: {
        monitoring_type: 'healthcare_activity',
        configuration: this.sanitizeConfig(this.config),
        start_time: new Date().toISOString()
      }
    })

    // Initialize background tasks
    this.startBackgroundTasks()
  }

  /**
   * Stop activity monitoring
   */
  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false
    console.log('Healthcare activity monitoring stopped')

    await this.auditLogger.logEvent({
      event_type: AuditEventType.SYSTEM_CONFIGURATION_CHANGE,
      user_id: 'system',
      severity: AuditSeverity.INFO,
      resource_type: 'activity_monitoring',
      action_performed: 'monitoring_stopped',
      metadata: {
        monitoring_type: 'healthcare_activity',
        stop_time: new Date().toISOString()
      }
    })
  }

  /**
   * Process activity pattern in real-time
   */
  async processActivity(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    if (!this.monitoringActive) {
      return []
    }

    const alerts: SuspiciousActivityAlert[] = []

    try {
      // 1. Check PHI access patterns
      const phiAlerts = await this.checkPHIAccessPatterns(pattern)
      alerts.push(...phiAlerts)

      // 2. Check time-based anomalies
      const timeAlerts = await this.checkTimeBasedAnomalies(pattern)
      alerts.push(...timeAlerts)

      // 3. Check export and bulk access patterns
      const exportAlerts = await this.checkExportPatterns(pattern)
      alerts.push(...exportAlerts)

      // 4. Check cross-department access
      const departmentAlerts = await this.checkCrossDepartmentAccess(pattern)
      alerts.push(...departmentAlerts)

      // 5. Check device and IP anomalies
      const deviceAlerts = await this.checkDeviceAnomalies(pattern)
      alerts.push(...deviceAlerts)

      // 6. Check behavioral anomalies
      const behavioralAlerts = await this.checkBehavioralAnomalies(pattern)
      alerts.push(...behavioralAlerts)

      // 7. Check privilege escalation attempts
      const privilegeAlerts = await this.checkPrivilegeEscalation(pattern)
      alerts.push(...privilegeAlerts)

      // Store and process alerts
      for (const alert of alerts) {
        await this.processAlert(alert)
      }

      // Update user activity baseline
      await this.updateUserBaseline(pattern)

      return alerts

    } catch (error) {
      console.error('Activity monitoring error:', error)
      await this.auditLogger.logEvent({
        event_type: AuditEventType.SYSTEM_ERROR,
        user_id: pattern.user_id,
        severity: AuditSeverity.ERROR,
        resource_type: 'activity_monitoring',
        action_performed: 'monitoring_error',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          activity_pattern: this.sanitizePattern(pattern)
        },
        ip_address: pattern.ip_address
      })

      return []
    }
  }

  /**
   * Check PHI access patterns for suspicious behavior
   */
  private async checkPHIAccessPatterns(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    if (!pattern.phi_accessed) {
      return alerts
    }

    try {
      // Check hourly PHI access limits
      const hourWindow = new Date()
      hourWindow.setHours(hourWindow.getHours() - 1)

      const { data: recentPHIAccess } = await this.supabase
        .from('session_activities')
        .select('*')
        .eq('user_id', pattern.user_id)
        .eq('healthcare_context', true)
        .gte('timestamp', hourWindow.toISOString())

      const phiAccessCount = recentPHIAccess?.length || 0

      if (phiAccessCount >= this.config.max_phi_records_per_hour) {
        alerts.push(await this.createAlert({
          user_id: pattern.user_id,
          activity_type: SuspiciousActivityType.EXCESSIVE_PHI_ACCESS,
          severity: 'high',
          confidence_score: 0.9,
          risk_factors: [`Excessive PHI access: ${phiAccessCount} records in 1 hour`],
          patterns: [pattern],
          healthcare_data_involved: true,
          recommended_actions: [
            'Review clinical justification for PHI access',
            'Verify legitimate patient care activities',
            'Consider temporary access restrictions'
          ]
        }))
      }

      // Check velocity of PHI access (records per minute)
      const fiveMinutesAgo = new Date()
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

      const { data: recentActivity } = await this.supabase
        .from('session_activities')
        .select('*')
        .eq('user_id', pattern.user_id)
        .eq('healthcare_context', true)
        .gte('timestamp', fiveMinutesAgo.toISOString())

      const velocityCount = recentActivity?.length || 0
      const recordsPerMinute = velocityCount / 5

      if (recordsPerMinute >= this.config.phi_access_velocity_threshold) {
        alerts.push(await this.createAlert({
          user_id: pattern.user_id,
          activity_type: SuspiciousActivityType.RAPID_RECORD_ACCESS,
          severity: 'medium',
          confidence_score: 0.8,
          risk_factors: [`Rapid PHI access: ${recordsPerMinute.toFixed(1)} records/minute`],
          patterns: [pattern],
          healthcare_data_involved: true,
          recommended_actions: [
            'Verify automated vs manual access patterns',
            'Check for data mining activities',
            'Review access purpose and authorization'
          ]
        }))
      }

    } catch (error) {
      console.error('PHI access pattern check error:', error)
    }

    return alerts
  }

  /**
   * Check time-based access anomalies
   */
  private async checkTimeBasedAnomalies(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      const currentHour = pattern.timestamp.getHours()
      const isWeekend = [0, 6].includes(pattern.timestamp.getDay()) // Sunday = 0, Saturday = 6

      // Check after-hours access
      const isAfterHours = currentHour >= this.config.after_hours_start || 
                           currentHour <= this.config.after_hours_end

      if (isAfterHours && pattern.healthcare_context) {
        const roleConfig = this.config.role_specific_limits[pattern.user_role]
        
        if (!roleConfig?.after_hours_allowed) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.AFTER_HOURS_ACCESS,
            severity: 'medium',
            confidence_score: 0.7,
            risk_factors: [
              `After-hours healthcare access at ${currentHour}:00`,
              `User role '${pattern.user_role}' not authorized for after-hours access`
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Verify emergency or on-call status',
              'Check authorization for after-hours access',
              'Contact user to confirm legitimate need'
            ]
          }))
        }
      }

      // Check weekend access patterns
      if (isWeekend && pattern.healthcare_context) {
        const { data: weekendAccess } = await this.supabase
          .from('session_activities')
          .select('*')
          .eq('user_id', pattern.user_id)
          .eq('healthcare_context', true)
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        const weekendCount = weekendAccess?.filter(a => {
          const day = new Date(a.timestamp).getDay()
          return day === 0 || day === 6
        }).length || 0

        if (weekendCount >= this.config.weekend_access_threshold) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.AFTER_HOURS_ACCESS,
            severity: 'low',
            confidence_score: 0.6,
            risk_factors: [`Extensive weekend access: ${weekendCount} activities`],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Review weekend work schedule',
              'Verify on-call or emergency coverage',
              'Check for legitimate clinical need'
            ]
          }))
        }
      }

    } catch (error) {
      console.error('Time-based anomaly check error:', error)
    }

    return alerts
  }

  /**
   * Check export and bulk access patterns
   */
  private async checkExportPatterns(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      if (pattern.data_volume?.data_exported) {
        const exportFormat = pattern.data_volume.export_format
        const recordsExported = pattern.data_volume.records_accessed

        // Check for unusual export formats
        if (exportFormat && this.config.unusual_export_formats.includes(exportFormat.toLowerCase())) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.UNUSUAL_EXPORT_PATTERN,
            severity: 'medium',
            confidence_score: 0.7,
            risk_factors: [
              `Unusual export format: ${exportFormat}`,
              `Records exported: ${recordsExported}`
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Verify business justification for export format',
              'Check data sharing agreements',
              'Review export approval process'
            ]
          }))
        }

        // Check for bulk data retrieval
        if (recordsExported >= this.config.max_bulk_records) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.BULK_DATA_RETRIEVAL,
            severity: 'high',
            confidence_score: 0.9,
            risk_factors: [
              `Bulk data export: ${recordsExported} records`,
              `Export format: ${exportFormat || 'unknown'}`
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Immediate review of export justification',
              'Verify data use agreement compliance',
              'Consider temporary export restrictions',
              'Notify compliance team'
            ]
          }))
        }
      }

    } catch (error) {
      console.error('Export pattern check error:', error)
    }

    return alerts
  }

  /**
   * Check cross-department access patterns
   */
  private async checkCrossDepartmentAccess(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      if (!pattern.department || !pattern.location?.department) {
        return alerts
      }

      const userDepartment = pattern.department
      const accessedDepartment = pattern.location.department
      const roleConfig = this.config.role_specific_limits[pattern.user_role]

      // Check if user is accessing data outside their authorized departments
      if (roleConfig && roleConfig.allowed_departments[0] !== '*') {
        if (!roleConfig.allowed_departments.includes(accessedDepartment)) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.CROSS_DEPARTMENT_ACCESS,
            severity: 'medium',
            confidence_score: 0.8,
            risk_factors: [
              `Cross-department access: ${userDepartment} → ${accessedDepartment}`,
              `User role: ${pattern.user_role}`,
              `Unauthorized department access`
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Verify clinical consultation or referral',
              'Check department collaboration agreements',
              'Review role-based access permissions',
              'Contact department supervisor'
            ]
          }))
        }
      }

    } catch (error) {
      console.error('Cross-department access check error:', error)
    }

    return alerts
  }

  /**
   * Check device and IP anomalies
   */
  private async checkDeviceAnomalies(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      // Get user's typical IP addresses
      const baseline = await this.getUserBaseline(pattern.user_id)
      
      if (baseline) {
        // Check for unusual IP address
        if (!baseline.typical_ip_addresses.includes(pattern.ip_address)) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.UNUSUAL_IP_PATTERN,
            severity: 'low',
            confidence_score: 0.6,
            risk_factors: [
              `Access from unusual IP: ${pattern.ip_address}`,
              'IP not in typical access pattern'
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Verify user location and device',
              'Check for remote access authorization',
              'Consider additional authentication'
            ]
          }))
        }

        // Check for device anomalies
        if (!baseline.typical_user_agents.includes(pattern.user_agent)) {
          alerts.push(await this.createAlert({
            user_id: pattern.user_id,
            activity_type: SuspiciousActivityType.DEVICE_ANOMALY,
            severity: 'low',
            confidence_score: 0.5,
            risk_factors: [
              'Access from unrecognized device',
              `User agent: ${pattern.user_agent.substring(0, 100)}...`
            ],
            patterns: [pattern],
            healthcare_data_involved: pattern.healthcare_context,
            recommended_actions: [
              'Verify device registration',
              'Check device security compliance',
              'Update device trust list if legitimate'
            ]
          }))
        }
      }

      // Check concurrent sessions
      const { data: activeSessions } = await this.supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', pattern.user_id)
        .eq('is_active', true)

      const sessionCount = activeSessions?.length || 0

      if (sessionCount > this.config.max_concurrent_sessions) {
        alerts.push(await this.createAlert({
          user_id: pattern.user_id,
          activity_type: SuspiciousActivityType.CONCURRENT_SESSION_ABUSE,
          severity: 'medium',
          confidence_score: 0.8,
          risk_factors: [
            `Excessive concurrent sessions: ${sessionCount}`,
            `Maximum allowed: ${this.config.max_concurrent_sessions}`
          ],
          patterns: [pattern],
          healthcare_data_involved: pattern.healthcare_context,
          recommended_actions: [
            'Review session management policies',
            'Verify legitimate multi-session need',
            'Consider session limits enforcement'
          ]
        }))
      }

    } catch (error) {
      console.error('Device anomaly check error:', error)
    }

    return alerts
  }

  /**
   * Check behavioral anomalies using baseline comparison
   */
  private async checkBehavioralAnomalies(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      const baseline = await this.getUserBaseline(pattern.user_id)
      
      if (!baseline) {
        return alerts // Not enough baseline data yet
      }

      let anomalyScore = 0
      const riskFactors: string[] = []

      // Check access time patterns
      const currentHour = pattern.timestamp.getHours()
      if (!baseline.typical_access_hours.includes(currentHour)) {
        anomalyScore += 1
        riskFactors.push(`Unusual access time: ${currentHour}:00`)
      }

      // Check resource type patterns
      if (!baseline.typical_resource_types.includes(pattern.resource_type)) {
        anomalyScore += 1.5
        riskFactors.push(`Unusual resource type: ${pattern.resource_type}`)
      }

      // Check action patterns
      if (!baseline.typical_actions.includes(pattern.action)) {
        anomalyScore += 1
        riskFactors.push(`Unusual action: ${pattern.action}`)
      }

      // Check department patterns
      if (pattern.department && !baseline.typical_departments.includes(pattern.department)) {
        anomalyScore += 2
        riskFactors.push(`Unusual department access: ${pattern.department}`)
      }

      // Calculate behavioral deviation
      const deviationScore = anomalyScore / 5.5 * 10 // Normalize to 0-10

      if (deviationScore >= this.config.behavioral_deviation_threshold) {
        alerts.push(await this.createAlert({
          user_id: pattern.user_id,
          activity_type: SuspiciousActivityType.DATA_MINING_PATTERN,
          severity: deviationScore >= 7 ? 'high' : 'medium',
          confidence_score: Math.min(deviationScore / 10, 1),
          risk_factors: riskFactors,
          patterns: [pattern],
          healthcare_data_involved: pattern.healthcare_context,
          recommended_actions: [
            'Review behavioral patterns for legitimacy',
            'Verify role-appropriate access',
            'Check for training or role changes',
            'Consider enhanced monitoring'
          ]
        }))
      }

    } catch (error) {
      console.error('Behavioral anomaly check error:', error)
    }

    return alerts
  }

  /**
   * Check for privilege escalation attempts
   */
  private async checkPrivilegeEscalation(pattern: HealthcareActivityPattern): Promise<SuspiciousActivityAlert[]> {
    const alerts: SuspiciousActivityAlert[] = []

    try {
      // Check if user is accessing admin functions
      const adminActions = ['user_management', 'role_assignment', 'system_configuration', 'audit_log_access']
      const adminResources = ['admin_panel', 'user_roles', 'system_settings', 'audit_logs']

      const isAdminAction = adminActions.some(action => pattern.action.includes(action))
      const isAdminResource = adminResources.some(resource => pattern.resource_type.includes(resource))

      if ((isAdminAction || isAdminResource) && !this.isAdminRole(pattern.user_role)) {
        alerts.push(await this.createAlert({
          user_id: pattern.user_id,
          activity_type: SuspiciousActivityType.PRIVILEGE_ESCALATION,
          severity: 'high',
          confidence_score: 0.9,
          risk_factors: [
            `Non-admin user accessing admin functions`,
            `User role: ${pattern.user_role}`,
            `Action: ${pattern.action}`,
            `Resource: ${pattern.resource_type}`
          ],
          patterns: [pattern],
          healthcare_data_involved: pattern.healthcare_context,
          recommended_actions: [
            'Immediate security review required',
            'Verify access path and authorization',
            'Check for potential security breach',
            'Consider temporary account suspension'
          ]
        }))
      }

    } catch (error) {
      console.error('Privilege escalation check error:', error)
    }

    return alerts
  }

  /**
   * Create suspicious activity alert
   */
  private async createAlert(alertData: Omit<SuspiciousActivityAlert, 'id' | 'detection_time' | 'auto_actions_taken' | 'status'>): Promise<SuspiciousActivityAlert> {
    const alert: SuspiciousActivityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detection_time: new Date(),
      auto_actions_taken: [],
      status: 'new',
      ...alertData
    }

    return alert
  }

  /**
   * Process and store alert
   */
  private async processAlert(alert: SuspiciousActivityAlert): Promise<void> {
    try {
      // Store alert
      this.activeAlerts.set(alert.id, alert)

      // Store in database
      await this.supabase
        .from('healthcare_activity_alerts')
        .insert([{
          id: alert.id,
          user_id: alert.user_id,
          activity_type: alert.activity_type,
          severity: alert.severity,
          confidence_score: alert.confidence_score,
          risk_factors: alert.risk_factors,
          detection_time: alert.detection_time.toISOString(),
          healthcare_data_involved: alert.healthcare_data_involved,
          recommended_actions: alert.recommended_actions,
          status: alert.status
        }])

      // Execute automatic actions based on severity
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.executeAutomaticActions(alert)
      }

      // Log alert
      await this.auditLogger.logEvent({
        event_type: AuditEventType.SECURITY_THREAT_DETECTED,
        user_id: alert.user_id,
        severity: this.mapAlertSeverityToAuditSeverity(alert.severity),
        resource_type: 'healthcare_activity_monitoring',
        action_performed: 'suspicious_activity_detected',
        metadata: {
          alert_id: alert.id,
          activity_type: alert.activity_type,
          confidence_score: alert.confidence_score,
          risk_factors: alert.risk_factors,
          healthcare_data_involved: alert.healthcare_data_involved
        },
        ip_address: alert.patterns[0]?.ip_address
      })

    } catch (error) {
      console.error('Alert processing error:', error)
    }
  }

  /**
   * Execute automatic actions for high-severity alerts
   */
  private async executeAutomaticActions(alert: SuspiciousActivityAlert): Promise<void> {
    try {
      const actions: string[] = []

      // Critical alerts - immediate action
      if (alert.severity === 'critical') {
        // Temporarily suspend sessions
        await this.supabase
          .from('active_sessions')
          .update({ 
            is_active: false,
            terminated_at: new Date().toISOString(),
            termination_reason: `Critical security alert: ${alert.activity_type}`
          })
          .eq('user_id', alert.user_id)
          .eq('is_active', true)

        actions.push('sessions_terminated')

        // Create security incident
        await this.supabase
          .from('session_security_incidents')
          .insert([{
            incident_type: alert.activity_type,
            severity: 'critical',
            description: `Critical healthcare activity alert: ${alert.activity_type}`,
            user_id: alert.user_id,
            detection_method: 'automated_healthcare_monitoring',
            healthcare_data_involved: alert.healthcare_data_involved,
            action_taken: 'User sessions terminated due to critical security alert'
          }])

        actions.push('security_incident_created')
      }

      // High-severity alerts - enhanced monitoring
      if (alert.severity === 'high') {
        // Flag for enhanced monitoring
        await this.supabase
          .from('user_monitoring_flags')
          .upsert([{
            user_id: alert.user_id,
            flag_type: 'enhanced_monitoring',
            reason: `High-severity activity alert: ${alert.activity_type}`,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }])

        actions.push('enhanced_monitoring_enabled')
      }

      alert.auto_actions_taken = actions

      // Update alert with actions taken
      await this.supabase
        .from('healthcare_activity_alerts')
        .update({ auto_actions_taken: actions })
        .eq('id', alert.id)

    } catch (error) {
      console.error('Automatic action execution error:', error)
    }
  }

  /**
   * Get user activity baseline
   */
  private async getUserBaseline(userId: string): Promise<UserActivityBaseline | null> {
    try {
      const cached = this.userBaselines.get(userId)
      if (cached && (Date.now() - cached.last_updated.getTime()) < 60 * 60 * 1000) { // 1 hour cache
        return cached
      }

      const { data: baseline } = await this.supabase
        .from('user_activity_baselines')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (baseline) {
        const parsed: UserActivityBaseline = {
          user_id: baseline.user_id,
          typical_access_hours: baseline.typical_access_hours || [],
          typical_ip_addresses: baseline.typical_ip_addresses || [],
          typical_user_agents: baseline.typical_user_agents || [],
          typical_resource_types: baseline.typical_resource_types || [],
          typical_actions: baseline.typical_actions || [],
          typical_departments: baseline.typical_departments || [],
          average_session_duration: baseline.average_session_duration || 60,
          phi_access_frequency: baseline.phi_access_frequency || 0,
          last_updated: new Date(baseline.last_updated)
        }

        this.userBaselines.set(userId, parsed)
        return parsed
      }

      return null
    } catch (error) {
      console.error('Error fetching user baseline:', error)
      return null
    }
  }

  /**
   * Update user activity baseline
   */
  private async updateUserBaseline(pattern: HealthcareActivityPattern): Promise<void> {
    try {
      // Update baseline periodically (1% chance per activity)
      if (Math.random() > 0.01) {
        return
      }

      // Get recent activity for baseline calculation
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentActivity } = await this.supabase
        .from('session_activities')
        .select('*')
        .eq('user_id', pattern.user_id)
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .limit(500)

      if (!recentActivity || recentActivity.length < 10) {
        return // Not enough data
      }

      // Calculate baseline patterns
      const typicalAccessHours = [...new Set(recentActivity.map(a => new Date(a.timestamp).getHours()))]
      const typicalIpAddresses = [...new Set(recentActivity.map(a => a.ip_address))].slice(0, 10)
      const typicalUserAgents = [...new Set(recentActivity.map(a => a.user_agent))].slice(0, 5)
      const typicalResourceTypes = [...new Set(recentActivity.map(a => a.resource_type))]
      const typicalActions = [...new Set(recentActivity.map(a => a.action))]
      const typicalDepartments = [...new Set(recentActivity.map(a => a.metadata?.department).filter(Boolean))]

      const phiActivities = recentActivity.filter(a => a.healthcare_context)
      const phiAccessFrequency = phiActivities.length / recentActivity.length

      const baseline: Omit<UserActivityBaseline, 'user_id'> = {
        typical_access_hours: typicalAccessHours,
        typical_ip_addresses: typicalIpAddresses,
        typical_user_agents: typicalUserAgents,
        typical_resource_types: typicalResourceTypes,
        typical_actions: typicalActions,
        typical_departments: typicalDepartments,
        average_session_duration: 60, // Simplified
        phi_access_frequency: phiAccessFrequency,
        last_updated: new Date()
      }

      // Upsert baseline
      await this.supabase
        .from('user_activity_baselines')
        .upsert([{ user_id: pattern.user_id, ...baseline }])

      // Update cache
      this.userBaselines.set(pattern.user_id, { user_id: pattern.user_id, ...baseline })

    } catch (error) {
      console.error('Error updating user baseline:', error)
    }
  }

  /**
   * Start background monitoring tasks
   */
  private startBackgroundTasks(): void {
    // Clean up old alerts every hour
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        
        // Clean up in-memory alerts
        for (const [id, alert] of this.activeAlerts.entries()) {
          if (alert.detection_time < cutoff) {
            this.activeAlerts.delete(id)
          }
        }

        // Archive old database alerts
        await this.supabase
          .from('healthcare_activity_alerts')
          .update({ status: 'archived' })
          .lt('detection_time', cutoff.toISOString())
          .neq('status', 'archived')

      } catch (error) {
        console.error('Alert cleanup error:', error)
      }
    }, 60 * 60 * 1000)

    // Update user baselines every 6 hours
    setInterval(async () => {
      try {
        // Get active users from last 24 hours
        const { data: activeUsers } = await this.supabase
          .from('session_activities')
          .select('user_id')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(100)

        if (activeUsers) {
          const uniqueUsers = [...new Set(activeUsers.map(u => u.user_id))]
          
          // Update baselines for a few users each run
          for (let i = 0; i < Math.min(5, uniqueUsers.length); i++) {
            const userId = uniqueUsers[i]
            // Create a dummy pattern for baseline update
            const dummyPattern: HealthcareActivityPattern = {
              user_id: userId,
              session_id: 'baseline_update',
              timestamp: new Date(),
              action: 'baseline_update',
              resource_type: 'system',
              healthcare_context: false,
              phi_accessed: false,
              ip_address: '127.0.0.1',
              user_agent: 'system',
              user_role: HealthcareRole.GUEST
            }
            
            await this.updateUserBaseline(dummyPattern)
          }
        }

      } catch (error) {
        console.error('Baseline update error:', error)
      }
    }, 6 * 60 * 60 * 1000)
  }

  /**
   * Utility functions
   */
  private isAdminRole(role: HealthcareRole): boolean {
    const adminRoles = [
      HealthcareRole.SYSTEM_ADMIN,
      HealthcareRole.HEALTHCARE_ADMIN,
      HealthcareRole.SECURITY_ADMIN
    ]
    return adminRoles.includes(role)
  }

  private mapAlertSeverityToAuditSeverity(severity: string): AuditSeverity {
    switch (severity) {
      case 'low': return AuditSeverity.INFO
      case 'medium': return AuditSeverity.WARNING
      case 'high': case 'critical': return AuditSeverity.ERROR
      default: return AuditSeverity.INFO
    }
  }

  private sanitizeConfig(config: ActivityMonitorConfig): any {
    return {
      max_phi_records_per_hour: config.max_phi_records_per_hour,
      after_hours_monitoring: config.after_hours_start !== undefined,
      export_monitoring: config.max_export_size_mb > 0,
      behavioral_analysis: config.anomaly_detection_threshold > 0
    }
  }

  private sanitizePattern(pattern: HealthcareActivityPattern): any {
    return {
      user_role: pattern.user_role,
      action: pattern.action,
      resource_type: pattern.resource_type,
      healthcare_context: pattern.healthcare_context,
      phi_accessed: pattern.phi_accessed,
      timestamp: pattern.timestamp.toISOString()
    }
  }

  /**
   * Get monitoring status and statistics
   */
  async getMonitoringStatus(): Promise<any> {
    try {
      const { data: recentAlerts } = await this.supabase
        .from('healthcare_activity_alerts')
        .select('*')
        .gte('detection_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const stats = {
        monitoring_active: this.monitoringActive,
        active_alerts: this.activeAlerts.size,
        recent_alerts_24h: recentAlerts?.length || 0,
        alerts_by_severity: {} as Record<string, number>,
        alerts_by_type: {} as Record<string, number>,
        healthcare_alerts: recentAlerts?.filter(a => a.healthcare_data_involved).length || 0
      }

      // Group by severity and type
      recentAlerts?.forEach(alert => {
        stats.alerts_by_severity[alert.severity] = (stats.alerts_by_severity[alert.severity] || 0) + 1
        stats.alerts_by_type[alert.activity_type] = (stats.alerts_by_type[alert.activity_type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting monitoring status:', error)
      return {
        monitoring_active: this.monitoringActive,
        active_alerts: this.activeAlerts.size,
        recent_alerts_24h: 0,
        alerts_by_severity: {},
        alerts_by_type: {},
        healthcare_alerts: 0
      }
    }
  }

  /**
   * Get alerts for user interface
   */
  async getAlerts(filters?: {
    severity?: string
    activity_type?: string
    user_id?: string
    limit?: number
  }): Promise<SuspiciousActivityAlert[]> {
    try {
      let query = this.supabase
        .from('healthcare_activity_alerts')
        .select('*')
        .order('detection_time', { ascending: false })

      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.activity_type) {
        query = query.eq('activity_type', filters.activity_type)
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data: alerts } = await query

      return alerts?.map(alert => ({
        id: alert.id,
        user_id: alert.user_id,
        activity_type: alert.activity_type,
        severity: alert.severity,
        confidence_score: alert.confidence_score,
        risk_factors: alert.risk_factors || [],
        patterns: [], // Would need to join with activity data
        detection_time: new Date(alert.detection_time),
        healthcare_data_involved: alert.healthcare_data_involved,
        recommended_actions: alert.recommended_actions || [],
        auto_actions_taken: alert.auto_actions_taken || [],
        status: alert.status
      })) || []

    } catch (error) {
      console.error('Error getting alerts:', error)
      return []
    }
  }
}

// User activity baseline interface
interface UserActivityBaseline {
  user_id: string
  typical_access_hours: number[]
  typical_ip_addresses: string[]
  typical_user_agents: string[]
  typical_resource_types: string[]
  typical_actions: string[]
  typical_departments: string[]
  average_session_duration: number
  phi_access_frequency: number
  last_updated: Date
}

// Export the monitoring system
export default HealthcareActivityMonitor