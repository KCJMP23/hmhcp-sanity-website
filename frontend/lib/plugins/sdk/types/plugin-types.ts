/**
 * Plugin Development SDK Type Definitions
 * 
 * Comprehensive TypeScript types for plugin development, execution, and management
 * with healthcare compliance and enterprise integration support.
 */

export interface PluginDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  author: string;
  plugin_type: PluginType;
  manifest: PluginManifest;
  sandbox_config: SandboxConfig;
  healthcare_compliance: HealthcareCompliance;
  api_endpoints: PluginApiEndpoints;
  marketplace_status: MarketplaceStatus;
  installation_count: number;
  rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface PluginInstallation {
  id: string;
  plugin_id: string;
  organization_id: string;
  version: string;
  configuration: Record<string, any>;
  permissions: PluginPermissions;
  resource_limits: ResourceLimits;
  sandbox_environment: boolean;
  status: PluginStatus;
  installed_by: string;
  installed_at: Date;
  last_updated: Date;
}

export interface PluginExecution {
  id: string;
  plugin_installation_id: string;
  execution_context: Record<string, any>;
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  execution_time_ms: number;
  memory_usage_mb: number;
  status: ExecutionStatus;
  error_message: string | null;
  healthcare_data_accessed: boolean;
  compliance_validation: ComplianceValidation;
  executed_at: Date;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  engines: {
    node: string;
    npm?: string;
  };
  dependencies: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts: Record<string, string>;
  main: string;
  types?: string;
  files: string[];
  healthcare_specializations: string[];
  compliance_certifications: string[];
  price_model?: PriceModel;
}

export interface SandboxConfig {
  memory_limit: string;
  execution_timeout: number;
  network_access: boolean;
  file_system_access: boolean;
  environment_variables: string[];
  allowed_apis: string[];
  security_policies: SecurityPolicy[];
}

export interface HealthcareCompliance {
  compliance_level: HealthcareComplianceLevel;
  hipaa_compliant: boolean;
  fda_compliant: boolean;
  fhir_compliant: boolean;
  data_protection_level: DataProtectionLevel;
  audit_requirements: AuditRequirement[];
  validation_checks: ValidationCheck[];
}

export interface PluginApiEndpoints {
  webhooks: WebhookEndpoint[];
  rest_endpoints: RestEndpoint[];
  graphql_endpoints?: GraphQLEndpoint[];
  real_time_endpoints?: RealTimeEndpoint[];
}

export interface PluginPermissions {
  data_access_level: DataAccessLevel;
  healthcare_data_access: boolean;
  ai_agent_interaction: boolean;
  file_system_access: boolean;
  network_access: boolean;
  database_access: boolean;
  api_access: string[];
}

export interface ResourceLimits {
  memory_limit: string;
  execution_timeout: number;
  api_call_limit: number;
  storage_limit: string;
  concurrent_executions: number;
}

export interface ComplianceValidation {
  validated: boolean;
  compliance_level: HealthcareComplianceLevel;
  validated_at: Date;
  validation_errors?: string[];
}

// Enums and Union Types
export type PluginType = 
  | 'ai_agent' 
  | 'integration' 
  | 'ui_component' 
  | 'workflow_extension'
  | 'data_processor'
  | 'analytics'
  | 'security'
  | 'compliance';

export type MarketplaceStatus = 
  | 'approved' 
  | 'pending' 
  | 'rejected' 
  | 'private'
  | 'deprecated';

export type PluginStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended' 
  | 'error'
  | 'updating';

export type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'timeout'
  | 'cancelled';

export type HealthcareComplianceLevel = 
  | 'standard' 
  | 'enhanced' 
  | 'expert_review'
  | 'enterprise';

export type DataProtectionLevel = 
  | 'basic' 
  | 'standard' 
  | 'enhanced' 
  | 'maximum';

export type DataAccessLevel = 
  | 'read_only' 
  | 'read_write' 
  | 'admin'
  | 'full_control';

// Supporting Interfaces
export interface WebhookEndpoint {
  url: string;
  events: string[];
  authentication: WebhookAuth;
  retry_policy: RetryPolicy;
  validation: WebhookValidation;
}

export interface RestEndpoint {
  path: string;
  method: HttpMethod;
  authentication: RestAuth;
  rate_limiting: RateLimiting;
  validation: RestValidation;
}

export interface GraphQLEndpoint {
  schema: string;
  resolvers: Record<string, any>;
  authentication: GraphQLAuth;
  rate_limiting: RateLimiting;
}

export interface RealTimeEndpoint {
  channel: string;
  events: string[];
  authentication: RealTimeAuth;
  permissions: string[];
}

export interface SecurityPolicy {
  name: string;
  description: string;
  rules: SecurityRule[];
  enforcement: PolicyEnforcement;
}

export interface AuditRequirement {
  event_type: string;
  data_captured: string[];
  retention_period: number;
  compliance_framework: string;
}

export interface ValidationCheck {
  name: string;
  description: string;
  validation_function: string;
  required: boolean;
  error_message: string;
}

export interface PriceModel {
  type: 'free' | 'subscription' | 'one_time' | 'usage_based';
  amount?: number;
  currency?: string;
  billing_period?: string;
  usage_limits?: UsageLimits;
}

export interface UsageLimits {
  api_calls: number;
  executions: number;
  storage: string;
  users: number;
}

export interface WebhookAuth {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2';
  credentials: Record<string, any>;
}

export interface RestAuth {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2' | 'basic';
  credentials: Record<string, any>;
}

export interface GraphQLAuth {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2';
  credentials: Record<string, any>;
}

export interface RealTimeAuth {
  type: 'none' | 'api_key' | 'jwt' | 'oauth2';
  credentials: Record<string, any>;
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential' | 'fixed';
  initial_delay: number;
  max_delay: number;
}

export interface WebhookValidation {
  signature_validation: boolean;
  payload_validation: boolean;
  schema?: any;
}

export interface RestValidation {
  request_validation: boolean;
  response_validation: boolean;
  schema?: any;
}

export interface RateLimiting {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_limit: number;
}

export interface SecurityRule {
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PolicyEnforcement {
  mode: 'strict' | 'permissive' | 'warning';
  fallback_action: 'allow' | 'deny';
  logging_level: 'minimal' | 'standard' | 'verbose';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Plugin Development Context
export interface PluginContext {
  pluginId: string;
  organizationId: string;
  userId: string;
  environment: 'development' | 'staging' | 'production';
  configuration: Record<string, any>;
  permissions: PluginPermissions;
  resourceLimits: ResourceLimits;
  auditLogger: AuditLogger;
}

export interface AuditLogger {
  logPluginAction(
    action: string, 
    pluginId: string, 
    metadata: Record<string, any>
  ): Promise<void>;
  
  logHealthcareDataAccess(
    pluginId: string, 
    dataType: string, 
    accessLevel: string
  ): Promise<void>;
  
  logComplianceEvent(
    pluginId: string, 
    eventType: string, 
    details: Record<string, any>
  ): Promise<void>;
}

// Plugin Builder Types
export interface PluginBuilderConfig {
  name: string;
  type: PluginType;
  version: string;
  description: string;
  author: string;
  healthcareCompliance: HealthcareCompliance;
  apiEndpoints: PluginApiEndpoints;
  permissions: PluginPermissions;
  resourceLimits: ResourceLimits;
}

export interface PluginBuilder {
  createPlugin(config: PluginBuilderConfig): Promise<PluginDefinition>;
  validatePlugin(plugin: PluginDefinition): Promise<ValidationResult>;
  buildPlugin(plugin: PluginDefinition): Promise<BuildResult>;
  testPlugin(plugin: PluginDefinition): Promise<TestResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface BuildResult {
  success: boolean;
  outputPath: string;
  bundleSize: number;
  dependencies: string[];
  errors: string[];
}

export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  results: TestCaseResult[];
}

export interface TestCaseResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  coverage?: number;
}
