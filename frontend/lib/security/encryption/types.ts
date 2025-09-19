/**
 * Encryption System Types - Comprehensive type definitions for admin operations encryption
 * 
 * HIPAA Technical Safeguards Requirements:
 * - Data integrity controls (45 CFR §164.312(c)(1))
 * - Transmission security (45 CFR §164.312(e))
 * - Person or Entity Authentication (45 CFR §164.312(d))
 * - Encryption at rest for sensitive administrative data
 * 
 * Story 1.6 Task 7: Data Encryption for Admin Operations
 */

// Core Encryption Types
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm'
  keyDerivation: 'pbkdf2'
  iterations: number
  saltLength: number
  ivLength: number
  tagLength: number
  keyRotationDays: number
  backupRetentionDays: number
}

export interface EncryptedFieldData {
  encrypted: string
  iv: string
  tag: string
  salt: string
  algorithm: string
  timestamp: string
  keyVersion: number
}

export interface EncryptionKey {
  id: string
  version: number
  keyData: Buffer
  algorithm: string
  purpose: EncryptionPurpose
  createdAt: string
  expiresAt?: string
  status: KeyStatus
  metadata: KeyMetadata
}

export enum KeyStatus {
  ACTIVE = 'active',
  ROTATING = 'rotating',
  DEPRECATED = 'deprecated',
  REVOKED = 'revoked',
  COMPROMISED = 'compromised'
}

export enum EncryptionPurpose {
  ADMIN_DATA = 'admin_data',
  BACKUP = 'backup',
  COMMUNICATION = 'communication',
  AUDIT_LOG = 'audit_log',
  PATIENT_DATA = 'patient_data',
  SYSTEM_CONFIG = 'system_config'
}

export interface KeyMetadata {
  createdBy: string
  rotationPolicy: KeyRotationPolicy
  complianceFrameworks: string[]
  accessRestrictions: KeyAccessRestriction[]
  usageTracking: boolean
}

export interface KeyRotationPolicy {
  automatic: boolean
  intervalDays: number
  gracePeriodDays: number
  notificationThresholdDays: number
  requireManualApproval: boolean
}

export interface KeyAccessRestriction {
  userRole: string
  permission: 'read' | 'write' | 'rotate' | 'revoke'
  conditions?: Record<string, any>
}

// Field-Level Encryption Types
export interface FieldEncryptionConfig {
  tableName: string
  fieldName: string
  encryptionPurpose: EncryptionPurpose
  keyVersion?: number
  mandatory: boolean
  searchable: boolean
  auditRequired: boolean
}

export interface EncryptedField {
  originalField: string
  encryptedData: EncryptedFieldData
  searchHash?: string
  encryptionConfig: FieldEncryptionConfig
}

export interface FieldEncryptionResult {
  success: boolean
  encryptedData?: EncryptedFieldData
  searchHash?: string
  error?: string
  keyVersion: number
}

export interface FieldDecryptionResult {
  success: boolean
  decryptedData?: string
  error?: string
  keyVersion: number
  verified: boolean
}

// Backup and Recovery Types
export interface EncryptedBackup {
  id: string
  backupType: BackupType
  sourceData: string
  encryptedData: EncryptedFieldData
  backupMetadata: BackupMetadata
  integrityHash: string
  createdAt: string
  expiresAt?: string
}

export enum BackupType {
  FULL_SYSTEM = 'full_system',
  INCREMENTAL = 'incremental',
  ADMIN_CONFIG = 'admin_config',
  USER_DATA = 'user_data',
  AUDIT_LOGS = 'audit_logs',
  ENCRYPTION_KEYS = 'encryption_keys'
}

export interface BackupMetadata {
  version: string
  size: number
  compressionRatio?: number
  sourceSystem: string
  createdBy: string
  complianceRequirements: string[]
  retentionPolicy: BackupRetentionPolicy
  recoveryProcedure: string
}

export interface BackupRetentionPolicy {
  retentionDays: number
  archiveAfterDays: number
  permanentDeletion: boolean
  complianceHold: boolean
  legalHold: boolean
}

export interface BackupRecoveryRequest {
  backupId: string
  recoveryType: RecoveryType
  targetLocation: string
  verifyIntegrity: boolean
  requestedBy: string
  approvedBy?: string
  reason: string
}

export enum RecoveryType {
  FULL_RESTORE = 'full_restore',
  SELECTIVE_RESTORE = 'selective_restore',
  VERIFICATION_ONLY = 'verification_only',
  EXPORT_ONLY = 'export_only'
}

// API Encryption Types
export interface EncryptedAPIRequest {
  encryptedPayload: EncryptedFieldData
  keyVersion: number
  requestId: string
  timestamp: string
  integrity: string
}

export interface EncryptedAPIResponse {
  encryptedData?: EncryptedFieldData
  success: boolean
  error?: string
  keyVersion: number
  timestamp: string
}

export interface APIEncryptionMiddlewareConfig {
  enableEncryption: boolean
  encryptedEndpoints: string[]
  excludedEndpoints: string[]
  keyPurpose: EncryptionPurpose
  requireClientCertificate: boolean
  maxPayloadSize: number
  timeoutSeconds: number
}

// Key Management Types
export interface KeyManagementOperation {
  id: string
  operation: KeyOperation
  keyId: string
  operatedBy: string
  timestamp: string
  reason: string
  status: OperationStatus
  approvals: KeyOperationApproval[]
  auditTrail: KeyAuditEntry[]
}

export enum KeyOperation {
  CREATE = 'create',
  ROTATE = 'rotate',
  REVOKE = 'revoke',
  BACKUP = 'backup',
  RESTORE = 'restore',
  DERIVE = 'derive',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum OperationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REQUIRES_APPROVAL = 'requires_approval'
}

export interface KeyOperationApproval {
  approvedBy: string
  approvedAt: string
  comments?: string
  conditions?: string[]
}

export interface KeyAuditEntry {
  timestamp: string
  action: string
  performedBy: string
  details: Record<string, any>
  ipAddress?: string
  sessionId?: string
}

export interface KeyDerivationConfig {
  baseKeyId: string
  derivationPurpose: EncryptionPurpose
  derivationInfo: Buffer
  iterations: number
  outputLength: number
}

// Healthcare Compliance Types
export interface HIPAAEncryptionCompliance {
  encryptionMethod: string
  keyStrength: number
  integrityProtection: boolean
  accessControls: boolean
  auditLogging: boolean
  keyManagement: boolean
  transmissionSecurity: boolean
  complianceScore: number
  lastAudit: string
  findings: ComplianceFinding[]
}

export interface ComplianceFinding {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'encryption' | 'key_management' | 'access_control' | 'audit' | 'integrity'
  description: string
  remediation: string
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk'
  dueDate?: string
  assignedTo?: string
}

// Encryption Service Types
export interface EncryptionServiceConfig {
  defaultPurpose: EncryptionPurpose
  autoKeyRotation: boolean
  encryptionConfig: EncryptionConfig
  keyManagement: KeyManagementConfig
  backupConfig: BackupEncryptionConfig
  complianceConfig: ComplianceEncryptionConfig
}

export interface KeyManagementConfig {
  keyStorage: 'database' | 'hsm' | 'file' | 'cloud_kms'
  keyDistribution: 'centralized' | 'distributed'
  keyEscrow: boolean
  multiPartyControl: boolean
  threshold: number
  keyRecovery: boolean
}

export interface BackupEncryptionConfig {
  enabled: boolean
  compressionBeforeEncryption: boolean
  multiLayerEncryption: boolean
  offSiteBackups: boolean
  encryptionAtRest: boolean
  encryptionInTransit: boolean
}

export interface ComplianceEncryptionConfig {
  hipaaRequired: boolean
  hitrustRequired: boolean
  soc2Required: boolean
  auditTrailRequired: boolean
  keyEscrowRequired: boolean
  dataClassificationRequired: boolean
}

// Search and Indexing Types (for searchable encrypted fields)
export interface SearchableEncryption {
  fieldName: string
  searchIndex: string
  hashAlgorithm: 'sha256' | 'blake2b'
  saltedHash: boolean
  rangeSearchSupport: boolean
}

export interface EncryptedSearchQuery {
  field: string
  searchTerm: string
  searchType: 'exact' | 'prefix' | 'fuzzy' | 'range'
  hashedQuery: string
  salt?: string
}

// Performance and Monitoring Types
export interface EncryptionPerformanceMetrics {
  encryptionLatency: number
  decryptionLatency: number
  keyDerivationLatency: number
  throughputMBps: number
  errorRate: number
  cacheHitRate: number
  keyRotationLatency?: number
}

export interface EncryptionHealthCheck {
  service: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  lastCheck: string
  metrics: EncryptionPerformanceMetrics
  errors: string[]
  recommendations: string[]
}

// Error and Exception Types
export class EncryptionError extends Error {
  constructor(
    message: string,
    public code: EncryptionErrorCode,
    public details?: Record<string, any>,
    public keyVersion?: number,
    public timestamp: string = new Date().toISOString(),
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export enum EncryptionErrorCode {
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_EXPIRED = 'KEY_EXPIRED',
  KEY_REVOKED = 'KEY_REVOKED',
  INVALID_KEY_FORMAT = 'INVALID_KEY_FORMAT',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_DERIVATION_FAILED = 'KEY_DERIVATION_FAILED',
  INTEGRITY_CHECK_FAILED = 'INTEGRITY_CHECK_FAILED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION'
}

// Utility Types
export type EncryptionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  keyVersion: number
  timestamp: string
}

export type DecryptionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  keyVersion: number
  verified: boolean
  timestamp: string
}

// Export configuration constants
export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  saltLength: 64,
  ivLength: 16,
  tagLength: 16,
  keyRotationDays: 90,
  backupRetentionDays: 2555 // 7 years for HIPAA compliance
}

// Export all types for easy importing
export type {
  // Core encryption
  EncryptionConfig,
  EncryptedFieldData,
  EncryptionKey,
  KeyMetadata,
  KeyRotationPolicy,
  KeyAccessRestriction,
  
  // Field-level encryption
  FieldEncryptionConfig,
  EncryptedField,
  FieldEncryptionResult,
  FieldDecryptionResult,
  
  // Backup and recovery
  EncryptedBackup,
  BackupMetadata,
  BackupRetentionPolicy,
  BackupRecoveryRequest,
  
  // API encryption
  EncryptedAPIRequest,
  EncryptedAPIResponse,
  APIEncryptionMiddlewareConfig,
  
  // Key management
  KeyManagementOperation,
  KeyOperationApproval,
  KeyAuditEntry,
  KeyDerivationConfig,
  
  // Compliance
  HIPAAEncryptionCompliance,
  ComplianceFinding,
  
  // Service configuration
  EncryptionServiceConfig,
  KeyManagementConfig,
  BackupEncryptionConfig,
  ComplianceEncryptionConfig,
  
  // Search and performance
  SearchableEncryption,
  EncryptedSearchQuery,
  EncryptionPerformanceMetrics,
  EncryptionHealthCheck,
  
  // Error handling
  EncryptionError,
  EncryptionResult,
  DecryptionResult
}