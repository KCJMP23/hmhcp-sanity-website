/**
 * Healthcare-Specific Type Definitions
 * 
 * TypeScript types for healthcare compliance, data protection, and medical validation
 * within the plugin development SDK.
 */

export interface HealthcareComplianceLevel {
  level: 'standard' | 'enhanced' | 'expert_review' | 'enterprise';
  requirements: ComplianceRequirement[];
  certifications: ComplianceCertification[];
  audit_frequency: 'monthly' | 'quarterly' | 'annually' | 'continuous';
}

export interface ComplianceRequirement {
  framework: ComplianceFramework;
  requirement_id: string;
  description: string;
  mandatory: boolean;
  validation_method: ValidationMethod;
  documentation_required: boolean;
}

export interface ComplianceCertification {
  name: string;
  issuer: string;
  certification_id: string;
  issued_date: Date;
  expiry_date: Date;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  scope: string[];
}

export interface ComplianceFramework {
  name: 'HIPAA' | 'FDA' | 'FHIR' | 'HITRUST' | 'SOC2' | 'ISO27001';
  version: string;
  description: string;
  applicable_regions: string[];
  healthcare_specific: boolean;
}

export interface ValidationMethod {
  type: 'automated' | 'manual' | 'hybrid';
  tools: string[];
  frequency: string;
  documentation: string[];
}

export interface HealthcareDataProtection {
  data_classification: DataClassification;
  encryption_requirements: EncryptionRequirement[];
  access_controls: AccessControl[];
  retention_policies: RetentionPolicy[];
  anonymization_rules: AnonymizationRule[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted' | 'phi';
  description: string;
  handling_requirements: string[];
  access_restrictions: string[];
  retention_period: number;
}

export interface EncryptionRequirement {
  data_at_rest: EncryptionSpec;
  data_in_transit: EncryptionSpec;
  key_management: KeyManagementSpec;
  algorithm_requirements: AlgorithmRequirement[];
}

export interface EncryptionSpec {
  required: boolean;
  algorithm: string;
  key_length: number;
  implementation: string;
  validation_required: boolean;
}

export interface KeyManagementSpec {
  key_rotation_period: number;
  key_storage: 'hardware' | 'software' | 'cloud';
  key_access_controls: string[];
  backup_requirements: string[];
}

export interface AlgorithmRequirement {
  algorithm: string;
  minimum_key_length: number;
  approved_implementations: string[];
  deprecated_versions: string[];
}

export interface AccessControl {
  principle: 'least_privilege' | 'role_based' | 'attribute_based' | 'policy_based';
  implementation: AccessControlImplementation;
  audit_requirements: AuditRequirement[];
  review_frequency: string;
}

export interface AccessControlImplementation {
  authentication: AuthenticationMethod[];
  authorization: AuthorizationMethod[];
  session_management: SessionManagement;
  multi_factor_required: boolean;
}

export interface AuthenticationMethod {
  type: 'password' | 'certificate' | 'biometric' | 'token' | 'sso';
  strength: 'basic' | 'strong' | 'very_strong';
  requirements: string[];
}

export interface AuthorizationMethod {
  type: 'rbac' | 'abac' | 'dac' | 'mac';
  policies: Policy[];
  enforcement: 'strict' | 'permissive';
}

export interface SessionManagement {
  timeout: number;
  renewal_required: boolean;
  concurrent_sessions: number;
  secure_cookies: boolean;
}

export interface Policy {
  name: string;
  description: string;
  rules: PolicyRule[];
  conditions: PolicyCondition[];
  actions: PolicyAction[];
}

export interface PolicyRule {
  subject: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: any;
  context?: string;
}

export interface PolicyAction {
  type: 'grant' | 'deny' | 'log' | 'alert' | 'escalate';
  parameters: Record<string, any>;
}

export interface RetentionPolicy {
  data_type: string;
  retention_period: number;
  disposal_method: DisposalMethod;
  legal_hold_requirements: LegalHoldRequirement[];
  audit_requirements: AuditRequirement[];
}

export interface DisposalMethod {
  method: 'secure_delete' | 'physical_destruction' | 'cryptographic_erasure';
  verification_required: boolean;
  documentation_required: boolean;
  witness_required: boolean;
}

export interface LegalHoldRequirement {
  trigger_condition: string;
  hold_duration: number;
  notification_requirements: string[];
  preservation_method: string;
}

export interface AnonymizationRule {
  data_field: string;
  anonymization_method: AnonymizationMethod;
  re_identification_risk: 'low' | 'medium' | 'high';
  validation_required: boolean;
}

export interface AnonymizationMethod {
  type: 'masking' | 'hashing' | 'encryption' | 'generalization' | 'suppression';
  parameters: Record<string, any>;
  reversibility: boolean;
  key_management: string;
}

export interface MedicalValidation {
  validation_type: MedicalValidationType;
  data_sources: DataSource[];
  validation_rules: ValidationRule[];
  accuracy_requirements: AccuracyRequirement;
  review_process: ReviewProcess;
}

export interface MedicalValidationType {
  category: 'diagnosis' | 'treatment' | 'medication' | 'procedure' | 'lab_result' | 'vital_signs';
  subcategory: string;
  validation_level: 'basic' | 'standard' | 'comprehensive' | 'expert';
}

export interface DataSource {
  name: string;
  type: 'database' | 'api' | 'file' | 'manual';
  reliability_score: number;
  last_updated: Date;
  validation_status: 'validated' | 'pending' | 'failed';
}

export interface ValidationRule {
  rule_id: string;
  name: string;
  description: string;
  condition: string;
  severity: 'error' | 'warning' | 'info';
  automated: boolean;
  manual_review_required: boolean;
}

export interface AccuracyRequirement {
  minimum_accuracy: number;
  confidence_threshold: number;
  validation_frequency: string;
  quality_metrics: QualityMetric[];
}

export interface QualityMetric {
  name: string;
  description: string;
  measurement_method: string;
  target_value: number;
  acceptable_range: [number, number];
}

export interface ReviewProcess {
  reviewer_qualifications: ReviewerQualification[];
  review_criteria: ReviewCriteria[];
  escalation_process: EscalationProcess;
  documentation_requirements: DocumentationRequirement[];
}

export interface ReviewerQualification {
  credential_type: string;
  required_level: string;
  experience_required: number;
  continuing_education: boolean;
}

export interface ReviewCriteria {
  criterion: string;
  weight: number;
  pass_threshold: number;
  measurement_method: string;
}

export interface EscalationProcess {
  trigger_conditions: string[];
  escalation_levels: EscalationLevel[];
  response_times: ResponseTime[];
  notification_requirements: string[];
}

export interface EscalationLevel {
  level: number;
  title: string;
  qualifications: string[];
  authority: string[];
}

export interface ResponseTime {
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_time: number;
  escalation_time: number;
}

export interface DocumentationRequirement {
  document_type: string;
  required_fields: string[];
  retention_period: number;
  access_controls: string[];
}

export interface HealthcareAuditLog {
  id: string;
  timestamp: Date;
  event_type: HealthcareEventType;
  user_id: string;
  plugin_id: string;
  organization_id: string;
  data_classification: DataClassification;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  compliance_framework: ComplianceFramework;
  retention_until: Date;
}

export interface HealthcareEventType {
  category: 'data_access' | 'data_modification' | 'authentication' | 'authorization' | 'compliance' | 'security';
  subcategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  healthcare_specific: boolean;
}

export interface PluginHealthCheck {
  plugin_id: string;
  check_timestamp: Date;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  compliance_status: ComplianceStatus;
  performance_metrics: PerformanceMetrics;
  recommendations: Recommendation[];
}

export interface HealthCheckResult {
  check_name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration_ms: number;
  details: Record<string, any>;
}

export interface ComplianceStatus {
  overall_compliance: boolean;
  framework_compliance: FrameworkCompliance[];
  violations: ComplianceViolation[];
  last_audit: Date;
  next_audit: Date;
}

export interface FrameworkCompliance {
  framework: ComplianceFramework;
  compliance_percentage: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  issues: ComplianceIssue[];
}

export interface ComplianceViolation {
  violation_id: string;
  framework: ComplianceFramework;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  discovered_date: Date;
  resolved_date?: Date;
}

export interface ComplianceIssue {
  issue_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation_steps: string[];
  due_date: Date;
  assigned_to?: string;
}

export interface PerformanceMetrics {
  execution_time_avg: number;
  memory_usage_avg: number;
  error_rate: number;
  availability: number;
  throughput: number;
  latency_p95: number;
  latency_p99: number;
}

export interface Recommendation {
  type: 'performance' | 'security' | 'compliance' | 'reliability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation_effort: 'low' | 'medium' | 'high';
  expected_benefit: string;
  implementation_steps: string[];
}
