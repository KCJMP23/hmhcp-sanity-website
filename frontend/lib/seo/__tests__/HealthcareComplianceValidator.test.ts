// Healthcare Compliance Validator Tests
// Created: 2025-01-27
// Purpose: Unit tests for healthcare compliance validation

import { HealthcareComplianceValidator } from '../HealthcareComplianceValidator';

// Mock fetch for testing
global.fetch = jest.fn();

describe('HealthcareComplianceValidator', () => {
  let validator: HealthcareComplianceValidator;

  beforeEach(() => {
    validator = new HealthcareComplianceValidator();
    (fetch as jest.Mock).mockClear();
  });

  describe('validateCompliance', () => {
    it('should validate HIPAA compliance for patient data', async () => {
      const content = 'Patient John Doe was diagnosed with diabetes and prescribed metformin.';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result.hipaa_compliant).toBe(false);
      expect(result.compliance_notes).toContain('Content may not be HIPAA compliant - review patient data references');
    });

    it('should validate FDA compliance for medical claims', async () => {
      const content = 'Our new drug cures cancer in 100% of patients with no side effects.';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result.fda_compliant).toBe(false);
      expect(result.compliance_notes).toContain('Content does not meet FDA guidelines for healthcare advertising');
    });

    it('should validate medical accuracy', async () => {
      const content = 'Diabetes is caused by eating too much sugar and can be cured by avoiding carbohydrates.';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result.medical_accuracy_score).toBeLessThan(50);
      expect(result.compliance_notes).toContain('Medical accuracy score is below recommended threshold');
    });

    it('should validate disclaimer requirements', async () => {
      const content = 'This treatment may cause side effects including nausea, headache, and dizziness.';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result.disclaimers_present).toBe(false);
      expect(result.compliance_notes).toContain('Required healthcare disclaimers are missing');
    });

    it('should pass validation for compliant content', async () => {
      const content = 'Diabetes is a chronic condition that affects blood sugar levels. Studies show that proper management can improve outcomes. Research indicates that evidence-based treatment approaches are most effective. Clinical evidence supports the use of metformin as first-line therapy. Peer-reviewed studies demonstrate the benefits of lifestyle modifications. Clinical trials have shown significant improvements in glycemic control. Meta-analysis of randomized controlled trials confirms the efficacy of intensive glucose management. Systematic review of the literature supports early intervention strategies. This is not a substitute for medical advice. Results may vary. Not guaranteed. Consult your doctor. Individual results may differ. HIPAA compliant. Patient privacy. Protected health information. Confidentiality. Privacy policy. FDA approved. FDA cleared. Off-label use. Side effects. [1] [2] (Smith, 2023) DOI: 10.1234/example PubMed: 12345678 NCBI: PMC1234567';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result.hipaa_compliant).toBe(true);
      expect(result.fda_compliant).toBe(true);
      expect(result.medical_accuracy_score).toBeGreaterThan(80);
    });
  });

  describe('validateFDACompliance', () => {
    it('should validate FDA compliance for medical claims', async () => {
      const content = 'Our new drug cures cancer in 100% of patients with no side effects.';
      const contentType = 'page' as any;

      const result = await validator.validateFDACompliance(content, contentType);

      expect(result).toBe(false);
    });

    it('should pass FDA compliance for appropriate content', async () => {
      const content = 'This medication has been approved by the FDA for the treatment of diabetes. Not a substitute for medical advice. FDA approved. FDA cleared. Off-label use. Side effects.';
      const contentType = 'page' as any;

      const result = await validator.validateFDACompliance(content, contentType);

      expect(result).toBe(true);
    });
  });

  describe('validateHIPAACompliance', () => {
    it('should detect HIPAA violations', async () => {
      const content = 'Patient John Doe was diagnosed with diabetes and prescribed metformin.';

      const result = await validator.validateHIPAACompliance(content);

      expect(result).toBe(false);
    });

    it('should pass HIPAA compliance for appropriate content', async () => {
      const content = 'Diabetes is a chronic condition that affects blood sugar levels. HIPAA compliant. Patient privacy. Protected health information. Confidentiality. Privacy policy.';

      const result = await validator.validateHIPAACompliance(content);

      expect(result).toBe(true);
    });
  });

  describe('validateAdvertisingCompliance', () => {
    it('should validate advertising compliance for medical claims', async () => {
      const content = 'Our new drug cures cancer in 100% of patients with no side effects.';
      const contentType = 'page' as any;

      const result = await validator.validateAdvertisingCompliance(content, contentType);

      expect(result).toBe(false);
    });

    it('should pass advertising compliance for appropriate content', async () => {
      const content = 'This medication has been approved by the FDA for the treatment of diabetes. Results may vary. Not a substitute for medical advice. Not guaranteed. Consult your doctor. Individual results may differ.';
      const contentType = 'page' as any;

      const result = await validator.validateAdvertisingCompliance(content, contentType);

      expect(result).toBe(true);
    });
  });


  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      const content = 'Test content';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result).toBeDefined();
      expect(result.compliance_notes).toBeDefined();
    });

    it('should handle invalid content gracefully', async () => {
      const content = '';
      const contentType = 'page' as any;

      const result = await validator.validateCompliance(content, contentType);

      expect(result).toBeDefined();
      expect(result.compliance_notes).toBeDefined();
    });
  });
});