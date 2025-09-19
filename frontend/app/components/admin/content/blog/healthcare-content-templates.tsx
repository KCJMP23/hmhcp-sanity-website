'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('HealthcareContentTemplates');

interface HealthcareContentTemplatesProps {
  onTemplateSelect: (template: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const healthcareTemplates = [
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Template for presenting patient cases and clinical outcomes',
    content: `# Case Study: [Condition Name]

## Patient Presentation
- **Age**: [Age]
- **Gender**: [Gender]
- **Chief Complaint**: [Primary concern]
- **History of Present Illness**: [Detailed history]

## Clinical Assessment
- **Physical Examination**: [Findings]
- **Diagnostic Tests**: [Results]
- **Differential Diagnosis**: [Considerations]

## Treatment Plan
- **Primary Treatment**: [Main approach]
- **Supportive Care**: [Additional measures]
- **Follow-up**: [Monitoring plan]

## Outcome
- **Results**: [Treatment outcomes]
- **Lessons Learned**: [Key takeaways]
- **References**: [Supporting literature]`
  },
  {
    id: 'research-review',
    name: 'Research Review',
    description: 'Template for reviewing medical research and studies',
    content: `# Research Review: [Study Title]

## Study Overview
- **Authors**: [Author names]
- **Journal**: [Publication details]
- **Year**: [Publication year]
- **Study Type**: [Randomized controlled trial, cohort study, etc.]

## Methodology
- **Study Design**: [Research design]
- **Participants**: [Sample size and characteristics]
- **Intervention**: [Treatment or intervention]
- **Outcomes**: [Primary and secondary endpoints]

## Key Findings
- **Primary Results**: [Main findings]
- **Secondary Results**: [Additional findings]
- **Statistical Significance**: [P-values and confidence intervals]

## Clinical Implications
- **Practice Changes**: [How this affects clinical practice]
- **Limitations**: [Study limitations]
- **Future Research**: [Areas for further investigation]

## Conclusion
[Summary of key points and recommendations]`
  },
  {
    id: 'clinical-guideline',
    name: 'Clinical Guideline',
    description: 'Template for presenting clinical guidelines and protocols',
    content: `# Clinical Guideline: [Guideline Name]

## Scope and Purpose
- **Target Population**: [Who this applies to]
- **Clinical Question**: [What this addresses]
- **Guideline Objectives**: [Goals and outcomes]

## Recommendations
### Strong Recommendations
- [Recommendation 1]
- [Recommendation 2]

### Conditional Recommendations
- [Recommendation 3]
- [Recommendation 4]

## Evidence Base
- **Quality of Evidence**: [GRADE assessment]
- **Strength of Recommendation**: [Strong/Weak]
- **Key Studies**: [Supporting evidence]

## Implementation
- **Barriers**: [Potential challenges]
- **Facilitators**: [Supporting factors]
- **Monitoring**: [Quality measures]

## References
[Supporting literature and guidelines]`
  },
  {
    id: 'patient-education',
    name: 'Patient Education',
    description: 'Template for patient-facing educational content',
    content: `# Understanding [Condition/Topic]

## What is [Condition]?
[Simple explanation of the condition]

## Common Symptoms
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

## When to See a Doctor
[Warning signs and red flags]

## Treatment Options
### Medical Treatments
- [Treatment 1]
- [Treatment 2]

### Lifestyle Changes
- [Lifestyle modification 1]
- [Lifestyle modification 2]

## Living with [Condition]
[Daily management tips and strategies]

## Questions to Ask Your Doctor
- [Question 1]
- [Question 2]
- [Question 3]

## Resources
[Helpful links and support groups]`
  },
  {
    id: 'technology-review',
    name: 'Technology Review',
    description: 'Template for reviewing healthcare technology and innovations',
    content: `# Technology Review: [Technology Name]

## Overview
- **Technology Type**: [Category of technology]
- **Developer**: [Company or organization]
- **FDA Status**: [Approval status]
- **Target Use Case**: [Primary application]

## Technical Specifications
- **Key Features**: [Main capabilities]
- **Integration**: [How it connects with existing systems]
- **Data Requirements**: [Data needs and formats]

## Clinical Evidence
- **Studies**: [Supporting research]
- **Outcomes**: [Clinical results]
- **Safety Profile**: [Adverse events and risks]

## Implementation Considerations
- **Cost**: [Financial considerations]
- **Training**: [Staff education needs]
- **Infrastructure**: [Technical requirements]

## Future Outlook
[Potential developments and trends]

## References
[Supporting documentation]`
  }
];

export function HealthcareContentTemplates({
  onTemplateSelect,
  isOpen,
  onClose
}: HealthcareContentTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    const template = healthcareTemplates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template.content);
      logger.info('Healthcare template selected', { templateId, templateName: template.name });
    }
    onClose();
  };

  const handlePreview = (templateId: string) => {
    setSelectedTemplate(selectedTemplate === templateId ? null : templateId);
    logger.debug('Template preview toggled', { templateId });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Healthcare Content Templates
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthcareTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ y: -2 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(template.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedTemplate === template.id ? 'Hide Preview' : 'Preview'}
                        </button>
                        <button
                          onClick={() => handleTemplateSelect(template.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {template.description}
                    </p>

                    <AnimatePresence>
                      {selectedTemplate === template.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-gray-50 rounded border"
                        >
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                            {template.content}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
