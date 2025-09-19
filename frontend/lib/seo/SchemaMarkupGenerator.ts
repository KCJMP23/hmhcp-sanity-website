// Schema Markup Generator
// Created: 2025-01-27
// Purpose: Healthcare schema markup generation for SEO

import { 
  SchemaMarkupRequest, 
  SchemaMarkupResponse, 
  SchemaMarkupData,
  SchemaComplianceData,
  ContentType 
} from '@/types/seo';

export class SchemaMarkupGenerator {
  private schemaTemplates: Map<string, any>;
  private healthcareSpecializations: Map<string, string[]>;

  constructor() {
    this.initializeSchemaTemplates();
    this.initializeHealthcareSpecializations();
  }

  /**
   * Generate schema markup for healthcare content
   */
  async generateSchemaMarkup(request: SchemaMarkupRequest): Promise<SchemaMarkupResponse> {
    try {
      // Validate input
      this.validateRequest(request);

      // Get appropriate schema template
      const template = this.getSchemaTemplate(request.content_type, request.healthcare_specialization);
      
      // Generate schema markup
      const schemaMarkup = this.buildSchemaMarkup(template, request.content_data);
      
      // Validate generated markup
      const validationErrors = this.validateSchemaMarkup(schemaMarkup);
      
      // Check healthcare compliance
      const complianceData = this.checkHealthcareCompliance(schemaMarkup, request.content_type);
      
      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(schemaMarkup, request.content_type);

      return {
        schema_markup: JSON.stringify(schemaMarkup, null, 2),
        validation_errors: validationErrors,
        healthcare_compliance: complianceData,
        optimization_suggestions: optimizationSuggestions
      };

    } catch (error) {
      throw new Error(`Schema markup generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate MedicalWebPage schema
   */
  generateMedicalWebPageSchema(contentData: Record<string, any>): any {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      "name": contentData.title || "Medical Information Page",
      "description": contentData.description || "Healthcare information and resources",
      "url": contentData.url || "",
      "datePublished": contentData.datePublished || new Date().toISOString(),
      "dateModified": contentData.dateModified || new Date().toISOString(),
      "author": {
        "@type": "Person",
        "name": contentData.author || "Healthcare Professional"
      },
      "publisher": {
        "@type": "Organization",
        "name": contentData.publisher || "Healthcare Organization",
        "url": contentData.publisherUrl || ""
      },
      "mainEntity": {
        "@type": "MedicalCondition",
        "name": contentData.condition || "Medical Condition",
        "description": contentData.conditionDescription || "Description of medical condition"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": this.generateBreadcrumbList(contentData.breadcrumbs || [])
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": contentData.speakableSelector || ".main-content"
      }
    };
  }

  /**
   * Generate MedicalOrganization schema
   */
  generateMedicalOrganizationSchema(contentData: Record<string, any>): any {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalOrganization",
      "name": contentData.organizationName || "Healthcare Organization",
      "description": contentData.description || "Healthcare services and medical care",
      "url": contentData.url || "",
      "logo": contentData.logo || "",
      "image": contentData.image || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": contentData.streetAddress || "",
        "addressLocality": contentData.city || "",
        "addressRegion": contentData.state || "",
        "postalCode": contentData.postalCode || "",
        "addressCountry": contentData.country || "US"
      },
      "telephone": contentData.telephone || "",
      "email": contentData.email || "",
      "foundingDate": contentData.foundingDate || "",
      "medicalSpecialty": contentData.medicalSpecialty || [],
      "hasCredential": contentData.credentials || [],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Medical Services",
        "itemListElement": this.generateServiceOffers(contentData.services || [])
      },
      "sameAs": contentData.socialMediaUrls || []
    };
  }

  /**
   * Generate MedicalProcedure schema
   */
  generateMedicalProcedureSchema(contentData: Record<string, any>): any {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      "name": contentData.procedureName || "Medical Procedure",
      "description": contentData.description || "Description of medical procedure",
      "url": contentData.url || "",
      "procedureType": contentData.procedureType || "Therapeutic",
      "bodyLocation": contentData.bodyLocation || "",
      "preparation": contentData.preparation || "",
      "followup": contentData.followup || "",
      "procedure": contentData.procedure || "",
      "status": contentData.status || "Active",
      "code": {
        "@type": "MedicalCode",
        "code": contentData.procedureCode || "",
        "codingSystem": contentData.codingSystem || "CPT"
      },
      "relevantSpecialty": contentData.specialty || [],
      "bodyPart": contentData.bodyPart || ""
    };
  }

  /**
   * Generate Person (Medical Professional) schema
   */
  generateMedicalProfessionalSchema(contentData: Record<string, any>): any {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": contentData.name || "Medical Professional",
      "description": contentData.description || "Healthcare professional",
      "url": contentData.url || "",
      "image": contentData.image || "",
      "jobTitle": contentData.jobTitle || "Medical Professional",
      "worksFor": {
        "@type": "MedicalOrganization",
        "name": contentData.organization || "Healthcare Organization"
      },
      "hasCredential": this.generateCredentials(contentData.credentials || []),
      "medicalSpecialty": contentData.specialty || [],
      "alumniOf": contentData.education || [],
      "knowsAbout": contentData.expertise || [],
      "award": contentData.awards || [],
      "sameAs": contentData.socialMediaUrls || []
    };
  }

  /**
   * Validate schema markup request
   */
  private validateRequest(request: SchemaMarkupRequest): void {
    if (!request.content_type) {
      throw new Error('Content type is required');
    }

    if (!request.content_data) {
      throw new Error('Content data is required');
    }

    const validContentTypes: ContentType[] = ['page', 'blog', 'service', 'practitioner'];
    if (!validContentTypes.includes(request.content_type)) {
      throw new Error(`Invalid content type: ${request.content_type}`);
    }
  }

  /**
   * Get appropriate schema template
   */
  private getSchemaTemplate(contentType: ContentType, specialty?: string): any {
    const templateKey = specialty ? `${contentType}_${specialty}` : contentType;
    return this.schemaTemplates.get(templateKey) || this.schemaTemplates.get(contentType);
  }

  /**
   * Build schema markup from template and data
   */
  private buildSchemaMarkup(template: any, contentData: Record<string, any>): any {
    // Deep clone the template
    const schema = JSON.parse(JSON.stringify(template));
    
    // Replace placeholders with actual data
    this.replacePlaceholders(schema, contentData);
    
    return schema;
  }

  /**
   * Replace placeholders in schema template
   */
  private replacePlaceholders(schema: any, data: Record<string, any>): void {
    const processValue = (value: any): any => {
      if (typeof value === 'string') {
        // Replace placeholders like {{title}} with actual data
        return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return data[key] || match;
        });
      } else if (Array.isArray(value)) {
        return value.map(processValue);
      } else if (typeof value === 'object' && value !== null) {
        const processed: any = {};
        for (const [k, v] of Object.entries(value)) {
          processed[k] = processValue(v);
        }
        return processed;
      }
      return value;
    };

    // Process the entire schema
    Object.assign(schema, processValue(schema));
  }

  /**
   * Validate generated schema markup
   */
  private validateSchemaMarkup(schema: any): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!schema['@context']) {
      errors.push('Missing @context field');
    }

    if (!schema['@type']) {
      errors.push('Missing @type field');
    }

    // Check for empty required fields
    const requiredFields = this.getRequiredFields(schema['@type']);
    requiredFields.forEach(field => {
      if (!schema[field] || schema[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check for valid URLs
    const urlFields = ['url', 'logo', 'image'];
    urlFields.forEach(field => {
      if (schema[field] && !this.isValidUrl(schema[field])) {
        errors.push(`Invalid URL in field: ${field}`);
      }
    });

    return errors;
  }

  /**
   * Check healthcare compliance
   */
  private checkHealthcareCompliance(schema: any, contentType: ContentType): SchemaComplianceData {
    const compliance: SchemaComplianceData = {
      medical_accuracy_verified: false,
      fda_guidelines_compliant: false,
      advertising_standards_met: false,
      required_disclaimers: []
    };

    // Check medical accuracy
    compliance.medical_accuracy_verified = this.checkMedicalAccuracy(schema);

    // Check FDA guidelines compliance
    compliance.fda_guidelines_compliant = this.checkFDAGuidelines(schema, contentType);

    // Check advertising standards
    compliance.advertising_standards_met = this.checkAdvertisingStandards(schema, contentType);

    // Identify required disclaimers
    compliance.required_disclaimers = this.identifyRequiredDisclaimers(schema, contentType);

    return compliance;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(schema: any, contentType: ContentType): string[] {
    const suggestions: string[] = [];

    // Check for missing optional but beneficial fields
    if (!schema.description && contentType !== 'practitioner') {
      suggestions.push('Add a description field for better search engine understanding');
    }

    if (!schema.image && (contentType === 'page' || contentType === 'blog')) {
      suggestions.push('Add an image field to improve search result appearance');
    }

    if (!schema.datePublished && contentType === 'blog') {
      suggestions.push('Add datePublished field for blog content freshness');
    }

    // Check for healthcare-specific optimizations
    if (contentType === 'service' && !schema.hasOfferCatalog) {
      suggestions.push('Add hasOfferCatalog to list available medical services');
    }

    if (contentType === 'practitioner' && !schema.hasCredential) {
      suggestions.push('Add hasCredential field to showcase medical qualifications');
    }

    return suggestions;
  }

  /**
   * Generate breadcrumb list
   */
  private generateBreadcrumbList(breadcrumbs: string[]): any[] {
    return breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb,
      "item": `#breadcrumb-${index + 1}`
    }));
  }

  /**
   * Generate service offers
   */
  private generateServiceOffers(services: any[]): any[] {
    return services.map((service, index) => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "MedicalProcedure",
        "name": service.name || `Service ${index + 1}`,
        "description": service.description || ""
      }
    }));
  }

  /**
   * Generate credentials
   */
  private generateCredentials(credentials: any[]): any[] {
    return credentials.map(cred => ({
      "@type": "EducationalOccupationalCredential",
      "name": cred.name || "Medical Credential",
      "credentialCategory": cred.category || "Medical License",
      "recognizedBy": {
        "@type": "Organization",
        "name": cred.issuer || "Medical Board"
      }
    }));
  }

  /**
   * Get required fields for schema type
   */
  private getRequiredFields(schemaType: string): string[] {
    const requiredFieldsMap: Record<string, string[]> = {
      'MedicalWebPage': ['name', 'url'],
      'MedicalOrganization': ['name', 'url', 'address'],
      'MedicalProcedure': ['name', 'description'],
      'Person': ['name']
    };

    return requiredFieldsMap[schemaType] || [];
  }

  /**
   * Check if string is valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check medical accuracy
   */
  private checkMedicalAccuracy(schema: any): boolean {
    // Check for medical terminology and accuracy indicators
    const medicalAccuracyIndicators = [
      'medicalSpecialty',
      'hasCredential',
      'procedureType',
      'bodyLocation'
    ];

    return medicalAccuracyIndicators.some(indicator => schema[indicator]);
  }

  /**
   * Check FDA guidelines compliance
   */
  private checkFDAGuidelines(schema: any, contentType: ContentType): boolean {
    // Check for FDA compliance indicators
    const fdaIndicators = [
      'fdaApproved',
      'fdaCleared',
      'offLabelUse'
    ];

    return fdaIndicators.some(indicator => schema[indicator]);
  }

  /**
   * Check advertising standards
   */
  private checkAdvertisingStandards(schema: any, contentType: ContentType): boolean {
    // Check for advertising compliance indicators
    const advertisingIndicators = [
      'disclaimer',
      'notGuaranteed',
      'resultsMayVary'
    ];

    return advertisingIndicators.some(indicator => schema[indicator]);
  }

  /**
   * Identify required disclaimers
   */
  private identifyRequiredDisclaimers(schema: any, contentType: ContentType): string[] {
    const disclaimers: string[] = [];

    if (contentType === 'service' && !schema.disclaimer) {
      disclaimers.push('Add disclaimer about service limitations');
    }

    if (contentType === 'practitioner' && !schema.notMedicalAdvice) {
      disclaimers.push('Add disclaimer that content is not medical advice');
    }

    return disclaimers;
  }

  /**
   * Initialize schema templates
   */
  private initializeSchemaTemplates(): void {
    this.schemaTemplates = new Map([
      ['page', {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        "name": "{{title}}",
        "description": "{{description}}",
        "url": "{{url}}"
      }],
      ['blog', {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        "name": "{{title}}",
        "description": "{{description}}",
        "url": "{{url}}",
        "datePublished": "{{datePublished}}",
        "author": {
          "@type": "Person",
          "name": "{{author}}"
        }
      }],
      ['service', {
        "@context": "https://schema.org",
        "@type": "MedicalOrganization",
        "name": "{{organizationName}}",
        "description": "{{description}}",
        "url": "{{url}}",
        "medicalSpecialty": "{{specialty}}"
      }],
      ['practitioner', {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "{{name}}",
        "description": "{{description}}",
        "jobTitle": "{{jobTitle}}",
        "medicalSpecialty": "{{specialty}}"
      }]
    ]);
  }

  /**
   * Initialize healthcare specializations
   */
  private initializeHealthcareSpecializations(): void {
    this.healthcareSpecializations = new Map([
      ['cardiology', ['heart', 'cardiac', 'cardiovascular']],
      ['oncology', ['cancer', 'tumor', 'oncology']],
      ['neurology', ['brain', 'neurological', 'nervous system']],
      ['orthopedics', ['bone', 'joint', 'musculoskeletal']],
      ['dermatology', ['skin', 'dermatological', 'cutaneous']]
    ]);
  }
}
