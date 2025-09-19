/**
 * Interactive API Documentation Service
 * Healthcare-specific API documentation with code examples
 */

import { createClient } from '@supabase/supabase-js';

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
  healthcareContext: HealthcareContext;
  compliance: ComplianceInfo;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: any;
  healthcareSpecific?: boolean;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: any;
  example: any;
}

export interface APIExample {
  language: string;
  title: string;
  code: string;
  description: string;
  healthcareUseCase?: string;
}

export interface HealthcareContext {
  clinicalAccess: boolean;
  administrativeAccess: boolean;
  billingAccess: boolean;
  reportingAccess: boolean;
  complianceLevel: string;
  dataAccessLevel: string;
  auditRequired: boolean;
}

export interface ComplianceInfo {
  hipaaCompliant: boolean;
  fhirCompliant: boolean;
  auditRequired: boolean;
  dataEncryption: boolean;
  accessLogging: boolean;
}

export class DocumentationService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate OpenAPI specification
   */
  async generateOpenAPISpec(): Promise<any> {
    const endpoints = await this.getAllEndpoints();
    
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'HMHCP Enterprise API',
        description: 'Healthcare-compliant enterprise integration API',
        version: '1.0.0',
        contact: {
          name: 'HMHCP Support',
          email: 'support@hmhcp.com'
        }
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'https://api.hmhcp.com',
          description: 'Production server'
        }
      ],
      security: [
        {
          BearerAuth: []
        },
        {
          OAuth2Enterprise: []
        }
      ],
      paths: this.buildPaths(endpoints),
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          OAuth2Enterprise: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: '/api/enterprise/sso/auth',
                tokenUrl: '/api/enterprise/sso/token',
                scopes: {
                  'openid': 'OpenID Connect',
                  'profile': 'User profile',
                  'email': 'User email',
                  'healthcare:read': 'Read healthcare data',
                  'healthcare:write': 'Write healthcare data'
                }
              }
            }
          }
        },
        schemas: this.buildSchemas()
      }
    };

    return spec;
  }

  /**
   * Get endpoint documentation
   */
  async getEndpointDocumentation(path: string, method: string): Promise<APIEndpoint | null> {
    try {
      const { data, error } = await this.supabase
        .from('api_endpoints')
        .select('*')
        .eq('path', path)
        .eq('method', method.toUpperCase())
        .single();

      if (error || !data) return null;

      return this.formatEndpoint(data);
    } catch (error) {
      console.error('Failed to get endpoint documentation:', error);
      return null;
    }
  }

  /**
   * Generate code examples for endpoint
   */
  async generateCodeExamples(
    path: string, 
    method: string, 
    language: string
  ): Promise<APIExample[]> {
    const endpoint = await this.getEndpointDocumentation(path, method);
    if (!endpoint) return [];

    const examples: APIExample[] = [];

    switch (language) {
      case 'javascript':
        examples.push(this.generateJavaScriptExample(endpoint));
        break;
      case 'python':
        examples.push(this.generatePythonExample(endpoint));
        break;
      case 'curl':
        examples.push(this.generateCurlExample(endpoint));
        break;
      case 'all':
        examples.push(
          this.generateJavaScriptExample(endpoint),
          this.generatePythonExample(endpoint),
          this.generateCurlExample(endpoint)
        );
        break;
    }

    return examples;
  }

  /**
   * Test API endpoint
   */
  async testEndpoint(
    path: string,
    method: string,
    parameters: any,
    headers: any,
    body?: any
  ): Promise<any> {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}${path}`;
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseData = await response.json();

      return {
        success: response.ok,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime: Date.now() // This would be calculated properly
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 0
      };
    }
  }

  // Private helper methods

  private async getAllEndpoints(): Promise<APIEndpoint[]> {
    // This would fetch from database
    return [
      {
        path: '/api/enterprise/graph/users',
        method: 'GET',
        description: 'Get Microsoft Graph users with healthcare context',
        parameters: [
          {
            name: 'organizationId',
            type: 'string',
            required: true,
            description: 'Organization identifier',
            example: 'org-123',
            healthcareSpecific: true
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Success',
            schema: { type: 'object' },
            example: { users: [] }
          }
        ],
        examples: [],
        healthcareContext: {
          clinicalAccess: true,
          administrativeAccess: true,
          billingAccess: false,
          reportingAccess: true,
          complianceLevel: 'hipaa',
          dataAccessLevel: 'read',
          auditRequired: true
        },
        compliance: {
          hipaaCompliant: true,
          fhirCompliant: false,
          auditRequired: true,
          dataEncryption: true,
          accessLogging: true
        }
      }
    ];
  }

  private buildPaths(endpoints: APIEndpoint[]): any {
    const paths: any = {};

    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        description: endpoint.description,
        parameters: endpoint.parameters.map(param => ({
          name: param.name,
          in: 'query',
          required: param.required,
          schema: { type: param.type },
          description: param.description,
          example: param.example
        })),
        responses: endpoint.responses.reduce((acc, response) => {
          acc[response.statusCode] = {
            description: response.description,
            content: {
              'application/json': {
                schema: response.schema,
                example: response.example
              }
            }
          };
          return acc;
        }, {} as any),
        security: [
          { BearerAuth: [] },
          { OAuth2Enterprise: ['healthcare:read'] }
        ]
      };
    });

    return paths;
  }

  private buildSchemas(): any {
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          roles: { type: 'array', items: { type: 'string' } },
          organizationId: { type: 'string' }
        }
      },
      HealthcareContext: {
        type: 'object',
        properties: {
          clinicalAccess: { type: 'boolean' },
          administrativeAccess: { type: 'boolean' },
          billingAccess: { type: 'boolean' },
          reportingAccess: { type: 'boolean' },
          complianceLevel: { type: 'string' },
          dataAccessLevel: { type: 'string' },
          auditRequired: { type: 'boolean' }
        }
      }
    };
  }

  private formatEndpoint(data: any): APIEndpoint {
    return {
      path: data.path,
      method: data.method,
      description: data.description,
      parameters: data.parameters || [],
      responses: data.responses || [],
      examples: data.examples || [],
      healthcareContext: data.healthcare_context || {},
      compliance: data.compliance || {}
    };
  }

  private generateJavaScriptExample(endpoint: APIEndpoint): APIExample {
    const code = `// ${endpoint.description}
const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`;

    return {
      language: 'javascript',
      title: 'JavaScript Example',
      code,
      description: 'Example using fetch API',
      healthcareUseCase: 'Integrating with healthcare systems'
    };
  }

  private generatePythonExample(endpoint: APIEndpoint): APIExample {
    const code = `# ${endpoint.description}
import requests

url = '${process.env.NEXT_PUBLIC_API_URL}${endpoint.path}'
headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)
data = response.json()
print(data)`;

    return {
      language: 'python',
      title: 'Python Example',
      code,
      description: 'Example using requests library',
      healthcareUseCase: 'Healthcare data processing'
    };
  }

  private generateCurlExample(endpoint: APIEndpoint): APIExample {
    const code = `# ${endpoint.description}
curl -X ${endpoint.method} \\
  '${process.env.NEXT_PUBLIC_API_URL}${endpoint.path}' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json'`;

    return {
      language: 'curl',
      title: 'cURL Example',
      code,
      description: 'Command line example',
      healthcareUseCase: 'Testing and debugging'
    };
  }
}

export default DocumentationService;