/**
 * API Versioning and Backward Compatibility Service
 * Healthcare-compliant API version management with semantic versioning
 */

import { createClient } from '@supabase/supabase-js';

export interface APIVersion {
  id: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  status: 'current' | 'deprecated' | 'sunset' | 'retired';
  releaseDate: string;
  deprecationDate?: string;
  sunsetDate?: string;
  retirementDate?: string;
  changelog: string;
  breakingChanges: BreakingChange[];
  migrationGuide?: string;
  healthcareCompliance: HealthcareComplianceInfo;
  backwardCompatibility: BackwardCompatibilityInfo;
}

export interface BreakingChange {
  id: string;
  type: 'endpoint' | 'parameter' | 'response' | 'authentication' | 'data_model';
  description: string;
  affectedEndpoints: string[];
  migrationPath: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  healthcareImpact: boolean;
}

export interface HealthcareComplianceInfo {
  hipaaCompliant: boolean;
  fhirCompliant: boolean;
  auditRequired: boolean;
  dataEncryption: boolean;
  accessLogging: boolean;
  complianceNotes?: string;
}

export interface BackwardCompatibilityInfo {
  isCompatible: boolean;
  compatibilityScore: number; // 0-100
  supportedVersions: string[];
  deprecatedFeatures: string[];
  migrationRequired: boolean;
  estimatedMigrationTime: string;
}

export interface VersionMigration {
  id: string;
  fromVersion: string;
  toVersion: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  organizationId: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  migrationSteps: MigrationStep[];
  rollbackPlan?: RollbackPlan;
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedDuration: number; // minutes
  healthcareImpact: boolean;
  requiresDowntime: boolean;
  validationRules: string[];
}

export interface RollbackPlan {
  id: string;
  description: string;
  steps: string[];
  estimatedRollbackTime: number; // minutes
  dataBackupRequired: boolean;
  healthcareDataImpact: boolean;
}

export class APIVersioningService {
  private supabase: any;
  private currentVersion: string = '1.0.0';
  private supportedVersions: string[] = ['1.0.0'];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get current API version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Get all supported API versions
   */
  getSupportedVersions(): string[] {
    return this.supportedVersions;
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: string): boolean {
    return this.supportedVersions.includes(version);
  }

  /**
   * Get version information
   */
  async getVersionInfo(version: string): Promise<APIVersion | null> {
    try {
      const { data, error } = await this.supabase
        .from('api_versions')
        .select('*')
        .eq('version', version)
        .single();

      if (error || !data) return null;

      return this.formatVersionInfo(data);
    } catch (error) {
      console.error('Failed to get version info:', error);
      return null;
    }
  }

  /**
   * Create new API version
   */
  async createVersion(versionData: Omit<APIVersion, 'id'>): Promise<APIVersion> {
    try {
      const id = crypto.randomUUID();
      const version: APIVersion = {
        ...versionData,
        id
      };

      const { data, error } = await this.supabase
        .from('api_versions')
        .insert([version])
        .select()
        .single();

      if (error) throw error;

      // Update supported versions
      if (!this.supportedVersions.includes(version.version)) {
        this.supportedVersions.push(version.version);
      }

      return data;
    } catch (error) {
      console.error('Failed to create version:', error);
      throw new Error('Version creation failed');
    }
  }

  /**
   * Deprecate API version
   */
  async deprecateVersion(version: string, deprecationDate: string): Promise<void> {
    try {
      await this.supabase
        .from('api_versions')
        .update({
          status: 'deprecated',
          deprecation_date: deprecationDate,
          updated_at: new Date().toISOString()
        })
        .eq('version', version);

      // Log deprecation event
      await this.logVersionEvent({
        version,
        event: 'deprecated',
        details: { deprecationDate }
      });
    } catch (error) {
      console.error('Failed to deprecate version:', error);
      throw new Error('Version deprecation failed');
    }
  }

  /**
   * Sunset API version
   */
  async sunsetVersion(version: string, sunsetDate: string): Promise<void> {
    try {
      await this.supabase
        .from('api_versions')
        .update({
          status: 'sunset',
          sunset_date: sunsetDate,
          updated_at: new Date().toISOString()
        })
        .eq('version', version);

      // Remove from supported versions
      this.supportedVersions = this.supportedVersions.filter(v => v !== version);

      // Log sunset event
      await this.logVersionEvent({
        version,
        event: 'sunset',
        details: { sunsetDate }
      });
    } catch (error) {
      console.error('Failed to sunset version:', error);
      throw new Error('Version sunset failed');
    }
  }

  /**
   * Check backward compatibility between versions
   */
  async checkBackwardCompatibility(
    fromVersion: string,
    toVersion: string
  ): Promise<BackwardCompatibilityInfo> {
    try {
      const fromInfo = await this.getVersionInfo(fromVersion);
      const toInfo = await this.getVersionInfo(toVersion);

      if (!fromInfo || !toInfo) {
        throw new Error('Version information not found');
      }

      // Calculate compatibility score
      const compatibilityScore = this.calculateCompatibilityScore(fromInfo, toInfo);
      
      // Check for breaking changes
      const breakingChanges = toInfo.breakingChanges.filter(
        change => this.isBreakingChangeRelevant(change, fromVersion)
      );

      // Determine migration requirements
      const migrationRequired = breakingChanges.length > 0 || compatibilityScore < 80;

      return {
        isCompatible: compatibilityScore >= 80,
        compatibilityScore,
        supportedVersions: this.supportedVersions,
        deprecatedFeatures: this.getDeprecatedFeatures(fromInfo, toInfo),
        migrationRequired,
        estimatedMigrationTime: this.estimateMigrationTime(breakingChanges)
      };
    } catch (error) {
      console.error('Failed to check backward compatibility:', error);
      throw new Error('Compatibility check failed');
    }
  }

  /**
   * Create migration plan
   */
  async createMigrationPlan(
    organizationId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<VersionMigration> {
    try {
      const compatibility = await this.checkBackwardCompatibility(fromVersion, toVersion);
      
      if (!compatibility.migrationRequired) {
        throw new Error('No migration required for these versions');
      }

      const migrationId = crypto.randomUUID();
      const migration: VersionMigration = {
        id: migrationId,
        fromVersion,
        toVersion,
        status: 'pending',
        organizationId,
        migrationSteps: this.generateMigrationSteps(fromVersion, toVersion),
        rollbackPlan: this.generateRollbackPlan(fromVersion, toVersion)
      };

      // Store migration plan
      await this.supabase
        .from('version_migrations')
        .insert([migration]);

      return migration;
    } catch (error) {
      console.error('Failed to create migration plan:', error);
      throw new Error('Migration plan creation failed');
    }
  }

  /**
   * Execute migration
   */
  async executeMigration(migrationId: string): Promise<void> {
    try {
      const { data: migration, error } = await this.supabase
        .from('version_migrations')
        .select('*')
        .eq('id', migrationId)
        .single();

      if (error || !migration) {
        throw new Error('Migration not found');
      }

      // Update migration status
      await this.supabase
        .from('version_migrations')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', migrationId);

      // Execute migration steps
      for (const step of migration.migration_steps) {
        try {
          await this.executeMigrationStep(step);
          
          // Update step status
          await this.supabase
            .from('migration_steps')
            .update({ status: 'completed' })
            .eq('id', step.id);
        } catch (error) {
          // Update step status
          await this.supabase
            .from('migration_steps')
            .update({ 
              status: 'failed',
              error_message: error.message
            })
            .eq('id', step.id);

          // Update migration status
          await this.supabase
            .from('version_migrations')
            .update({
              status: 'failed',
              error_message: error.message
            })
            .eq('id', migrationId);

          throw error;
        }
      }

      // Mark migration as completed
      await this.supabase
        .from('version_migrations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', migrationId);

    } catch (error) {
      console.error('Migration execution failed:', error);
      throw new Error('Migration execution failed');
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrationId: string): Promise<VersionMigration | null> {
    try {
      const { data, error } = await this.supabase
        .from('version_migrations')
        .select('*')
        .eq('id', migrationId)
        .single();

      if (error || !data) return null;

      return this.formatMigrationInfo(data);
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return null;
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(migrationId: string): Promise<void> {
    try {
      const migration = await this.getMigrationStatus(migrationId);
      if (!migration || !migration.rollbackPlan) {
        throw new Error('Migration or rollback plan not found');
      }

      // Execute rollback steps
      for (const step of migration.rollbackPlan.steps) {
        await this.executeRollbackStep(step);
      }

      // Update migration status
      await this.supabase
        .from('version_migrations')
        .update({
          status: 'rollback_completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', migrationId);

    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw new Error('Migration rollback failed');
    }
  }

  // Private helper methods

  private formatVersionInfo(data: any): APIVersion {
    return {
      id: data.id,
      version: data.version,
      major: data.major,
      minor: data.minor,
      patch: data.patch,
      status: data.status,
      releaseDate: data.release_date,
      deprecationDate: data.deprecation_date,
      sunsetDate: data.sunset_date,
      retirementDate: data.retirement_date,
      changelog: data.changelog,
      breakingChanges: data.breaking_changes || [],
      migrationGuide: data.migration_guide,
      healthcareCompliance: data.healthcare_compliance || {},
      backwardCompatibility: data.backward_compatibility || {}
    };
  }

  private formatMigrationInfo(data: any): VersionMigration {
    return {
      id: data.id,
      fromVersion: data.from_version,
      toVersion: data.to_version,
      status: data.status,
      organizationId: data.organization_id,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      errorMessage: data.error_message,
      migrationSteps: data.migration_steps || [],
      rollbackPlan: data.rollback_plan
    };
  }

  private calculateCompatibilityScore(fromInfo: APIVersion, toInfo: APIVersion): number {
    let score = 100;

    // Deduct points for breaking changes
    const breakingChanges = toInfo.breakingChanges.filter(
      change => this.isBreakingChangeRelevant(change, fromInfo.version)
    );

    breakingChanges.forEach(change => {
      switch (change.severity) {
        case 'low': score -= 5; break;
        case 'medium': score -= 15; break;
        case 'high': score -= 30; break;
        case 'critical': score -= 50; break;
      }
    });

    // Deduct points for healthcare compliance changes
    if (fromInfo.healthcareCompliance.hipaaCompliant && !toInfo.healthcareCompliance.hipaaCompliant) {
      score -= 25;
    }

    if (fromInfo.healthcareCompliance.fhirCompliant && !toInfo.healthcareCompliance.fhirCompliant) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  private isBreakingChangeRelevant(change: BreakingChange, fromVersion: string): boolean {
    // This would implement logic to determine if a breaking change affects the from version
    return true; // Simplified for now
  }

  private getDeprecatedFeatures(fromInfo: APIVersion, toInfo: APIVersion): string[] {
    // This would compare features between versions to identify deprecated ones
    return []; // Simplified for now
  }

  private estimateMigrationTime(breakingChanges: BreakingChange[]): string {
    const totalMinutes = breakingChanges.reduce((total, change) => {
      switch (change.severity) {
        case 'low': return total + 30;
        case 'medium': return total + 120;
        case 'high': return total + 480;
        case 'critical': return total + 1440;
        default: return total;
      }
    }, 0);

    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    if (totalMinutes < 1440) return `${Math.round(totalMinutes / 60)} hours`;
    return `${Math.round(totalMinutes / 1440)} days`;
  }

  private generateMigrationSteps(fromVersion: string, toVersion: string): MigrationStep[] {
    // This would generate specific migration steps based on version differences
    return [
      {
        id: crypto.randomUUID(),
        name: 'Update API endpoints',
        description: 'Update API endpoints to new version',
        status: 'pending',
        estimatedDuration: 60,
        healthcareImpact: true,
        requiresDowntime: false,
        validationRules: ['endpoint_validation', 'response_validation']
      },
      {
        id: crypto.randomUUID(),
        name: 'Update authentication',
        description: 'Update authentication mechanisms',
        status: 'pending',
        estimatedDuration: 30,
        healthcareImpact: true,
        requiresDowntime: false,
        validationRules: ['auth_validation', 'token_validation']
      }
    ];
  }

  private generateRollbackPlan(fromVersion: string, toVersion: string): RollbackPlan {
    return {
      id: crypto.randomUUID(),
      description: `Rollback from ${toVersion} to ${fromVersion}`,
      steps: [
        'Revert API endpoints to previous version',
        'Restore previous authentication configuration',
        'Validate data integrity',
        'Update client configurations'
      ],
      estimatedRollbackTime: 30,
      dataBackupRequired: true,
      healthcareDataImpact: true
    };
  }

  private async executeMigrationStep(step: MigrationStep): Promise<void> {
    // This would execute the actual migration step
    console.log(`Executing migration step: ${step.name}`);
  }

  private async executeRollbackStep(step: string): Promise<void> {
    // This would execute the rollback step
    console.log(`Executing rollback step: ${step}`);
  }

  private async logVersionEvent(event: any): Promise<void> {
    try {
      await this.supabase
        .from('version_events')
        .insert([{
          id: crypto.randomUUID(),
          ...event,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Failed to log version event:', error);
    }
  }
}

export default APIVersioningService;