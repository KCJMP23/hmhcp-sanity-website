export { DeploymentManager } from './deployment-manager'
export { defaultChecklist } from './checklist-data'
export type { 
  DeploymentChecklist, 
  DeploymentReport, 
  DeploymentConfig 
} from './types'

// Import DeploymentManager and types for use in this file
import { DeploymentManager } from './deployment-manager'
import type { DeploymentReport } from './types'

// Validator exports for custom implementations
export * as InfrastructureValidators from './validators/infrastructure'
export * as SecurityValidators from './validators/security'
export * as PerformanceValidators from './validators/performance'
export * as MonitoringValidators from './validators/monitoring'
export * as TestingValidators from './validators/testing'
export * as ContentValidators from './validators/content'

// Convenience function to get a deployment manager instance
export function getDeploymentManager(): DeploymentManager {
  return DeploymentManager.getInstance()
}

// Quick validation functions
export async function validateInfrastructure(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('infrastructure')
  return report.summary.failed === 0
}

export async function validateSecurity(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('security')
  return report.summary.failed === 0
}

export async function validatePerformance(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('performance')
  return report.summary.failed === 0
}

export async function validateMonitoring(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('monitoring')
  return report.summary.failed === 0
}

export async function validateTesting(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('testing')
  return report.summary.failed === 0
}

export async function validateContent(): Promise<boolean> {
  const manager = DeploymentManager.getInstance()
  const report = await manager.runCategoryValidation('content')
  return report.summary.failed === 0
}

export async function runFullDeploymentValidation(): Promise<DeploymentReport> {
  const manager = DeploymentManager.getInstance()
  return await manager.runValidation()
}