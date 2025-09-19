// Local Citation Manager
// Created: 2025-01-27
// Purpose: Manage local citations for healthcare facilities

export interface CitationPlatform {
  id: string;
  name: string;
  url: string;
  category: 'directory' | 'review' | 'social' | 'healthcare' | 'general';
  priority: 'high' | 'medium' | 'low';
  healthcareSpecific: boolean;
  requiresVerification: boolean;
  apiSupported: boolean;
  fields: CitationField[];
}

export interface CitationField {
  name: string;
  type: 'text' | 'url' | 'phone' | 'email' | 'address' | 'hours' | 'description' | 'categories';
  required: boolean;
  maxLength?: number;
  options?: string[];
}

export interface CitationData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  fax?: string;
  email?: string;
  website?: string;
  description?: string;
  hours: BusinessHours[];
  categories: string[];
  specialties: string[];
  services: string[];
  languages: string[];
  insuranceAccepted: string[];
  paymentMethods: string[];
  amenities: string[];
  photos: string[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface BusinessHours {
  dayOfWeek: string[];
  opens: string;
  closes: string;
  isClosed?: boolean;
}

export interface CitationSubmission {
  id: string;
  locationId: string;
  platformId: string;
  status: 'pending' | 'submitted' | 'verified' | 'error' | 'duplicate';
  submittedAt: Date;
  verifiedAt?: Date;
  lastChecked: Date;
  data: CitationData;
  errors: CitationError[];
  verificationMethod?: 'phone' | 'email' | 'postcard' | 'api';
  verificationCode?: string;
}

export interface CitationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fix: string;
}

export interface CitationReport {
  locationId: string;
  totalPlatforms: number;
  submitted: number;
  verified: number;
  pending: number;
  errors: number;
  duplicates: number;
  score: number;
  recommendations: CitationRecommendation[];
}

export interface CitationRecommendation {
  id: string;
  type: 'missing' | 'incomplete' | 'inconsistent' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  platform: string;
  title: string;
  description: string;
  action: string;
  effort: 'low' | 'medium' | 'high';
}

export class LocalCitationManager {
  private platforms: CitationPlatform[] = [];

  constructor() {
    this.initializePlatforms();
  }

  async submitCitation(locationId: string, platformId: string, data: CitationData): Promise<CitationSubmission> {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    // Validate data
    const errors = this.validateCitationData(data, platform);
    if (errors.length > 0) {
      throw new Error(`Citation data validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Create submission
    const submission: CitationSubmission = {
      id: `submission-${Date.now()}`,
      locationId,
      platformId,
      status: 'pending',
      submittedAt: new Date(),
      lastChecked: new Date(),
      data,
      errors: []
    };

    // Submit to platform
    try {
      await this.submitToPlatform(platform, data);
      submission.status = 'submitted';
    } catch (error) {
      submission.status = 'error';
      submission.errors.push({
        field: 'general',
        message: error instanceof Error ? error.message : 'Submission failed',
        severity: 'error',
        fix: 'Check platform requirements and try again'
      });
    }

    return submission;
  }

  async verifyCitation(submissionId: string, verificationCode?: string): Promise<boolean> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const platform = this.platforms.find(p => p.id === submission.platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    try {
      const verified = await this.verifyWithPlatform(platform, submission, verificationCode);
      if (verified) {
        submission.status = 'verified';
        submission.verifiedAt = new Date();
      }
      return verified;
    } catch (error) {
      console.error('Citation verification failed:', error);
      return false;
    }
  }

  async checkCitationStatus(submissionId: string): Promise<CitationSubmission> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    const platform = this.platforms.find(p => p.id === submission.platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    try {
      const status = await this.checkPlatformStatus(platform, submission);
      submission.status = status;
      submission.lastChecked = new Date();
    } catch (error) {
      console.error('Status check failed:', error);
    }

    return submission;
  }

  async generateReport(locationId: string): Promise<CitationReport> {
    const submissions = await this.getSubmissionsForLocation(locationId);
    
    const totalPlatforms = this.platforms.length;
    const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'verified').length;
    const verified = submissions.filter(s => s.status === 'verified').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const errors = submissions.filter(s => s.status === 'error').length;
    const duplicates = submissions.filter(s => s.status === 'duplicate').length;

    const score = this.calculateCitationScore({
      totalPlatforms,
      submitted,
      verified,
      pending,
      errors,
      duplicates
    });

    const recommendations = this.generateRecommendations(submissions, locationId);

    return {
      locationId,
      totalPlatforms,
      submitted,
      verified,
      pending,
      errors,
      duplicates,
      score,
      recommendations
    };
  }

  async getPlatforms(category?: string, healthcareOnly: boolean = false): Promise<CitationPlatform[]> {
    let filteredPlatforms = this.platforms;

    if (category) {
      filteredPlatforms = filteredPlatforms.filter(p => p.category === category);
    }

    if (healthcareOnly) {
      filteredPlatforms = filteredPlatforms.filter(p => p.healthcareSpecific);
    }

    return filteredPlatforms;
  }

  async getSubmission(submissionId: string): Promise<CitationSubmission | null> {
    // In a real implementation, this would fetch from database
    // For now, return mock data
    return null;
  }

  async getSubmissionsForLocation(locationId: string): Promise<CitationSubmission[]> {
    // In a real implementation, this would fetch from database
    // For now, return mock data
    return [];
  }

  // Private helper methods
  private initializePlatforms(): void {
    this.platforms = [
      {
        id: 'google-my-business',
        name: 'Google My Business',
        url: 'https://business.google.com',
        category: 'directory',
        priority: 'high',
        healthcareSpecific: false,
        requiresVerification: true,
        apiSupported: true,
        fields: [
          { name: 'name', type: 'text', required: true, maxLength: 100 },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'website', type: 'url', required: false },
          { name: 'description', type: 'description', required: false, maxLength: 750 },
          { name: 'hours', type: 'hours', required: true },
          { name: 'categories', type: 'categories', required: true }
        ]
      },
      {
        id: 'healthgrades',
        name: 'Healthgrades',
        url: 'https://www.healthgrades.com',
        category: 'healthcare',
        priority: 'high',
        healthcareSpecific: true,
        requiresVerification: true,
        apiSupported: false,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'specialties', type: 'categories', required: true },
          { name: 'description', type: 'description', required: false }
        ]
      },
      {
        id: 'webmd',
        name: 'WebMD',
        url: 'https://www.webmd.com',
        category: 'healthcare',
        priority: 'high',
        healthcareSpecific: true,
        requiresVerification: true,
        apiSupported: false,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'specialties', type: 'categories', required: true }
        ]
      },
      {
        id: 'vitals',
        name: 'Vitals',
        url: 'https://www.vitals.com',
        category: 'healthcare',
        priority: 'medium',
        healthcareSpecific: true,
        requiresVerification: true,
        apiSupported: false,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'specialties', type: 'categories', required: true }
        ]
      },
      {
        id: 'zocdoc',
        name: 'Zocdoc',
        url: 'https://www.zocdoc.com',
        category: 'healthcare',
        priority: 'medium',
        healthcareSpecific: true,
        requiresVerification: true,
        apiSupported: true,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'specialties', type: 'categories', required: true },
          { name: 'insuranceAccepted', type: 'categories', required: false }
        ]
      },
      {
        id: 'facebook',
        name: 'Facebook',
        url: 'https://www.facebook.com',
        category: 'social',
        priority: 'medium',
        healthcareSpecific: false,
        requiresVerification: true,
        apiSupported: true,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'website', type: 'url', required: false },
          { name: 'description', type: 'description', required: false }
        ]
      },
      {
        id: 'yelp',
        name: 'Yelp',
        url: 'https://www.yelp.com',
        category: 'review',
        priority: 'medium',
        healthcareSpecific: false,
        requiresVerification: true,
        apiSupported: true,
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'address', type: 'address', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'website', type: 'url', required: false },
          { name: 'categories', type: 'categories', required: true }
        ]
      }
    ];
  }

  private validateCitationData(data: CitationData, platform: CitationPlatform): CitationError[] {
    const errors: CitationError[] = [];

    platform.fields.forEach(field => {
      if (field.required) {
        const value = this.getFieldValue(data, field.name);
        if (!value || value.toString().trim() === '') {
          errors.push({
            field: field.name,
            message: `${field.name} is required`,
            severity: 'error',
            fix: `Provide a valid ${field.name}`
          });
        }
      }

      if (field.maxLength) {
        const value = this.getFieldValue(data, field.name);
        if (value && value.toString().length > field.maxLength) {
          errors.push({
            field: field.name,
            message: `${field.name} exceeds maximum length of ${field.maxLength} characters`,
            severity: 'error',
            fix: `Shorten ${field.name} to ${field.maxLength} characters or less`
          });
        }
      }
    });

    return errors;
  }

  private getFieldValue(data: CitationData, fieldName: string): any {
    switch (fieldName) {
      case 'name': return data.name;
      case 'address': return data.address;
      case 'phone': return data.phone;
      case 'fax': return data.fax;
      case 'email': return data.email;
      case 'website': return data.website;
      case 'description': return data.description;
      case 'hours': return data.hours;
      case 'categories': return data.categories;
      case 'specialties': return data.specialties;
      case 'services': return data.services;
      case 'languages': return data.languages;
      case 'insuranceAccepted': return data.insuranceAccepted;
      case 'paymentMethods': return data.paymentMethods;
      case 'amenities': return data.amenities;
      default: return null;
    }
  }

  private async submitToPlatform(platform: CitationPlatform, data: CitationData): Promise<void> {
    // Simulate platform submission
    console.log(`Submitting to ${platform.name}:`, data);
    
    // In a real implementation, this would make API calls to the platform
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async verifyWithPlatform(platform: CitationPlatform, submission: CitationSubmission, code?: string): Promise<boolean> {
    // Simulate verification
    console.log(`Verifying with ${platform.name}:`, code);
    
    // In a real implementation, this would verify with the platform
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return Math.random() > 0.2; // 80% success rate
  }

  private async checkPlatformStatus(platform: CitationPlatform, submission: CitationSubmission): Promise<string> {
    // Simulate status check
    console.log(`Checking status with ${platform.name}`);
    
    // In a real implementation, this would check the platform status
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const statuses = ['submitted', 'verified', 'error'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private calculateCitationScore(metrics: {
    totalPlatforms: number;
    submitted: number;
    verified: number;
    pending: number;
    errors: number;
    duplicates: number;
  }): number {
    const { totalPlatforms, submitted, verified, errors, duplicates } = metrics;
    
    let score = 0;
    
    // Base score for submissions
    score += (submitted / totalPlatforms) * 50;
    
    // Bonus for verifications
    score += (verified / totalPlatforms) * 30;
    
    // Penalty for errors
    score -= (errors / totalPlatforms) * 20;
    
    // Penalty for duplicates
    score -= (duplicates / totalPlatforms) * 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(submissions: CitationSubmission[], locationId: string): CitationRecommendation[] {
    const recommendations: CitationRecommendation[] = [];
    
    // Check for missing high-priority platforms
    const highPriorityPlatforms = this.platforms.filter(p => p.priority === 'high');
    const submittedPlatforms = submissions.map(s => s.platformId);
    
    highPriorityPlatforms.forEach(platform => {
      if (!submittedPlatforms.includes(platform.id)) {
        recommendations.push({
          id: `missing-${platform.id}`,
          type: 'missing',
          priority: 'high',
          platform: platform.name,
          title: `Submit to ${platform.name}`,
          description: `Missing citation on high-priority platform: ${platform.name}`,
          action: `Create and submit citation to ${platform.name}`,
          effort: 'medium'
        });
      }
    });
    
    // Check for incomplete submissions
    submissions.forEach(submission => {
      if (submission.status === 'error' && submission.errors.length > 0) {
        const platform = this.platforms.find(p => p.id === submission.platformId);
        if (platform) {
          recommendations.push({
            id: `incomplete-${submission.id}`,
            type: 'incomplete',
            priority: 'medium',
            platform: platform.name,
            title: `Fix ${platform.name} Citation`,
            description: `Citation has errors that need to be resolved`,
            action: `Review and fix errors in ${platform.name} submission`,
            effort: 'low'
          });
        }
      }
    });
    
    return recommendations;
  }
}
