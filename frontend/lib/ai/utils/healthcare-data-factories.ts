/**
 * Healthcare Data Factories
 * Provides realistic healthcare-related test data for AI agent testing
 */

import { faker } from '@faker-js/faker';

export interface MedicalContent {
  title: string;
  content: string;
  summary: string;
  medicalField: string;
  keywords: string[];
  author: string;
  publishDate: string;
  wordCount: number;
}

export interface PatientData {
  id: string;
  age: number;
  gender: string;
  condition: string;
  symptoms: string[];
  medications: string[];
  allergies: string[];
  lastVisit: string;
}

export interface MedicalRecord {
  patientId: string;
  visitDate: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  provider: string;
  followUpRequired: boolean;
}

export class HealthcareDataFactory {
  private static medicalFields = [
    'cardiology', 'neurology', 'oncology', 'pediatrics', 'orthopedics',
    'dermatology', 'psychiatry', 'endocrinology', 'gastroenterology', 'pulmonology'
  ];

  private static conditions = [
    'Type 2 Diabetes', 'Hypertension', 'Coronary Artery Disease', 'Depression',
    'Anxiety', 'Osteoarthritis', 'Asthma', 'Migraine', 'Chronic Pain', 'Sleep Apnea'
  ];

  private static symptoms = [
    'chest pain', 'shortness of breath', 'headache', 'fatigue', 'nausea',
    'dizziness', 'joint pain', 'muscle weakness', 'memory problems', 'sleep disturbances'
  ];

  private static medications = [
    'Metformin', 'Lisinopril', 'Atorvastatin', 'Sertraline', 'Ibuprofen',
    'Albuterol', 'Sumatriptan', 'Gabapentin', 'Melatonin', 'Omeprazole'
  ];

  /**
   * Create realistic medical content for testing
   */
  static createMedicalContent(): MedicalContent {
    const medicalField = faker.helpers.arrayElement(this.medicalFields);
    const condition = faker.helpers.arrayElement(this.conditions);
    
    const title = `Understanding ${condition}: A Comprehensive Guide for ${medicalField} Patients`;
    
    const content = this.generateMedicalArticle(condition, medicalField);
    
    return {
      title,
      content,
      summary: content.substring(0, 200) + '...',
      medicalField,
      keywords: this.generateKeywords(condition, medicalField),
      author: faker.person.fullName(),
      publishDate: faker.date.past().toISOString(),
      wordCount: content.split(' ').length
    };
  }

  /**
   * Create patient data for testing
   */
  static createPatientData(): PatientData {
    const condition = faker.helpers.arrayElement(this.conditions);
    const symptoms = faker.helpers.arrayElements(this.symptoms, { min: 2, max: 5 });
    const medications = faker.helpers.arrayElements(this.medications, { min: 1, max: 3 });
    const allergies = faker.helpers.arrayElements(['Penicillin', 'Sulfa', 'Latex', 'Shellfish'], { min: 0, max: 2 });

    return {
      id: faker.string.uuid(),
      age: faker.number.int({ min: 18, max: 85 }),
      gender: faker.person.sex(),
      condition,
      symptoms,
      medications,
      allergies,
      lastVisit: faker.date.past().toISOString()
    };
  }

  /**
   * Create medical record for testing
   */
  static createMedicalRecord(): MedicalRecord {
    const condition = faker.helpers.arrayElement(this.conditions);
    const treatment = faker.helpers.arrayElement([
      'Medication adjustment', 'Physical therapy', 'Lifestyle counseling',
      'Follow-up appointment', 'Referral to specialist', 'Monitoring plan'
    ]);

    return {
      patientId: faker.string.uuid(),
      visitDate: faker.date.past().toISOString(),
      diagnosis: condition,
      treatment,
      notes: this.generateMedicalNotes(condition),
      provider: faker.person.fullName(),
      followUpRequired: faker.datatype.boolean()
    };
  }

  /**
   * Generate medical article content
   */
  private static generateMedicalArticle(condition: string, field: string): string {
    const sections = [
      `## Introduction to ${condition}`,
      `This comprehensive guide provides essential information about ${condition} for patients and caregivers in the field of ${field}.`,
      
      `## Understanding the Condition`,
      `${condition} is a medical condition that affects many patients. Early recognition and proper management are crucial for optimal outcomes.`,
      
      `## Common Symptoms`,
      `Patients with ${condition} may experience various symptoms including fatigue, discomfort, and changes in daily functioning.`,
      
      `## Treatment Options`,
      `Treatment typically involves a combination of medication, lifestyle modifications, and regular monitoring by healthcare providers.`,
      
      `## Living with ${condition}`,
      `With proper management, most patients with ${condition} can lead active, fulfilling lives. Regular follow-up care is essential.`,
      
      `## When to Seek Medical Attention`,
      `Contact your healthcare provider if you experience new or worsening symptoms, or if you have concerns about your condition.`
    ];

    return sections.join('\n\n');
  }

  /**
   * Generate medical keywords
   */
  private static generateKeywords(condition: string, field: string): string[] {
    const baseKeywords = [condition.toLowerCase(), field.toLowerCase()];
    const additionalKeywords = faker.helpers.arrayElements([
      'treatment', 'symptoms', 'diagnosis', 'management', 'care',
      'health', 'medical', 'patient', 'therapy', 'medication'
    ], { min: 3, max: 7 });

    return [...baseKeywords, ...additionalKeywords];
  }

  /**
   * Generate medical notes
   */
  private static generateMedicalNotes(condition: string): string {
    const templates = [
      `Patient presents with symptoms consistent with ${condition}. Physical examination reveals no acute distress.`,
      `Follow-up visit for ${condition}. Patient reports improvement with current treatment regimen.`,
      `New diagnosis of ${condition}. Patient educated about condition and treatment options.`,
      `Routine monitoring for ${condition}. Patient stable, continue current management plan.`
    ];

    return faker.helpers.arrayElement(templates);
  }

  /**
   * Create multiple medical content items
   */
  static createMultipleMedicalContent(count: number): MedicalContent[] {
    return Array.from({ length: count }, () => this.createMedicalContent());
  }

  /**
   * Create multiple patient data items
   */
  static createMultiplePatientData(count: number): PatientData[] {
    return Array.from({ length: count }, () => this.createPatientData());
  }

  /**
   * Create multiple medical records
   */
  static createMultipleMedicalRecords(count: number): MedicalRecord[] {
    return Array.from({ length: count }, () => this.createMedicalRecord());
  }
}

// Export singleton instance for easy access
export const healthcareDataFactory = new HealthcareDataFactory();
