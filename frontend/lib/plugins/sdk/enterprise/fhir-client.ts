/**
 * FHIR Client for Plugin Development
 * 
 * Provides FHIR-compliant healthcare data exchange capabilities for plugins
 * with healthcare system interoperability and compliance validation.
 */

import { HealthcareComplianceLevel } from '../types/healthcare-types';

export interface FhirClientConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  complianceLevel: HealthcareComplianceLevel;
  auditLogging: boolean;
  dataValidation: boolean;
}

export interface FhirResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
    security?: Coding[];
    tag?: Coding[];
  };
  [key: string]: any;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Bundle {
  resourceType: 'Bundle';
  id?: string;
  type: 'searchset' | 'collection' | 'history' | 'batch' | 'transaction';
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: FhirResource;
  };
}

export interface Patient extends FhirResource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: Attachment[];
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: PatientLink[];
}

export interface Practitioner extends FhirResource {
  resourceType: 'Practitioner';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: Address[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  photo?: Attachment[];
  qualification?: PractitionerQualification[];
  communication?: CodeableConcept[];
}

export interface Organization extends FhirResource {
  resourceType: 'Organization';
  identifier?: Identifier[];
  active?: boolean;
  type?: CodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: ContactPoint[];
  address?: Address[];
  partOf?: Reference;
  contact?: OrganizationContact[];
  endpoint?: Reference[];
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: Reference;
  period?: Period;
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

export interface PatientLink {
  other: Reference;
  type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
}

export interface PractitionerQualification {
  identifier?: Identifier[];
  code: CodeableConcept;
  period?: Period;
  issuer?: Reference;
}

export interface OrganizationContact {
  purpose?: CodeableConcept;
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
}

export interface FhirSearchParams {
  _count?: number;
  _offset?: number;
  _sort?: string;
  _include?: string;
  _revinclude?: string;
  _summary?: 'true' | 'false' | 'text' | 'data';
  _elements?: string;
  _contained?: 'true' | 'false' | 'both';
  [key: string]: any;
}

export interface FhirValidationResult {
  valid: boolean;
  errors: FhirValidationError[];
  warnings: FhirValidationWarning[];
  complianceLevel: HealthcareComplianceLevel;
}

export interface FhirValidationError {
  severity: 'error' | 'fatal';
  location: string;
  description: string;
  expression?: string;
}

export interface FhirValidationWarning {
  severity: 'warning' | 'information';
  location: string;
  description: string;
  expression?: string;
}

export class FhirClient {
  private config: FhirClientConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: FhirClientConfig) {
    this.config = config;
  }

  /**
   * Initialize authentication with FHIR server
   */
  async authenticate(): Promise<boolean> {
    try {
      const tokenResponse = await this.getAccessToken();
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      return true;
    } catch (error) {
      console.error('FHIR authentication failed:', error);
      return false;
    }
  }

  /**
   * Search for FHIR resources
   */
  async search<T extends FhirResource>(
    resourceType: string,
    params: FhirSearchParams = {}
  ): Promise<Bundle> {
    await this.ensureAuthenticated();

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `${this.config.baseUrl}/${resourceType}?${searchParams.toString()}`;
    const response = await this.makeRequest<Bundle>(url);

    // Validate response if data validation is enabled
    if (this.config.dataValidation) {
      await this.validateBundle(response);
    }

    return response;
  }

  /**
   * Get a specific FHIR resource by ID
   */
  async getResource<T extends FhirResource>(
    resourceType: string,
    id: string
  ): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    const response = await this.makeRequest<T>(url);

    // Validate resource if data validation is enabled
    if (this.config.dataValidation) {
      await this.validateResource(response);
    }

    return response;
  }

  /**
   * Create a new FHIR resource
   */
  async createResource<T extends FhirResource>(
    resource: T
  ): Promise<T> {
    await this.ensureAuthenticated();

    // Validate resource before creation
    if (this.config.dataValidation) {
      const validation = await this.validateResource(resource);
      if (!validation.valid) {
        throw new Error(`Resource validation failed: ${validation.errors.map(e => e.description).join(', ')}`);
      }
    }

    const url = `${this.config.baseUrl}/${resource.resourceType}`;
    const response = await this.makeRequest<T>(url, 'POST', resource);

    // Audit log
    if (this.config.auditLogging) {
      await this.logFhirOperation('create', resource.resourceType, resource.id);
    }

    return response;
  }

  /**
   * Update an existing FHIR resource
   */
  async updateResource<T extends FhirResource>(
    resource: T
  ): Promise<T> {
    await this.ensureAuthenticated();

    // Validate resource before update
    if (this.config.dataValidation) {
      const validation = await this.validateResource(resource);
      if (!validation.valid) {
        throw new Error(`Resource validation failed: ${validation.errors.map(e => e.description).join(', ')}`);
      }
    }

    const url = `${this.config.baseUrl}/${resource.resourceType}/${resource.id}`;
    const response = await this.makeRequest<T>(url, 'PUT', resource);

    // Audit log
    if (this.config.auditLogging) {
      await this.logFhirOperation('update', resource.resourceType, resource.id);
    }

    return response;
  }

  /**
   * Delete a FHIR resource
   */
  async deleteResource(
    resourceType: string,
    id: string
  ): Promise<void> {
    await this.ensureAuthenticated();

    const url = `${this.config.baseUrl}/${resourceType}/${id}`;
    await this.makeRequest(url, 'DELETE');

    // Audit log
    if (this.config.auditLogging) {
      await this.logFhirOperation('delete', resourceType, id);
    }
  }

  /**
   * Get patients with healthcare compliance filtering
   */
  async getPatients(params: FhirSearchParams = {}): Promise<Patient[]> {
    const bundle = await this.search<Patient>('Patient', params);
    return bundle.entry?.map(entry => entry.resource as Patient) || [];
  }

  /**
   * Get practitioners with healthcare compliance filtering
   */
  async getPractitioners(params: FhirSearchParams = {}): Promise<Practitioner[]> {
    const bundle = await this.search<Practitioner>('Practitioner', params);
    return bundle.entry?.map(entry => entry.resource as Practitioner) || [];
  }

  /**
   * Get organizations with healthcare compliance filtering
   */
  async getOrganizations(params: FhirSearchParams = {}): Promise<Organization[]> {
    const bundle = await this.search<Organization>('Organization', params);
    return bundle.entry?.map(entry => entry.resource as Organization) || [];
  }

  /**
   * Validate FHIR resource against compliance requirements
   */
  async validateResource(resource: FhirResource): Promise<FhirValidationResult> {
    const errors: FhirValidationError[] = [];
    const warnings: FhirValidationWarning[] = [];

    // Basic FHIR structure validation
    if (!resource.resourceType) {
      errors.push({
        severity: 'error',
        location: 'resourceType',
        description: 'Resource type is required'
      });
    }

    if (!resource.id) {
      errors.push({
        severity: 'error',
        location: 'id',
        description: 'Resource ID is required'
      });
    }

    // Healthcare compliance validation
    if (this.config.complianceLevel !== 'standard') {
      const complianceValidation = await this.validateHealthcareCompliance(resource);
      errors.push(...complianceValidation.errors);
      warnings.push(...complianceValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      complianceLevel: this.config.complianceLevel
    };
  }

  /**
   * Validate FHIR bundle
   */
  async validateBundle(bundle: Bundle): Promise<FhirValidationResult> {
    const errors: FhirValidationError[] = [];
    const warnings: FhirValidationWarning[] = [];

    if (bundle.resourceType !== 'Bundle') {
      errors.push({
        severity: 'error',
        location: 'resourceType',
        description: 'Bundle resource type must be "Bundle"'
      });
    }

    if (!bundle.type) {
      errors.push({
        severity: 'error',
        location: 'type',
        description: 'Bundle type is required'
      });
    }

    // Validate each entry in the bundle
    if (bundle.entry) {
      for (const entry of bundle.entry) {
        if (entry.resource) {
          const resourceValidation = await this.validateResource(entry.resource);
          errors.push(...resourceValidation.errors);
          warnings.push(...resourceValidation.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      complianceLevel: this.config.complianceLevel
    };
  }

  /**
   * Ensure client is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated request to FHIR server
   */
  private async makeRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    await this.ensureAuthenticated();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json'
    };

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`FHIR request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<{ access_token: string; expires_in: number }> {
    const tokenUrl = `${this.config.baseUrl}/auth/token`;
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate healthcare compliance requirements
   */
  private async validateHealthcareCompliance(resource: FhirResource): Promise<{
    errors: FhirValidationError[];
    warnings: FhirValidationWarning[];
  }> {
    const errors: FhirValidationError[] = [];
    const warnings: FhirValidationWarning[] = [];

    // Check for required security tags
    if (this.config.complianceLevel === 'enhanced' || this.config.complianceLevel === 'enterprise') {
      if (!resource.meta?.security) {
        errors.push({
          severity: 'error',
          location: 'meta.security',
          description: 'Security tags are required for enhanced compliance'
        });
      }
    }

    // Check for audit trail
    if (this.config.complianceLevel === 'enterprise') {
      if (!resource.meta?.lastUpdated) {
        warnings.push({
          severity: 'warning',
          location: 'meta.lastUpdated',
          description: 'Last updated timestamp recommended for audit trail'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Log FHIR operation for audit trail
   */
  private async logFhirOperation(
    operation: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    // In a real implementation, this would log to an audit system
    console.log(`FHIR ${operation}: ${resourceType}/${resourceId} at ${new Date().toISOString()}`);
  }
}
