/**
 * FHIR R4 Compliant Healthcare Data Exchange Client
 * Healthcare-compliant data exchange for enterprise integration
 */

import {
  FHIRResource,
  FHIRPatient,
  FHIRPractitioner,
  FHIROrganization,
  FHIRObservation,
  FHIRBundle,
  FHIRSearchParameters,
  FHIRClientConfig,
  FHIRResponse,
  FHIRSearchResult,
  FHIRValidationResult,
  FHIRCapabilityStatement,
  FHIROperationOutcome,
  HealthcareContext,
  ComplianceStatus
} from '@/types/enterprise/fhir';

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';

export class FHIRClient {
  private httpClient: AxiosInstance;
  private config: FHIRClientConfig;
  private baseUrl: string;
  private version: string;

  constructor(config: FHIRClientConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.version = config.version;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        'User-Agent': 'HMHCP-FHIR-Client/1.0',
        ...config.headers
      }
    });

    this.setupAuthentication();
    this.setupInterceptors();
  }

  /**
   * Get FHIR capability statement
   */
  async getCapabilityStatement(): Promise<FHIRResponse<FHIRCapabilityStatement>> {
    try {
      const response = await this.httpClient.get('/metadata');
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Search for resources
   */
  async search<T extends FHIRResource>(
    resourceType: string,
    parameters: FHIRSearchParameters = {}
  ): Promise<FHIRResponse<FHIRSearchResult<T>>> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add search parameters
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      const url = `/${resourceType}?${searchParams.toString()}`;
      const response = await this.httpClient.get(url);
      
      const bundle = response.data as FHIRBundle;
      const resources = bundle.entry?.map(entry => entry.resource as T) || [];
      
      return {
        success: true,
        data: {
          resources,
          total: bundle.total || resources.length,
          link: bundle.link || [],
          searchParameters: parameters,
          healthcareContext: await this.getHealthcareContext(),
          complianceStatus: await this.getComplianceStatus()
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a specific resource by ID
   */
  async get<T extends FHIRResource>(
    resourceType: string,
    id: string,
    version?: string
  ): Promise<FHIRResponse<T>> {
    try {
      const url = version ? `/${resourceType}/${id}/_history/${version}` : `/${resourceType}/${id}`;
      const response = await this.httpClient.get(url);
      
      return {
        success: true,
        data: response.data as T,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create a new resource
   */
  async create<T extends FHIRResource>(
    resource: T,
    validate: boolean = true
  ): Promise<FHIRResponse<T>> {
    try {
      // Validate resource if required
      if (validate) {
        const validation = await this.validateResource(resource);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Resource validation failed',
              details: validation.errors.map(e => e.message).join(', '),
              retryable: false,
              complianceFlags: ['HIPAA_AUDIT_REQUIRED']
            }
          };
        }
      }

      const response = await this.httpClient.post(`/${resource.resourceType}`, resource);
      
      return {
        success: true,
        data: response.data as T,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an existing resource
   */
  async update<T extends FHIRResource>(
    resource: T,
    validate: boolean = true
  ): Promise<FHIRResponse<T>> {
    try {
      if (!resource.id) {
        return {
          success: false,
          error: {
            code: 'MISSING_ID',
            message: 'Resource ID is required for update',
            retryable: false,
            complianceFlags: []
          }
        };
      }

      // Validate resource if required
      if (validate) {
        const validation = await this.validateResource(resource);
        if (!validation.valid) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Resource validation failed',
              details: validation.errors.map(e => e.message).join(', '),
              retryable: false,
              complianceFlags: ['HIPAA_AUDIT_REQUIRED']
            }
          };
        }
      }

      const response = await this.httpClient.put(`/${resource.resourceType}/${resource.id}`, resource);
      
      return {
        success: true,
        data: response.data as T,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a resource
   */
  async delete(resourceType: string, id: string): Promise<FHIRResponse<null>> {
    try {
      await this.httpClient.delete(`/${resourceType}/${id}`);
      
      return {
        success: true,
        data: null,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Execute a FHIR operation
   */
  async operation<T = any>(
    resourceType: string,
    operation: string,
    parameters: any = {},
    id?: string
  ): Promise<FHIRResponse<T>> {
    try {
      const url = id ? `/${resourceType}/${id}/$${operation}` : `/${resourceType}/$${operation}`;
      const response = await this.httpClient.post(url, parameters);
      
      return {
        success: true,
        data: response.data as T,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate a FHIR resource
   */
  async validateResource(resource: FHIRResource): Promise<FHIRValidationResult> {
    try {
      const response = await this.httpClient.post(`/${resource.resourceType}/$validate`, resource);
      
      // Parse validation response
      const operationOutcome = response.data as FHIROperationOutcome;
      const errors = operationOutcome.issue
        .filter(issue => issue.severity === 'error' || issue.severity === 'fatal')
        .map(issue => ({
          path: issue.location?.[0] || '',
          message: issue.diagnostics || issue.details?.text || 'Validation error',
          severity: issue.severity as 'error' | 'fatal',
          code: issue.code
        }));

      const warnings = operationOutcome.issue
        .filter(issue => issue.severity === 'warning')
        .map(issue => ({
          path: issue.location?.[0] || '',
          message: issue.diagnostics || issue.details?.text || 'Validation warning',
          code: issue.code
        }));

      // Perform healthcare compliance checks
      const complianceChecks = await this.performComplianceChecks(resource);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        complianceChecks
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: '',
          message: 'Validation request failed',
          severity: 'fatal',
          code: 'validation-error'
        }],
        warnings: [],
        complianceChecks: []
      };
    }
  }

  /**
   * Get resource history
   */
  async getHistory<T extends FHIRResource>(
    resourceType: string,
    id?: string
  ): Promise<FHIRResponse<FHIRBundle>> {
    try {
      const url = id ? `/${resourceType}/${id}/_history` : `/${resourceType}/_history`;
      const response = await this.httpClient.get(url);
      
      return {
        success: true,
        data: response.data as FHIRBundle,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Perform batch operations
   */
  async batch(bundle: FHIRBundle): Promise<FHIRResponse<FHIRBundle>> {
    try {
      const response = await this.httpClient.post('/', bundle);
      
      return {
        success: true,
        data: response.data as FHIRBundle,
        healthcareContext: await this.getHealthcareContext(),
        complianceStatus: await this.getComplianceStatus()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Private helper methods

  private setupAuthentication(): void {
    const auth = this.config.authentication;
    
    switch (auth.type) {
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          this.httpClient.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        if (auth.token) {
          this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
      case 'oauth2':
        // OAuth2 implementation would go here
        if (auth.token) {
          this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        // Add healthcare compliance headers
        config.headers['X-Healthcare-Compliance'] = 'HIPAA';
        config.headers['X-Data-Classification'] = 'PHI';
        config.headers['X-Audit-Required'] = 'true';
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = crypto.randomUUID();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        // Log successful requests for audit
        this.logAuditEvent('fhir_request_success', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          requestId: response.config.headers['X-Request-ID']
        });
        
        return response;
      },
      (error) => {
        // Log failed requests for audit
        this.logAuditEvent('fhir_request_error', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
          requestId: error.config?.headers?.['X-Request-ID']
        });
        
        return Promise.reject(error);
      }
    );
  }

  private handleResponse<T>(response: AxiosResponse): FHIRResponse<T> {
    return {
      success: true,
      data: response.data as T,
      healthcareContext: this.getHealthcareContext(),
      complianceStatus: this.getComplianceStatus()
    };
  }

  private handleError(error: any): FHIRResponse<null> {
    const status = error.response?.status || 500;
    const message = error.response?.data?.issue?.[0]?.diagnostics || error.message || 'Unknown error';
    
    return {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message,
        details: error.response?.data?.issue?.[0]?.details?.text,
        operationOutcome: error.response?.data,
        retryable: this.isRetryableError(status),
        complianceFlags: ['HIPAA_AUDIT_REQUIRED']
      }
    };
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'UNKNOWN_ERROR';
    }
  }

  private isRetryableError(status: number): boolean {
    return [429, 500, 502, 503].includes(status);
  }

  private async performComplianceChecks(resource: FHIRResource): Promise<any[]> {
    const checks = [];
    
    // HIPAA compliance checks
    if (this.config.healthcareCompliance.hipaaCompliant) {
      checks.push({
        framework: 'HIPAA',
        rule: 'data_encryption',
        passed: this.config.healthcareCompliance.dataEncryption.inTransit,
        message: 'Data encryption in transit required for HIPAA compliance',
        severity: 'high'
      });
      
      checks.push({
        framework: 'HIPAA',
        rule: 'audit_logging',
        passed: this.config.healthcareCompliance.auditLogging.enabled,
        message: 'Audit logging required for HIPAA compliance',
        severity: 'high'
      });
    }
    
    return checks;
  }

  private async getHealthcareContext(): Promise<HealthcareContext> {
    return {
      facilityType: 'hospital',
      department: 'healthcare_it',
      specialty: 'enterprise_integration',
      complianceLevel: 'advanced',
      dataClassification: 'PHI',
      auditRequired: true
    };
  }

  private async getComplianceStatus(): Promise<ComplianceStatus> {
    return {
      hipaaCompliant: this.config.healthcareCompliance.hipaaCompliant,
      auditRequired: this.config.healthcareCompliance.auditLogging.enabled,
      dataAccessLevel: 'read_write',
      retentionPolicy: '7_years',
      lastComplianceCheck: new Date().toISOString()
    };
  }

  private logAuditEvent(eventType: string, details: any): void {
    // This would typically log to an audit system
    console.log(`FHIR Audit Event: ${eventType}`, details);
  }
}

export default FHIRClient;