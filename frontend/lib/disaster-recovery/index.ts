/**
 * Disaster Recovery System - Main Export
 * Centralized export for all disaster recovery components
 */

// Main coordinator
export { 
  disasterRecoveryManager,
  DisasterRecoveryManager 
} from './disaster-recovery-manager'

// Individual components
export { 
  databaseBackupManager,
  DatabaseBackupManager 
} from './database-backup'

export { 
  applicationBackupManager,
  ApplicationBackupManager 
} from './application-backup'

export { 
  infrastructureMonitor,
  InfrastructureMonitor 
} from './infrastructure-monitor'

export { 
  recoveryTestingManager,
  RecoveryTestingManager 
} from './recovery-testing'

// Types
export type {
  DisasterRecoveryConfig,
  DisasterRecoveryStatus,
  RecoveryPlan,
  RecoveryStep
} from './disaster-recovery-manager'

export type {
  BackupConfig,
  BackupMetadata,
  RecoveryPoint
} from './database-backup'

export type {
  ApplicationBackupConfig,
  ApplicationBackupMetadata,
  ApplicationRestoreOptions
} from './application-backup'

export type {
  MonitoringConfig,
  ServiceEndpoint,
  HealthStatus,
  FailoverEvent
} from './infrastructure-monitor'

export type {
  RecoveryTestConfig,
  RecoveryTestResult,
  TestPhaseResult,
  RecoveryTestSuite,
  RecoveryTestType
} from './recovery-testing'