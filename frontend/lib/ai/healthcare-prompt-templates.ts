/**
 * Healthcare-Specific Prompt Templates with Medical Validation
 * 
 * Features:
 * - Medical terminology validation
 * - Evidence-based content requirements
 * - HIPAA compliance checks
 * - Tone adjustment for different audiences
 * - Citation requirements
 */

export interface PromptTemplate {
  id: string
  name: string
  category: 'clinical' | 'administrative' | 'patient-education' | 'research' | 'marketing'
  audience: 'healthcare-professionals' | 'administrators' | 'patients' | 'general'
  version: string
  variables: string[]
  template: string
  validationRules: ValidationRule[]
  complianceChecks: ComplianceCheck[]
  performance: {
    avgTokens: number
    successRate: number
    qualityScore: number
  }
}

export interface ValidationRule {
  type: 'medical-accuracy' | 'evidence-based' | 'readability' | 'terminology'
  requirement: string
  validator?: (content: string) => boolean
}

export interface ComplianceCheck {
  type: 'hipaa' | 'medical-advertising' | 'fda' | 'cms'
  requirement: string
  mandatory: boolean
}

export class HealthcarePromptTemplates {
  private templates: Map<string, PromptTemplate> = new Map()
  
  constructor() {
    this.initializeTemplates()
  }

  /**
   * Initialize core healthcare prompt templates
   */
  private initializeTemplates(): void {
    // Clinical Blog Post Template
    this.templates.set('clinical-blog-post', {
      id: 'clinical-blog-post',
      name: 'Clinical Excellence Blog Post',
      category: 'clinical',
      audience: 'healthcare-professionals',
      version: '1.2.0',
      variables: ['topic', 'specialty', 'keywords', 'wordCount', 'tone'],
      template: `
You are a medical content expert writing for healthcare professionals.

Create a comprehensive blog post about: {{topic}}
Medical Specialty: {{specialty}}
Target Keywords: {{keywords}}
Word Count: {{wordCount}}
Tone: {{tone}}

REQUIREMENTS:
1. Evidence-Based Content:
   - Cite at least 5 peer-reviewed studies from the last 5 years
   - Include specific statistics and outcome data
   - Reference clinical guidelines where applicable

2. Medical Accuracy:
   - Use precise medical terminology
   - Include ICD-10/CPT codes where relevant
   - Provide accurate drug names and dosages if mentioned

3. Structure:
   - Executive summary for busy clinicians
   - Clear methodology or approach section
   - Practical implementation guidance
   - Clinical pearls or key takeaways
   - Potential contraindications or limitations

4. Compliance:
   - Avoid definitive medical advice
   - Include appropriate disclaimers
   - Ensure HIPAA compliance (no patient identifiers)

5. Professional Standards:
   - Written at graduate medical education level
   - Include differential diagnoses where relevant
   - Address cost-effectiveness and resource utilization

Format the content with clear H2 and H3 headings for easy scanning.
Include a "Clinical Bottom Line" section summarizing key points.
`,
      validationRules: [
        {
          type: 'medical-accuracy',
          requirement: 'Must use current medical terminology and standards',
          validator: (content) => {
            // Check for medical terminology indicators
            const medicalTerms = ['diagnosis', 'treatment', 'prognosis', 'pathophysiology', 'etiology']
            return medicalTerms.some(term => content.toLowerCase().includes(term))
          }
        },
        {
          type: 'evidence-based',
          requirement: 'Must include citations to peer-reviewed sources',
          validator: (content) => {
            // Check for citation patterns
            const citationPatterns = [/\(\d{4}\)/, /et al\./, /Journal of/, /JAMA/, /NEJM/, /Lancet/]
            return citationPatterns.some(pattern => pattern.test(content))
          }
        }
      ],
      complianceChecks: [
        {
          type: 'hipaa',
          requirement: 'No patient identifiable information',
          mandatory: true
        },
        {
          type: 'medical-advertising',
          requirement: 'Include appropriate medical disclaimers',
          mandatory: true
        }
      ],
      performance: {
        avgTokens: 2500,
        successRate: 0.92,
        qualityScore: 8.5
      }
    })

    // Patient Education Template
    this.templates.set('patient-education', {
      id: 'patient-education',
      name: 'Patient Education Material',
      category: 'patient-education',
      audience: 'patients',
      version: '1.1.0',
      variables: ['condition', 'readingLevel', 'languages', 'culturalContext'],
      template: `
Create patient-friendly educational content about: {{condition}}
Reading Level: {{readingLevel}} (aim for 6th-8th grade)
Cultural Context: {{culturalContext}}

REQUIREMENTS:
1. Clear, Simple Language:
   - Explain medical terms in plain language
   - Use short sentences (15-20 words max)
   - Include analogies and examples
   - Avoid medical jargon without explanation

2. Structured Information:
   - What is this condition?
   - What are the symptoms?
   - How is it diagnosed?
   - What are the treatment options?
   - What can patients do at home?
   - When to seek immediate care (red flags)

3. Empowering Content:
   - Focus on what patients CAN do
   - Include self-management strategies
   - Provide questions to ask their doctor
   - List reliable resources for more information

4. Visual Aids Suggestions:
   - Describe where diagrams would be helpful
   - Suggest infographic opportunities
   - Recommend video content topics

5. Cultural Sensitivity:
   - Consider diverse health beliefs
   - Include culturally appropriate examples
   - Avoid assumptions about family structures
   - Be inclusive of different lifestyles

6. Action Items:
   - Clear next steps
   - Symptom diary template
   - Medication tracking suggestions
   - Follow-up appointment preparation

Include a "Key Points to Remember" box at the end.
Add "Questions for Your Healthcare Provider" section.
`,
      validationRules: [
        {
          type: 'readability',
          requirement: 'Content must be at 6th-8th grade reading level',
          validator: (content) => {
            // Simple check for sentence length
            const sentences = content.split(/[.!?]/)
            const avgWords = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
            return avgWords <= 20
          }
        }
      ],
      complianceChecks: [
        {
          type: 'hipaa',
          requirement: 'Protect patient privacy',
          mandatory: true
        },
        {
          type: 'fda',
          requirement: 'Accurate medication information',
          mandatory: false
        }
      ],
      performance: {
        avgTokens: 1800,
        successRate: 0.95,
        qualityScore: 8.8
      }
    })

    // Healthcare Leadership Template
    this.templates.set('healthcare-leadership', {
      id: 'healthcare-leadership',
      name: 'Healthcare Leadership & Administration',
      category: 'administrative',
      audience: 'administrators',
      version: '1.3.0',
      variables: ['topic', 'organizationType', 'metrics', 'challenges'],
      template: `
Create executive-level content for healthcare leaders about: {{topic}}
Organization Type: {{organizationType}}
Key Metrics: {{metrics}}
Current Challenges: {{challenges}}

REQUIREMENTS:
1. Strategic Focus:
   - Link to organizational mission and vision
   - Address Triple/Quadruple Aim objectives
   - Include ROI and business case elements
   - Reference industry benchmarks and standards

2. Data-Driven Insights:
   - Cite relevant healthcare analytics
   - Include performance metrics and KPIs
   - Reference CMS quality measures where applicable
   - Provide comparative effectiveness data

3. Operational Excellence:
   - Process improvement methodologies (Lean, Six Sigma)
   - Change management strategies
   - Workforce optimization approaches
   - Technology integration considerations

4. Regulatory Compliance:
   - Medicare/Medicaid requirements
   - Joint Commission standards
   - State regulations
   - Value-based care implications

5. Financial Sustainability:
   - Revenue cycle optimization
   - Cost reduction strategies
   - Payer mix considerations
   - Capital investment planning

6. Stakeholder Engagement:
   - Board communication strategies
   - Physician alignment approaches
   - Community partnership opportunities
   - Patient experience initiatives

Format with executive summary, detailed analysis, and actionable recommendations.
Include implementation roadmap with timeline and resource requirements.
`,
      validationRules: [
        {
          type: 'evidence-based',
          requirement: 'Include industry data and benchmarks',
          validator: (content) => content.includes('benchmark') || content.includes('industry standard')
        }
      ],
      complianceChecks: [
        {
          type: 'cms',
          requirement: 'Align with CMS quality measures',
          mandatory: false
        }
      ],
      performance: {
        avgTokens: 2200,
        successRate: 0.90,
        qualityScore: 8.7
      }
    })

    // Clinical Research Template
    this.templates.set('clinical-research', {
      id: 'clinical-research',
      name: 'Clinical Research & Evidence Summary',
      category: 'research',
      audience: 'healthcare-professionals',
      version: '1.0.0',
      variables: ['studyTopic', 'methodology', 'population', 'outcomes'],
      template: `
Synthesize clinical research on: {{studyTopic}}
Methodology Focus: {{methodology}}
Population: {{population}}
Primary Outcomes: {{outcomes}}

REQUIREMENTS:
1. Systematic Review Approach:
   - Search strategy and databases
   - Inclusion/exclusion criteria
   - Quality assessment methods (GRADE, Cochrane)
   - Statistical analysis approach

2. Evidence Synthesis:
   - Study characteristics table
   - Forest plots description (if meta-analysis)
   - Heterogeneity assessment
   - Subgroup analyses

3. Clinical Implications:
   - Strength of recommendations
   - Practice-changing findings
   - Knowledge gaps identified
   - Future research directions

4. Critical Appraisal:
   - Risk of bias assessment
   - Generalizability considerations
   - Limitations and caveats
   - Conflicting evidence discussion

5. Practical Application:
   - Clinical decision support
   - Implementation barriers
   - Cost-effectiveness considerations
   - Patient preference factors

Format as structured abstract with PICO framework.
Include evidence quality ratings and recommendation strength.
`,
      validationRules: [
        {
          type: 'medical-accuracy',
          requirement: 'Accurate representation of research findings'
        },
        {
          type: 'evidence-based',
          requirement: 'Proper citation of primary sources'
        }
      ],
      complianceChecks: [
        {
          type: 'hipaa',
          requirement: 'No patient identifiers from studies',
          mandatory: true
        }
      ],
      performance: {
        avgTokens: 2800,
        successRate: 0.88,
        qualityScore: 9.0
      }
    })

    // Healthcare Marketing Template
    this.templates.set('healthcare-marketing', {
      id: 'healthcare-marketing',
      name: 'Healthcare Marketing Content',
      category: 'marketing',
      audience: 'general',
      version: '1.2.0',
      variables: ['service', 'targetAudience', 'callToAction', 'brandVoice'],
      template: `
Create marketing content for healthcare service: {{service}}
Target Audience: {{targetAudience}}
Call to Action: {{callToAction}}
Brand Voice: {{brandVoice}}

REQUIREMENTS:
1. Trust Building:
   - Highlight credentials and accreditations
   - Include patient success metrics (anonymized)
   - Reference quality awards and recognitions
   - Emphasize experience and expertise

2. Patient-Centered Messaging:
   - Focus on patient outcomes and benefits
   - Address common concerns and fears
   - Highlight convenience and accessibility
   - Include patient testimonial themes

3. Differentiation:
   - Unique value propositions
   - Advanced technology and techniques
   - Specialized expertise
   - Comprehensive care approach

4. Compliance Requirements:
   - No guaranteed outcomes
   - Appropriate medical disclaimers
   - HIPAA-compliant examples
   - FTC truth-in-advertising standards

5. SEO Optimization:
   - Local search optimization
   - Service-specific keywords
   - Location-based content
   - Schema markup suggestions

6. Multi-Channel Adaptation:
   - Website content version
   - Social media snippets
   - Email campaign elements
   - Print material considerations

Include clear CTAs and contact information placement.
Ensure ADA compliance for web content.
`,
      validationRules: [
        {
          type: 'readability',
          requirement: 'Accessible to general public'
        },
        {
          type: 'terminology',
          requirement: 'Medical terms explained in lay language'
        }
      ],
      complianceChecks: [
        {
          type: 'medical-advertising',
          requirement: 'FTC and state medical board compliance',
          mandatory: true
        },
        {
          type: 'hipaa',
          requirement: 'Patient privacy protection',
          mandatory: true
        }
      ],
      performance: {
        avgTokens: 1600,
        successRate: 0.93,
        qualityScore: 8.4
      }
    })
  }

  /**
   * Get template by ID with variable substitution
   */
  getTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    let prompt = template.template
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    return prompt
  }

  /**
   * Get all templates for a category
   */
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category)
  }

  /**
   * Get template with validation rules
   */
  getTemplateWithValidation(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId)
  }

  /**
   * Update template performance metrics
   */
  updateTemplateMetrics(
    templateId: string, 
    metrics: Partial<PromptTemplate['performance']>
  ): void {
    const template = this.templates.get(templateId)
    if (template) {
      template.performance = { ...template.performance, ...metrics }
    }
  }

  /**
   * Get best performing template for a category
   */
  getBestTemplate(category: PromptTemplate['category']): PromptTemplate | null {
    const categoryTemplates = this.getTemplatesByCategory(category)
    if (categoryTemplates.length === 0) return null

    return categoryTemplates.reduce((best, current) => 
      current.performance.qualityScore > best.performance.qualityScore ? current : best
    )
  }

  /**
   * Validate content against template rules
   */
  validateContent(templateId: string, content: string): {
    valid: boolean
    violations: string[]
  } {
    const template = this.templates.get(templateId)
    if (!template) {
      return { valid: false, violations: ['Template not found'] }
    }

    const violations: string[] = []

    for (const rule of template.validationRules) {
      if (rule.validator && !rule.validator(content)) {
        violations.push(rule.requirement)
      }
    }

    return {
      valid: violations.length === 0,
      violations
    }
  }

  /**
   * Check compliance requirements
   */
  checkCompliance(templateId: string, content: string): {
    compliant: boolean
    issues: string[]
    warnings: string[]
  } {
    const template = this.templates.get(templateId)
    if (!template) {
      return { compliant: false, issues: ['Template not found'], warnings: [] }
    }

    const issues: string[] = []
    const warnings: string[] = []

    // Check for potential HIPAA violations
    const hipaaPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Z][a-z]+ [A-Z][a-z]+, \d{2} years old\b/, // Patient identifiers
      /MRN[:\s]*\d+/, // Medical record numbers
    ]

    for (const pattern of hipaaPatterns) {
      if (pattern.test(content)) {
        issues.push('Potential HIPAA violation: possible patient identifier detected')
      }
    }

    // Check for medical claims compliance
    const prohibitedClaims = [
      /guaranteed/i,
      /cure/i,
      /100%\s*effective/i,
      /no\s*risk/i,
    ]

    for (const pattern of prohibitedClaims) {
      if (pattern.test(content)) {
        warnings.push('Potential compliance issue: avoid absolute medical claims')
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      warnings
    }
  }

  /**
   * Generate A/B test variant
   */
  generateVariant(templateId: string, variantType: 'tone' | 'structure' | 'length'): string {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    let variantPrompt = template.template

    switch (variantType) {
      case 'tone':
        variantPrompt = variantPrompt.replace(
          /Tone: {{tone}}/g,
          'Tone: {{tone}} (Variant: More conversational and empathetic)'
        )
        break
      case 'structure':
        variantPrompt = variantPrompt.replace(
          /Format the content/g,
          'Format the content with numbered sections and bullet points'
        )
        break
      case 'length':
        variantPrompt = variantPrompt.replace(
          /Word Count: {{wordCount}}/g,
          'Word Count: {{wordCount}} (Variant: Concise version, 30% shorter)'
        )
        break
    }

    return variantPrompt
  }
}

// Export singleton instance
export const healthcarePrompts = new HealthcarePromptTemplates()