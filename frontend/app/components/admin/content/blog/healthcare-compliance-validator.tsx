'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('HealthcareComplianceValidator');

interface ComplianceIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  line?: number;
}

interface HealthcareComplianceValidatorProps {
  content: string;
  onValidationComplete: (issues: ComplianceIssue[]) => void;
}

export function HealthcareComplianceValidator({
  content,
  onValidationComplete
}: HealthcareComplianceValidatorProps) {
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (content.trim()) {
      validateContent(content);
    } else {
      setIssues([]);
      onValidationComplete([]);
    }
  }, [content, onValidationComplete]);

  const validateContent = async (text: string) => {
    setIsValidating(true);
    logger.info('Starting healthcare compliance validation', { contentLength: text.length });

    const validationIssues: ComplianceIssue[] = [];

    // Check for medical claims without citations
    const medicalClaims = [
      /treats?/gi,
      /cures?/gi,
      /prevents?/gi,
      /reduces?/gi,
      /increases?/gi,
      /improves?/gi,
      /effective/gi,
      /safe/gi,
      /proven/gi
    ];

    medicalClaims.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        const hasCitation = /\[citation|\[ref|\[source|\[study/gi.test(text);
        if (!hasCitation) {
          validationIssues.push({
            id: `medical-claim-${index}`,
            type: 'warning',
            message: `Medical claim "${matches[0]}" found without supporting citation`,
            suggestion: 'Add a citation or reference to support this claim',
            line: getLineNumber(text, matches[0])
          });
        }
      }
    });

    // Check for unsubstantiated health claims
    const unsubstantiatedClaims = [
      /miracle/gi,
      /breakthrough/gi,
      /revolutionary/gi,
      /guaranteed/gi,
      /100% effective/gi,
      /cures all/gi
    ];

    unsubstantiatedClaims.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        validationIssues.push({
          id: `unsubstantiated-${index}`,
          type: 'error',
          message: `Unsubstantiated health claim "${matches[0]}" detected`,
          suggestion: 'Remove or modify this claim to comply with healthcare advertising standards',
          line: getLineNumber(text, matches[0])
        });
      }
    });

    // Check for patient-specific information
    const patientInfo = [
      /patient [a-z]/gi,
      /mr\. [a-z]/gi,
      /mrs\. [a-z]/gi,
      /ms\. [a-z]/gi,
      /dr\. [a-z]/gi,
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      /\b\d{3}-\d{3}-\d{4}\b/g, // Phone pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email pattern
    ];

    patientInfo.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        validationIssues.push({
          id: `patient-info-${index}`,
          type: 'error',
          message: `Potential patient information detected: "${matches[0]}"`,
          suggestion: 'Remove or anonymize patient-specific information to maintain HIPAA compliance',
          line: getLineNumber(text, matches[0])
        });
      }
    });

    // Check for drug names without proper context
    const drugNames = [
      /aspirin/gi,
      /ibuprofen/gi,
      /acetaminophen/gi,
      /metformin/gi,
      /lisinopril/gi,
      /atorvastatin/gi,
      /omeprazole/gi,
      /levothyroxine/gi
    ];

    drugNames.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        const hasDisclaimer = /consult.*doctor|physician|healthcare.*provider|medical.*advice/gi.test(text);
        if (!hasDisclaimer) {
          validationIssues.push({
            id: `drug-name-${index}`,
            type: 'warning',
            message: `Drug name "${matches[0]}" mentioned without medical disclaimer`,
            suggestion: 'Add a disclaimer about consulting healthcare providers before taking medications',
            line: getLineNumber(text, matches[0])
          });
        }
      }
    });

    // Check for proper medical terminology
    const informalTerms = [
      { informal: /heart attack/gi, formal: 'myocardial infarction' },
      { informal: /high blood pressure/gi, formal: 'hypertension' },
      { informal: /low blood pressure/gi, formal: 'hypotension' },
      { informal: /stroke/gi, formal: 'cerebrovascular accident' },
      { informal: /cancer/gi, formal: 'malignancy' }
    ];

    informalTerms.forEach((term, index) => {
      const matches = text.match(term.informal);
      if (matches) {
        validationIssues.push({
          id: `terminology-${index}`,
          type: 'info',
          message: `Consider using formal medical terminology: "${term.formal}" instead of "${matches[0]}"`,
          suggestion: 'Use formal medical terminology for professional accuracy',
          line: getLineNumber(text, matches[0])
        });
      }
    });

    // Check for required disclaimers
    const hasDisclaimer = /disclaimer|not.*medical.*advice|consult.*physician|healthcare.*provider/gi.test(text);
    if (!hasDisclaimer && text.length > 200) {
      validationIssues.push({
        id: 'missing-disclaimer',
        type: 'warning',
        message: 'Medical disclaimer not found',
        suggestion: 'Add a disclaimer that this content is not medical advice and readers should consult healthcare providers'
      });
    }

    setIssues(validationIssues);
    onValidationComplete(validationIssues);
    setIsValidating(false);

    logger.info('Healthcare compliance validation completed', { 
      issueCount: validationIssues.length,
      errorCount: validationIssues.filter(i => i.type === 'error').length,
      warningCount: validationIssues.filter(i => i.type === 'warning').length
    });
  };

  const getLineNumber = (text: string, searchTerm: string): number => {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchTerm)) {
        return i + 1;
      }
    }
    return 1;
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.725-1.36 3.49 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Validating healthcare compliance...</span>
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-green-50 border border-green-200 rounded-lg"
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-green-800">
            Content passes healthcare compliance validation
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Compliance Issues ({issues.length})
        </h3>
        <div className="flex space-x-2 text-xs">
          <span className="text-red-600">
            {issues.filter(i => i.type === 'error').length} errors
          </span>
          <span className="text-yellow-600">
            {issues.filter(i => i.type === 'warning').length} warnings
          </span>
          <span className="text-blue-600">
            {issues.filter(i => i.type === 'info').length} suggestions
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {issues.map((issue) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-lg border ${getIssueColor(issue.type)}`}
          >
            <div className="flex items-start space-x-2">
              {getIssueIcon(issue.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {issue.message}
                </p>
                {issue.suggestion && (
                  <p className="text-xs text-gray-600 mt-1">
                    Suggestion: {issue.suggestion}
                  </p>
                )}
                {issue.line && (
                  <p className="text-xs text-gray-500 mt-1">
                    Line {issue.line}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
