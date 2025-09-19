'use client';

// Email Compliance Validator Component
// Created: 2025-01-27
// Purpose: Real-time CAN-SPAM and healthcare compliance validation

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';
import type { 
  EmailTemplate, 
  ComplianceViolation, 
  HealthcareComplianceConfig 
} from '@/types/email-campaigns';

interface ComplianceValidatorProps {
  template: EmailTemplate;
  onValidationComplete: (isCompliant: boolean, violations: ComplianceViolation[]) => void;
  autoValidate?: boolean;
}

interface ValidationResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  recommendations: string[];
  complianceScore: number;
  lastValidated: string;
}

const COMPLIANCE_RULES = [
  {
    id: 'can_spam_unsubscribe',
    name: 'CAN-SPAM Unsubscribe Link',
    description: 'Email must include a clear and conspicuous unsubscribe link',
    severity: 'error' as const,
    check: (template: EmailTemplate) => {
      const content = template.template_definition.html_content.toLowerCase();
      return content.includes('unsubscribe') || content.includes('opt-out');
    }
  },
  {
    id: 'can_spam_sender_info',
    name: 'CAN-SPAM Sender Information',
    description: 'Email must include valid sender information',
    severity: 'error' as const,
    check: (template: EmailTemplate) => {
      return !!(template.template_definition.header_config.company_name);
    }
  },
  {
    id: 'fda_advertising_disclaimer',
    name: 'FDA Advertising Disclaimer',
    description: 'Promotional content must include appropriate medical disclaimers',
    severity: 'warning' as const,
    check: (template: EmailTemplate) => {
      if (template.category !== 'promotional') return true;
      const content = template.template_definition.html_content.toLowerCase();
      return content.includes('consult your') || content.includes('disclaimer');
    }
  },
  {
    id: 'hipaa_phi_protection',
    name: 'HIPAA PHI Protection',
    description: 'Email must not contain protected health information',
    severity: 'error' as const,
    check: (template: EmailTemplate) => {
      const content = template.template_definition.html_content.toLowerCase();
      const phiKeywords = ['patient', 'medical record', 'diagnosis', 'treatment', 'ssn', 'social security'];
      return !phiKeywords.some(keyword => content.includes(keyword));
    }
  },
  {
    id: 'consent_tracking',
    name: 'Consent Tracking',
    description: 'Healthcare communications must have proper consent tracking',
    severity: 'error' as const,
    check: (template: EmailTemplate) => {
      return template.healthcare_compliance.consent_required && 
             template.healthcare_compliance.audit_trail_enabled;
    }
  },
  {
    id: 'required_disclaimers',
    name: 'Required Disclaimers',
    description: 'Template must include all required healthcare disclaimers',
    severity: 'warning' as const,
    check: (template: EmailTemplate) => {
      const content = template.template_definition.html_content.toLowerCase();
      const requiredDisclaimers = template.healthcare_compliance.required_disclaimers;
      return requiredDisclaimers.every(disclaimer => 
        content.includes(disclaimer.toLowerCase())
      );
    }
  }
];

export default function ComplianceValidator({ 
  template, 
  onValidationComplete, 
  autoValidate = true 
}: ComplianceValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<string>('');

  // Auto-validate when template changes
  useEffect(() => {
    if (autoValidate && template.template_definition.html_content) {
      validateCompliance();
    }
  }, [template, autoValidate]);

  const validateCompliance = useCallback(async () => {
    setIsValidating(true);
    
    try {
      // Perform local validation first
      const localResult = performLocalValidation(template);
      
      // If local validation passes, perform server-side validation
      if (localResult.isCompliant) {
        const serverResult = await performServerValidation(template);
        setValidationResult(serverResult);
        onValidationComplete(serverResult.isCompliant, serverResult.violations);
      } else {
        setValidationResult(localResult);
        onValidationComplete(localResult.isCompliant, localResult.violations);
      }
      
      setLastValidated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Compliance validation failed:', error);
      const errorResult: ValidationResult = {
        isCompliant: false,
        violations: [{
          type: 'validation_error',
          severity: 'error',
          message: 'Failed to validate compliance',
          field: 'system'
        }],
        recommendations: ['Please try again or contact support'],
        complianceScore: 0,
        lastValidated: new Date().toISOString()
      };
      setValidationResult(errorResult);
      onValidationComplete(false, errorResult.violations);
    } finally {
      setIsValidating(false);
    }
  }, [template, onValidationComplete]);

  const performLocalValidation = (template: EmailTemplate): ValidationResult => {
    const violations: ComplianceViolation[] = [];
    let passedRules = 0;

    COMPLIANCE_RULES.forEach(rule => {
      const passed = rule.check(template);
      if (passed) {
        passedRules++;
      } else {
        violations.push({
          type: rule.id,
          severity: rule.severity,
          message: rule.description,
          field: 'content',
          suggestion: getSuggestionForRule(rule.id)
        });
      }
    });

    const complianceScore = Math.round((passedRules / COMPLIANCE_RULES.length) * 100);
    const isCompliant = violations.filter(v => v.severity === 'error').length === 0;

    return {
      isCompliant,
      violations,
      recommendations: generateRecommendations(violations),
      complianceScore,
      lastValidated: new Date().toISOString()
    };
  };

  const performServerValidation = async (template: EmailTemplate): Promise<ValidationResult> => {
    try {
      const response = await fetch('/api/admin/email/templates/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: template.template_definition.html_content,
          template: template
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const complianceScore = calculateComplianceScore(result.data.violations);
        return {
          isCompliant: result.data.isCompliant,
          violations: result.data.violations,
          recommendations: result.data.recommendations || [],
          complianceScore,
          lastValidated: new Date().toISOString()
        };
      } else {
        throw new Error(result.details || 'Server validation failed');
      }
    } catch (error) {
      console.error('Server validation failed:', error);
      throw error;
    }
  };

  const calculateComplianceScore = (violations: ComplianceViolation[]): number => {
    const totalRules = COMPLIANCE_RULES.length;
    const errorViolations = violations.filter(v => v.severity === 'error').length;
    const warningViolations = violations.filter(v => v.severity === 'warning').length;
    
    const score = Math.max(0, 100 - (errorViolations * 20) - (warningViolations * 5));
    return Math.round(score);
  };

  const getSuggestionForRule = (ruleId: string): string => {
    const suggestions: Record<string, string> = {
      'can_spam_unsubscribe': 'Add an unsubscribe link in the email footer',
      'can_spam_sender_info': 'Include company name and contact information in header',
      'fda_advertising_disclaimer': 'Add "Consult your healthcare provider" disclaimer',
      'hipaa_phi_protection': 'Remove or anonymize any protected health information',
      'consent_tracking': 'Enable consent tracking and audit trail in template settings',
      'required_disclaimers': 'Include all required healthcare disclaimers in content'
    };
    return suggestions[ruleId] || 'Please review the compliance requirements';
  };

  const generateRecommendations = (violations: ComplianceViolation[]): string[] => {
    const recommendations: string[] = [];
    const violationTypes = new Set(violations.map(v => v.type));

    if (violationTypes.has('can_spam_unsubscribe')) {
      recommendations.push('Add a clear unsubscribe link in the email footer');
    }
    if (violationTypes.has('fda_advertising_disclaimer')) {
      recommendations.push('Include appropriate medical disclaimers for promotional content');
    }
    if (violationTypes.has('hipaa_phi_protection')) {
      recommendations.push('Remove any protected health information from the email content');
    }
    if (violationTypes.has('consent_tracking')) {
      recommendations.push('Enable proper consent tracking and audit trail');
    }

    return recommendations;
  };

  const getComplianceStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Healthcare Compliance Validator
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={validateCompliance}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
        </div>
        {lastValidated && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last validated: {lastValidated}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {validationResult ? (
          <>
            {/* Compliance Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compliance Score</span>
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(validationResult.complianceScore)}
                  <span className={`font-bold ${getComplianceStatusColor(validationResult.complianceScore)}`}>
                    {validationResult.complianceScore}%
                  </span>
                </div>
              </div>
              <Progress value={validationResult.complianceScore} className="h-2" />
            </div>

            {/* Compliance Status */}
            <div className="flex items-center gap-2">
              {validationResult.isCompliant ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Compliant
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Non-Compliant
                </Badge>
              )}
              <Badge variant="outline">
                {validationResult.violations.length} Issues
              </Badge>
            </div>

            {/* Violations */}
            {validationResult.violations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Issues Found</h4>
                <div className="space-y-2">
                  {validationResult.violations.map((violation, index) => (
                    <Alert key={index} className={violation.severity === 'error' ? 'border-red-200' : 'border-yellow-200'}>
                      <div className="flex items-start gap-2">
                        {violation.severity === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={violation.severity === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {violation.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{violation.message}</span>
                          </div>
                          {violation.suggestion && (
                            <p className="text-xs text-gray-600 mt-1">
                              💡 {violation.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {validationResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
                <ul className="space-y-1">
                  {validationResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Compliance Features</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {template.healthcare_compliance.can_spam_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>CAN-SPAM</span>
                </div>
                <div className="flex items-center gap-2">
                  {template.healthcare_compliance.fda_advertising_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>FDA Advertising</span>
                </div>
                <div className="flex items-center gap-2">
                  {template.healthcare_compliance.hipaa_compliant ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>HIPAA</span>
                </div>
                <div className="flex items-center gap-2">
                  {template.healthcare_compliance.audit_trail_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Audit Trail</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Click "Validate" to check compliance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
