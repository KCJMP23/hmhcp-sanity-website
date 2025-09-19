// Healthcare Schema Markup Generator
// Created: 2025-01-27
// Purpose: Generate comprehensive schema markup for healthcare websites

export interface HealthcareSchemaConfig {
  organizationId: string;
  organizationName: string;
  organizationType: 'Hospital' | 'Clinic' | 'MedicalPractice' | 'DentalPractice' | 'Pharmacy' | 'Laboratory';
  specialties: string[];
  locations: HealthcareLocation[];
  providers: HealthcareProvider[];
  services: HealthcareService[];
  contactInfo: ContactInfo;
  socialMedia: SocialMediaLinks;
  certifications: string[];
  languages: string[];
  insuranceAccepted: string[];
  paymentMethods: string[];
}

export interface HealthcareLocation {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  fax?: string;
  email?: string;
  hours: BusinessHours[];
  services: string[];
  specialties: string[];
  isPrimary: boolean;
}

export interface HealthcareProvider {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  credentials: string[];
  education: Education[];
  certifications: string[];
  languages: string[];
  photo?: string;
  bio?: string;
  acceptingNewPatients: boolean;
  locations: string[];
}

export interface HealthcareService {
  id: string;
  name: string;
  description: string;
  category: string;
  specialties: string[];
  providers: string[];
  locations: string[];
  cost?: {
    min: number;
    max: number;
    currency: string;
  };
  duration?: string;
  preparation?: string;
  recovery?: string;
}

export interface ContactInfo {
  phone: string;
  fax?: string;
  email: string;
  website: string;
  emergencyPhone?: string;
}

export interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface BusinessHours {
  dayOfWeek: string[];
  opens: string;
  closes: string;
  isClosed?: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
  fieldOfStudy?: string;
}

export interface SchemaMarkup {
  type: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  healthcareSpecific: boolean;
}

export class HealthcareSchemaGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  generateOrganizationSchema(config: HealthcareSchemaConfig): SchemaMarkup {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalOrganization",
      "@id": `${this.baseUrl}/#organization`,
      "name": config.organizationName,
      "alternateName": config.organizationName,
      "description": this.generateOrganizationDescription(config),
      "url": config.contactInfo.website,
      "logo": {
        "@type": "ImageObject",
        "url": `${this.baseUrl}/logo.png`,
        "width": 200,
        "height": 200
      },
      "image": {
        "@type": "ImageObject",
        "url": `${this.baseUrl}/organization-image.jpg`,
        "width": 1200,
        "height": 630
      },
      "telephone": config.contactInfo.phone,
      "faxNumber": config.contactInfo.fax,
      "email": config.contactInfo.email,
      "address": this.generateAddressSchema(config.locations[0].address),
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": config.locations[0].coordinates.latitude,
        "longitude": config.locations[0].coordinates.longitude
      },
      "openingHoursSpecification": this.generateBusinessHoursSchema(config.locations[0].hours),
      "medicalSpecialty": config.specialties,
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Healthcare Services",
        "itemListElement": config.services.map(service => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalProcedure",
            "name": service.name,
            "description": service.description
          }
        }))
      },
      "sameAs": this.generateSameAsLinks(config.socialMedia),
      "areaServed": this.generateAreaServed(config.locations),
      "knowsAbout": config.specialties,
      "hasCredential": config.certifications.map(cert => ({
        "@type": "EducationalOccupationalCredential",
        "name": cert
      })),
      "availableLanguage": config.languages,
      "paymentAccepted": config.paymentMethods,
      "currenciesAccepted": "USD"
    };

    return {
      type: 'MedicalOrganization',
      data: organizationSchema,
      priority: 'high',
      healthcareSpecific: true
    };
  }

  generateMedicalWebPageSchema(pageData: {
    title: string;
    description: string;
    url: string;
    specialty?: string;
    lastReviewed?: string;
    medicalContent?: boolean;
  }): SchemaMarkup {
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      "@id": pageData.url,
      "name": pageData.title,
      "description": pageData.description,
      "url": pageData.url,
      "mainEntity": {
        "@type": "MedicalCondition",
        "name": pageData.title,
        "description": pageData.description
      },
      "about": {
        "@type": "MedicalCondition",
        "name": pageData.title
      },
      "specialty": pageData.specialty,
      "lastReviewed": pageData.lastReviewed || new Date().toISOString().split('T')[0],
      "isPartOf": {
        "@type": "WebSite",
        "name": "Healthcare Website",
        "url": this.baseUrl
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": this.generateBreadcrumbSchema(pageData.url)
      }
    };

    return {
      type: 'MedicalWebPage',
      data: webPageSchema,
      priority: 'high',
      healthcareSpecific: true
    };
  }

  generateHealthcareProviderSchema(provider: HealthcareProvider, config: HealthcareSchemaConfig): SchemaMarkup {
    const providerSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${this.baseUrl}/providers/${provider.id}`,
      "name": provider.name,
      "jobTitle": provider.title,
      "description": provider.bio,
      "image": provider.photo ? {
        "@type": "ImageObject",
        "url": provider.photo
      } : undefined,
      "worksFor": {
        "@type": "MedicalOrganization",
        "name": config.organizationName,
        "url": config.contactInfo.website
      },
      "hasCredential": provider.credentials.map(cred => ({
        "@type": "EducationalOccupationalCredential",
        "name": cred
      })),
      "alumniOf": provider.education.map(edu => ({
        "@type": "EducationalOrganization",
        "name": edu.institution,
        "description": `${edu.degree} in ${edu.fieldOfStudy || 'Medicine'}, ${edu.year}`
      })),
      "knowsAbout": provider.specialties,
      "availableLanguage": provider.languages,
      "memberOf": provider.certifications.map(cert => ({
        "@type": "Organization",
        "name": cert
      })),
      "hasOccupation": {
        "@type": "Occupation",
        "name": provider.title,
        "occupationLocation": provider.locations.map(locId => {
          const location = config.locations.find(loc => loc.id === locId);
          return location ? this.generateAddressSchema(location.address) : null;
        }).filter(Boolean)
      }
    };

    return {
      type: 'HealthcareProvider',
      data: providerSchema,
      priority: 'high',
      healthcareSpecific: true
    };
  }

  generateMedicalServiceSchema(service: HealthcareService, config: HealthcareSchemaConfig): SchemaMarkup {
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      "@id": `${this.baseUrl}/services/${service.id}`,
      "name": service.name,
      "description": service.description,
      "category": service.category,
      "bodyLocation": service.specialties,
      "procedureType": service.category,
      "preparation": service.preparation,
      "followup": service.recovery,
      "procedureTime": service.duration,
      "cost": service.cost ? {
        "@type": "MonetaryAmount",
        "currency": service.cost.currency,
        "value": {
          "@type": "QuantitativeValue",
          "minValue": service.cost.min,
          "maxValue": service.cost.max
        }
      } : undefined,
      "provider": {
        "@type": "MedicalOrganization",
        "name": config.organizationName,
        "url": config.contactInfo.website
      },
      "availableAtOrFrom": service.locations.map(locId => {
        const location = config.locations.find(loc => loc.id === locId);
        return location ? {
          "@type": "MedicalOrganization",
          "name": location.name,
          "address": this.generateAddressSchema(location.address)
        } : null;
      }).filter(Boolean)
    };

    return {
      type: 'MedicalService',
      data: serviceSchema,
      priority: 'medium',
      healthcareSpecific: true
    };
  }

  generateLocalBusinessSchema(location: HealthcareLocation, config: HealthcareSchemaConfig): SchemaMarkup {
    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      "@id": `${this.baseUrl}/locations/${location.id}`,
      "name": location.name,
      "description": `${config.organizationName} - ${location.name}`,
      "url": `${config.contactInfo.website}/locations/${location.id}`,
      "telephone": location.phone,
      "faxNumber": location.fax,
      "email": location.email,
      "address": this.generateAddressSchema(location.address),
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": location.coordinates.latitude,
        "longitude": location.coordinates.longitude
      },
      "openingHoursSpecification": this.generateBusinessHoursSchema(location.hours),
      "medicalSpecialty": location.specialties,
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": location.coordinates.latitude,
          "longitude": location.coordinates.longitude
        },
        "geoRadius": "50000"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Healthcare Services",
        "itemListElement": location.services.map(service => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "MedicalProcedure",
            "name": service
          }
        }))
      },
      "paymentAccepted": config.paymentMethods,
      "currenciesAccepted": "USD",
      "priceRange": "$$"
    };

    return {
      type: 'LocalBusiness',
      data: localBusinessSchema,
      priority: 'high',
      healthcareSpecific: true
    };
  }

  generateFAQSchema(faqs: Array<{question: string; answer: string}>): SchemaMarkup {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    return {
      type: 'FAQPage',
      data: faqSchema,
      priority: 'medium',
      healthcareSpecific: false
    };
  }

  generateBreadcrumbSchema(url: string): any[] {
    const pathSegments = url.split('/').filter(segment => segment.length > 0);
    const breadcrumbs = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": this.baseUrl
      }
    ];

    let currentPath = this.baseUrl;
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": this.formatBreadcrumbName(segment),
        "item": currentPath
      });
    });

    return breadcrumbs;
  }

  generateComprehensiveSchema(config: HealthcareSchemaConfig, pageData?: any): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];

    // Organization schema (always included)
    schemas.push(this.generateOrganizationSchema(config));

    // Local business schemas for each location
    config.locations.forEach(location => {
      schemas.push(this.generateLocalBusinessSchema(location, config));
    });

    // Provider schemas
    config.providers.forEach(provider => {
      schemas.push(this.generateHealthcareProviderSchema(provider, config));
    });

    // Service schemas
    config.services.forEach(service => {
      schemas.push(this.generateMedicalServiceSchema(service, config));
    });

    // Page-specific schema
    if (pageData) {
      schemas.push(this.generateMedicalWebPageSchema(pageData));
    }

    return schemas;
  }

  generateSchemaHTML(schemas: SchemaMarkup[]): string {
    return schemas.map(schema => 
      `<script type="application/ld+json">\n${JSON.stringify(schema.data, null, 2)}\n</script>`
    ).join('\n\n');
  }

  // Helper methods
  private generateOrganizationDescription(config: HealthcareSchemaConfig): string {
    const specialties = config.specialties.join(', ');
    const locationCount = config.locations.length;
    const serviceCount = config.services.length;
    
    return `${config.organizationName} is a ${config.organizationType.toLowerCase()} specializing in ${specialties}. We have ${locationCount} location${locationCount > 1 ? 's' : ''} and offer ${serviceCount} healthcare services.`;
  }

  private generateAddressSchema(address: any): any {
    return {
      "@type": "PostalAddress",
      "streetAddress": address.street,
      "addressLocality": address.city,
      "addressRegion": address.state,
      "postalCode": address.zipCode,
      "addressCountry": address.country
    };
  }

  private generateBusinessHoursSchema(hours: BusinessHours[]): any[] {
    return hours.map(hour => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hour.dayOfWeek,
      "opens": hour.opens,
      "closes": hour.closes
    }));
  }

  private generateSameAsLinks(socialMedia: SocialMediaLinks): string[] {
    const links: string[] = [];
    
    if (socialMedia.facebook) links.push(socialMedia.facebook);
    if (socialMedia.twitter) links.push(socialMedia.twitter);
    if (socialMedia.linkedin) links.push(socialMedia.linkedin);
    if (socialMedia.instagram) links.push(socialMedia.instagram);
    if (socialMedia.youtube) links.push(socialMedia.youtube);
    
    return links;
  }

  private generateAreaServed(locations: HealthcareLocation[]): any {
    if (locations.length === 1) {
      return {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": locations[0].coordinates.latitude,
          "longitude": locations[0].coordinates.longitude
        },
        "geoRadius": "50000"
      };
    } else {
      return locations.map(location => ({
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": location.coordinates.latitude,
          "longitude": location.coordinates.longitude
        },
        "geoRadius": "50000"
      }));
    }
  }

  private formatBreadcrumbName(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Validation methods
  validateSchema(schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!schema['@context']) {
      errors.push('Missing @context');
    }
    if (!schema['@type']) {
      errors.push('Missing @type');
    }
    if (!schema.name) {
      errors.push('Missing name');
    }

    // Check healthcare-specific requirements
    if (schema['@type'] === 'MedicalOrganization') {
      if (!schema.medicalSpecialty || !Array.isArray(schema.medicalSpecialty)) {
        errors.push('MedicalOrganization must have medicalSpecialty array');
      }
      if (!schema.telephone) {
        errors.push('MedicalOrganization must have telephone');
      }
    }

    if (schema['@type'] === 'MedicalWebPage') {
      if (!schema.mainEntity) {
        errors.push('MedicalWebPage must have mainEntity');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateSchemaTestData(): HealthcareSchemaConfig {
    return {
      organizationId: 'org-123',
      organizationName: 'Sample Healthcare Organization',
      organizationType: 'MedicalPractice',
      specialties: ['Cardiology', 'Internal Medicine', 'Family Practice'],
      locations: [{
        id: 'loc-1',
        name: 'Main Office',
        address: {
          street: '123 Medical Drive',
          city: 'Healthcare City',
          state: 'HC',
          zipCode: '12345',
          country: 'US'
        },
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        phone: '+1-555-123-4567',
        email: 'info@samplehealthcare.com',
        hours: [{
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '17:00'
        }],
        services: ['General Consultation', 'Cardiology Consultation'],
        specialties: ['Cardiology', 'Internal Medicine'],
        isPrimary: true
      }],
      providers: [{
        id: 'prov-1',
        name: 'Dr. Jane Smith',
        title: 'Cardiologist',
        specialties: ['Cardiology'],
        credentials: ['MD', 'FACC'],
        education: [{
          institution: 'Medical University',
          degree: 'Doctor of Medicine',
          year: 2010,
          fieldOfStudy: 'Medicine'
        }],
        certifications: ['Board Certified Cardiologist'],
        languages: ['English', 'Spanish'],
        acceptingNewPatients: true,
        locations: ['loc-1']
      }],
      services: [{
        id: 'serv-1',
        name: 'Cardiology Consultation',
        description: 'Comprehensive heart health evaluation',
        category: 'Consultation',
        specialties: ['Cardiology'],
        providers: ['prov-1'],
        locations: ['loc-1'],
        duration: '60 minutes'
      }],
      contactInfo: {
        phone: '+1-555-123-4567',
        email: 'info@samplehealthcare.com',
        website: 'https://samplehealthcare.com'
      },
      socialMedia: {
        facebook: 'https://facebook.com/samplehealthcare',
        twitter: 'https://twitter.com/samplehealthcare'
      },
      certifications: ['Joint Commission Accredited'],
      languages: ['English', 'Spanish'],
      insuranceAccepted: ['Blue Cross', 'Aetna', 'Cigna'],
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    };
  }
}
