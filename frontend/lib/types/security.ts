/**
 * Security Types - Comprehensive type definitions for security dashboard and components
 * Story 1.6 Task 6: Security Dashboard Implementation
 */

// Re-export incident response types for compatibility
export type { 
  Incident, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus,
  TimelineEntry,
  Evidence,
  ActionItem,
  Playbook,
  PlaybookStep,
  IncidentReport
} from '@/lib/security/incident-response/types'

// Security Dashboard Types
export interface SecurityIncident {
  id: string
  title?: string
  type: 'unauthorized_access' | 'data_breach_attempt' | 'malware_detection' | 'compliance_violation' | 'system_compromise' | 'phishing_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'closed'
  description: string
  source_ip?: string
  user_id?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
  resolution?: string
  acknowledged_by?: string
  acknowledged_at?: string
  escalated_by?: string
  escalated_at?: string
  notes?: string
  details?: Record<string, any>
}

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

// Audit Log Types
export interface AuditLogEntry {
  id: string
  user_id: string
  user_email: string
  action: string
  resource: string
  resource_id: string
  resource_type?: string
  outcome: 'success' | 'failure'
  timestamp: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  risk_level?: 'low' | 'medium' | 'high'
  details?: Record<string, any>
}

// Healthcare Activity Types
export interface HealthcareActivityEvent {
  id: string
  user_id: string
  user_email: string
  activity_type: 'patient_data_access' | 'phi_export' | 'medication_lookup' | 'appointment_view' | 'chart_access'
  patient_id?: string
  phi_type?: 'demographic' | 'medical_history' | 'treatment_plan' | 'billing'
  access_reason?: string
  timestamp: string
  ip_address?: string
  session_id?: string
  compliance_status: 'compliant' | 'flagged' | 'violation'
  details?: Record<string, any>
}

// Session Types
export interface UserSession {
  id: string
  user_id: string
  user_email: string
  session_token: string
  created_at: string
  updated_at: string
  expires_at: string
  ip_address: string
  user_agent: string
  is_active: boolean
  mfa_verified: boolean
  role: string
  permissions: string[]
  risk_score: number
  location_info?: {
    country?: string
    region?: string
    city?: string
    timezone?: string
  }
}

// Role and Permission Types
export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  is_healthcare_role: boolean
  requires_mfa: boolean
  session_timeout: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'admin'
  conditions?: Record<string, any>
}

export interface UserRole {
  user_id: string
  role_id: string
  assigned_by: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
}

// MFA Types
export interface MFASetup {
  user_id: string
  user_email: string
  method: 'totp' | 'sms' | 'email' | 'backup_codes'
  secret?: string
  backup_codes?: string[]
  is_verified: boolean
  created_at: string
  last_used_at?: string
}

export interface MFAVerification {
  user_id: string
  method: 'totp' | 'sms' | 'email' | 'backup_code'
  token: string
  is_valid: boolean
  attempts: number
  verified_at?: string
  ip_address: string
}

// Security Configuration Types
export interface SecurityConfig {
  password_policy: {
    min_length: number
    require_uppercase: boolean
    require_lowercase: boolean
    require_numbers: boolean
    require_symbols: boolean
    max_age_days: number
    prevent_reuse: number
  }
  session_policy: {
    timeout_minutes: number
    max_concurrent_sessions: number
    require_mfa_for_admin: boolean
    ip_whitelist_enabled: boolean
    geo_restrictions_enabled: boolean
  }
  audit_policy: {
    log_all_access: boolean
    log_failed_attempts: boolean
    retention_days: number
    real_time_alerts: boolean
  }
  compliance_settings: {
    hipaa_logging: boolean
    phi_access_logging: boolean
    consent_tracking: boolean
    breach_notification: boolean
  }
}

// IP Access Control Types
export interface IPRestriction {
  id: string
  ip_address: string
  ip_range?: string
  type: 'allow' | 'block'
  reason: string
  created_by: string
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface GeoRestriction {
  id: string
  country_code: string
  region?: string
  type: 'allow' | 'block'
  reason: string
  created_by: string
  created_at: string
  is_active: boolean
}

// Threat Detection Types
export interface ThreatPattern {
  id: string
  name: string
  description: string
  pattern_type: 'login_anomaly' | 'access_pattern' | 'data_exfiltration' | 'privilege_escalation'
  detection_rules: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  auto_block: boolean
  notification_enabled: boolean
  is_active: boolean
}

export interface SecurityAlert {
  id: string
  alert_type: 'failed_login' | 'suspicious_access' | 'data_breach_attempt' | 'compliance_violation' | 'system_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  user_id?: string
  ip_address?: string
  resource_affected?: string
  detection_time: string
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolution_notes?: string
  resolved_at?: string
  metadata?: Record<string, any>
}

// Compliance Types
export interface ComplianceEvent {
  id: string
  event_type: 'hipaa_violation' | 'compliance_check' | 'audit_trail' | 'phi_access' | 'consent_update'
  severity: 'info' | 'warning' | 'violation'
  description: string
  user_id?: string
  patient_id?: string
  phi_type?: string
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review'
  timestamp: string
  remediation_required: boolean
  remediation_notes?: string
  reviewed_by?: string
  reviewed_at?: string
}

// Activity Monitoring Types
export interface ActivityMonitor {
  id: string
  monitor_type: 'user_behavior' | 'system_access' | 'data_access' | 'admin_actions'
  name: string
  description: string
  rules: Record<string, any>
  threshold_settings: {
    warning_threshold: number
    alert_threshold: number
    block_threshold: number
  }
  notification_settings: {
    email_alerts: boolean
    sms_alerts: boolean
    dashboard_alerts: boolean
    webhook_url?: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MonitoringResult {
  id: string
  monitor_id: string
  user_id?: string
  resource_id?: string
  result_type: 'normal' | 'warning' | 'alert' | 'blocked'
  score: number
  threshold_exceeded: boolean
  details: Record<string, any>
  timestamp: string
  action_taken?: string
}

// Encryption and Data Protection Types
export interface EncryptionStatus {
  id: string
  resource_type: 'database' | 'file_storage' | 'backups' | 'communications'
  resource_name: string
  encryption_type: 'at_rest' | 'in_transit' | 'end_to_end'
  algorithm: string
  key_rotation_status: 'current' | 'pending' | 'overdue'
  last_rotation: string
  next_rotation: string
  compliance_status: 'compliant' | 'non_compliant'
  details: Record<string, any>
}

// Security Metrics Summary Types (for dashboard display)
export interface SecurityMetricsSummary {
  overall_score: number
  threat_level: ThreatLevel
  active_incidents: number
  resolved_incidents_24h: number
  failed_login_attempts_24h: number
  successful_logins_24h: number
  mfa_adoption_rate: number
  compliance_score: number
  system_health: 'healthy' | 'warning' | 'critical'
  last_security_scan: string
  vulnerability_count: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

// API Response Types
export interface SecurityDashboardResponse {
  success: boolean
  data?: {
    metrics: SecurityMetricsSummary
    recent_incidents: SecurityIncident[]
    active_alerts: SecurityAlert[]
    activity_summary: {
      total_sessions: number
      failed_logins: number
      successful_logins: number
      data_access_events: number
      admin_actions: number
      compliance_events: number
    }
    compliance_status: {
      hipaa_compliant: boolean
      audit_trail_complete: boolean
      encryption_status: 'compliant' | 'non_compliant'
      access_controls: 'compliant' | 'non_compliant'
    }
  }
  error?: string
  timestamp: string
}

// Form Types for Admin Actions
export interface IncidentActionRequest {
  incident_id: string
  action: 'acknowledge' | 'resolve' | 'escalate' | 'assign'
  notes?: string
  assigned_to?: string
  resolution?: string
}

export interface SecurityConfigUpdateRequest {
  section: 'password_policy' | 'session_policy' | 'audit_policy' | 'compliance_settings'
  settings: Record<string, any>
  updated_by: string
}

export interface UserSecurityActionRequest {
  user_id: string
  action: 'suspend' | 'unsuspend' | 'reset_password' | 'reset_mfa' | 'update_roles'
  reason: string
  duration?: number
  new_roles?: string[]
  performed_by: string
}

// Export all types for easy importing
export type {
  // Main security entities
  SecurityIncident,
  SecurityAlert,
  ComplianceEvent,
  ActivityMonitor,
  MonitoringResult,
  
  // User and session management
  UserSession,
  Role,
  Permission,
  UserRole,
  MFASetup,
  MFAVerification,
  
  // Access control
  IPRestriction,
  GeoRestriction,
  ThreatPattern,
  
  // Data protection
  EncryptionStatus,
  SecurityConfig,
  
  // Dashboard and metrics
  SecurityMetricsSummary,
  SecurityDashboardResponse,
  
  // API requests
  IncidentActionRequest,
  SecurityConfigUpdateRequest,
  UserSecurityActionRequest
}