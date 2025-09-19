/**
 * Healthcare-Specific Prompt Templates
 * Evidence-based, compliant, and optimized for medical content generation
 */

export interface PromptTemplate {
  id: string
  name: string
  category: 'clinical' | 'administrative' | 'patient-education' | 'research' | 'marketing'
  version: string
  template: string
  variables: string[]
  complianceLevel: 'hipaa' | 'fda' | 'general'
  validationRules: ValidationRule[]
  qualityMetrics: QualityMetric[]
  tokenEstimate: number
}

export interface ValidationRule {
  type: 'medical-accuracy' | 'compliance' | 'readability' | 'citation' | 'disclaimer'
  check: (content: string) => boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface QualityMetric {
  name: string
  minScore: number
  maxScore: number
  weight: number
}

export interface PromptVersion {
  id: string
  templateId: string
  version: string
  content: string
  performance: {
    usageCount: number
    successRate: number
    averageQualityScore: number
    averageTokens: number
    averageCost: number
  }
  createdAt: Date
  status: 'active' | 'testing' | 'archived'
}

/**
 * Healthcare Blog Post Generation Template
 */
export const HEALTHCARE_BLOG_TEMPLATE: PromptTemplate = {
  id: 'healthcare-blog-v2',
  name: 'Healthcare Blog Post Generator',
  category: 'clinical',
  version: '2.0.0',
  template: `
As a healthcare content specialist with expertise in {{specialty}}, create a comprehensive blog post on: "{{title}}"

CONTENT REQUIREMENTS:
- Target Audience: {{audience}}
- Reading Level: {{readingLevel}} (Flesch-Kincaid score: {{fleschScore}})
- Word Count: {{minWords}}-{{maxWords}} words
- Tone: {{tone}}
- Compliance: {{complianceRequirements}}

STRUCTURE:
1. INTRODUCTION ({{introWords}} words)
   - Hook with relevant statistic or patient story
   - Clear value proposition
   - Preview of key topics

2. MAIN CONTENT
   {{#sections}}
   Section {{index}}: {{sectionTitle}} ({{sectionWords}} words)
   - Key Point: {{keyPoint}}
   - Evidence: {{evidenceRequirement}}
   - Practical Application: {{practicalExample}}
   {{/sections}}

3. CLINICAL EVIDENCE
   - Cite at least {{minCitations}} peer-reviewed sources (2020 or newer)
   - Include relevant statistics and outcomes data
   - Reference clinical guidelines when applicable

4. PRACTICAL IMPLEMENTATION
   - Step-by-step guidance for {{implementationContext}}
   - Common challenges and solutions
   - Resource requirements and timeline

5. KEY TAKEAWAYS
   - {{takeawayCount}} actionable insights
   - Clear next steps for readers
   - Links to additional resources

6. COMPLIANCE & DISCLAIMERS
   - {{disclaimerType}} disclaimer
   - Privacy considerations if discussing patient data
   - Regulatory compliance statements as needed

QUALITY REQUIREMENTS:
- Medical Accuracy: All clinical information must be evidence-based
- Readability: {{readabilityTarget}}
- SEO: Include keywords: {{keywords}}
- Engagement: Include {{callToActionCount}} calls-to-action
- Accessibility: Use clear headings and bullet points

AVOID:
- Unsubstantiated medical claims
- Patient-identifiable information
- Outdated clinical practices
- Complex medical jargon without explanation
- Promotional language that violates {{regulatoryStandard}}

Generate the content with proper markdown formatting, including H2 and H3 headings.`,
  variables: [
    'specialty', 'title', 'audience', 'readingLevel', 'fleschScore',
    'minWords', 'maxWords', 'tone', 'complianceRequirements',
    'introWords', 'sections', 'minCitations', 'implementationContext',
    'takeawayCount', 'disclaimerType', 'readabilityTarget', 'keywords',
    'callToActionCount', 'regulatoryStandard'
  ],
  complianceLevel: 'hipaa',
  validationRules: [
    {
      type: 'medical-accuracy',
      check: (content: string) => {
        // Check for presence of citations
        const citationPattern = /\[\d+\]|\([\w\s,]+,?\s*\d{4}\)/g
        const citations = content.match(citationPattern)
        return citations !== null && citations.length >= 3
      },
      message: 'Content must include at least 3 citations',
      severity: 'error'
    },
    {
      type: 'disclaimer',
      check: (content: string) => {
        const disclaimerKeywords = [
          'medical advice', 'consult', 'healthcare provider',
          'professional', 'disclaimer', 'educational purposes'
        ]
        return disclaimerKeywords.some(keyword => 
          content.toLowerCase().includes(keyword)
        )
      },
      message: 'Content must include medical disclaimer',
      severity: 'error'
    },
    {
      type: 'readability',
      check: (content: string) => {
        // Simple check for sentence length
        const sentences = content.split(/[.!?]+/)
        const avgWords = sentences.reduce((acc, s) => 
          acc + s.trim().split(/\s+/).length, 0) / sentences.length
        return avgWords < 20 // Average sentence should be under 20 words
      },
      message: 'Content readability should be appropriate for target audience',
      severity: 'warning'
    }
  ],
  qualityMetrics: [
    { name: 'accuracy', minScore: 0, maxScore: 10, weight: 0.3 },
    { name: 'readability', minScore: 0, maxScore: 10, weight: 0.2 },
    { name: 'engagement', minScore: 0, maxScore: 10, weight: 0.2 },
    { name: 'compliance', minScore: 0, maxScore: 10, weight: 0.2 },
    { name: 'seo', minScore: 0, maxScore: 10, weight: 0.1 }
  ],
  tokenEstimate: 2000
}

/**
 * Patient Education Template
 */
export const PATIENT_EDUCATION_TEMPLATE: PromptTemplate = {
  id: 'patient-education-v1',
  name: 'Patient Education Material Generator',
  category: 'patient-education',
  version: '1.0.0',
  template: `
Create patient-friendly educational content about: "{{condition}}"

PATIENT PROFILE:
- Health Literacy Level: {{literacyLevel}}
- Primary Language: {{language}}
- Age Group: {{ageGroup}}
- Cultural Considerations: {{culturalFactors}}

CONTENT STRUCTURE:

1. WHAT IS {{condition}}?
   - Simple, clear definition
   - Common misconceptions addressed
   - Visual analogies when helpful

2. SYMPTOMS & SIGNS
   - Common symptoms in plain language
   - When to seek medical care
   - Red flag symptoms requiring immediate attention

3. CAUSES & RISK FACTORS
   - Understandable explanation of causes
   - Modifiable vs non-modifiable risk factors
   - Prevention strategies

4. DIAGNOSIS & TESTS
   - What to expect during medical visits
   - Common diagnostic procedures explained
   - Questions to ask your healthcare provider

5. TREATMENT OPTIONS
   - Available treatments in simple terms
   - Benefits and potential side effects
   - Lifestyle modifications
   - Importance of medication adherence

6. LIVING WITH {{condition}}
   - Daily management tips
   - Support resources
   - Quality of life considerations
   - Family/caregiver information

7. QUESTIONS FOR YOUR DOCTOR
   - {{questionCount}} important questions to ask
   - How to prepare for appointments
   - Tracking symptoms and progress

REQUIREMENTS:
- Reading Level: {{targetGradeLevel}} grade
- Use everyday language, avoid medical jargon
- Include {{visualCount}} suggestions for helpful visuals/infographics
- Cultural sensitivity for {{culturalContext}}
- Empathetic, supportive tone
- Action-oriented advice

MUST INCLUDE:
- Clear medical disclaimer
- Emergency contact information
- Trusted resource links
- Last reviewed date placeholder`,
  variables: [
    'condition', 'literacyLevel', 'language', 'ageGroup', 'culturalFactors',
    'questionCount', 'targetGradeLevel', 'visualCount', 'culturalContext'
  ],
  complianceLevel: 'general',
  validationRules: [
    {
      type: 'readability',
      check: (content: string) => {
        // Check for simple language
        const complexWords = /\b\w{12,}\b/g
        const matches = content.match(complexWords)
        return !matches || matches.length < 10
      },
      message: 'Content should use simple, patient-friendly language',
      severity: 'warning'
    }
  ],
  qualityMetrics: [
    { name: 'clarity', minScore: 0, maxScore: 10, weight: 0.4 },
    { name: 'completeness', minScore: 0, maxScore: 10, weight: 0.3 },
    { name: 'empathy', minScore: 0, maxScore: 10, weight: 0.2 },
    { name: 'actionability', minScore: 0, maxScore: 10, weight: 0.1 }
  ],
  tokenEstimate: 1500
}

/**
 * Clinical Case Study Template
 */
export const CASE_STUDY_TEMPLATE: PromptTemplate = {
  id: 'case-study-v1',
  name: 'Clinical Case Study Generator',
  category: 'clinical',
  version: '1.0.0',
  template: `
Develop a detailed clinical case study for: "{{studyTitle}}"

CASE OVERVIEW:
- Setting: {{clinicalSetting}}
- Specialty: {{medicalSpecialty}}
- Focus: {{primaryFocus}}
- Outcome Type: {{outcomeMetric}}

CASE STRUCTURE:

1. EXECUTIVE SUMMARY
   - Brief overview of the case
   - Key challenges addressed
   - Primary outcomes achieved
   - Implications for practice

2. BACKGROUND
   - Patient/Organization profile (de-identified)
   - Initial presentation/problem
   - Relevant history and context
   - Baseline metrics: {{baselineMetrics}}

3. INTERVENTION/APPROACH
   - Detailed methodology
   - Clinical protocols implemented
   - Technology/tools utilized
   - Timeline of implementation
   - Multidisciplinary team involvement

4. RESULTS
   - Quantitative outcomes: {{quantitativeMetrics}}
   - Qualitative improvements
   - Statistical significance (if applicable)
   - Comparison to benchmarks/standards
   - Patient/stakeholder satisfaction scores

5. CHALLENGES & SOLUTIONS
   - Obstacles encountered
   - Adaptive strategies employed
   - Lessons learned
   - Resource considerations

6. DISCUSSION
   - Clinical significance
   - Comparison with existing literature
   - Generalizability of findings
   - Cost-effectiveness analysis
   - Quality improvement implications

7. RECOMMENDATIONS
   - Best practices identified
   - Implementation guidelines
   - Scalability considerations
   - Future research directions

8. CONCLUSIONS
   - Key takeaways
   - Impact on patient care
   - Organizational benefits
   - Contribution to field

COMPLIANCE REQUIREMENTS:
- HIPAA compliant (all PHI removed)
- IRB considerations noted
- Ethical guidelines followed
- Patient consent (if applicable)

EVIDENCE REQUIREMENTS:
- Minimum {{citationCount}} peer-reviewed references
- Include relevant clinical guidelines
- Statistical methods clearly described
- Data visualization suggestions

OUTPUT FORMAT:
- Professional medical writing style
- Clear section headings
- Tables/figures descriptions where appropriate
- Proper medical terminology with explanations`,
  variables: [
    'studyTitle', 'clinicalSetting', 'medicalSpecialty', 'primaryFocus',
    'outcomeMetric', 'baselineMetrics', 'quantitativeMetrics', 'citationCount'
  ],
  complianceLevel: 'hipaa',
  validationRules: [
    {
      type: 'compliance',
      check: (content: string) => {
        // Check for potential PHI
        const phiPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b[A-Z][a-z]+\s[A-Z][a-z]+,?\s(Mr\.|Mrs\.|Ms\.|Dr\.)/,
          /\b\d{2}\/\d{2}\/\d{4}\b/, // Dates
          /\b\d+\syears?\sold\b/i // Age over 89
        ]
        return !phiPatterns.some(pattern => pattern.test(content))
      },
      message: 'Content must not contain identifiable patient information',
      severity: 'error'
    }
  ],
  qualityMetrics: [
    { name: 'clinical-rigor', minScore: 0, maxScore: 10, weight: 0.35 },
    { name: 'evidence-quality', minScore: 0, maxScore: 10, weight: 0.25 },
    { name: 'practical-value', minScore: 0, maxScore: 10, weight: 0.25 },
    { name: 'clarity', minScore: 0, maxScore: 10, weight: 0.15 }
  ],
  tokenEstimate: 2500
}

/**
 * Healthcare White Paper Template
 */
export const WHITE_PAPER_TEMPLATE: PromptTemplate = {
  id: 'white-paper-v1',
  name: 'Healthcare White Paper Generator',
  category: 'research',
  version: '1.0.0',
  template: `
Create a comprehensive white paper on: "{{topic}}"

WHITE PAPER SPECIFICATIONS:
- Industry Focus: {{industryFocus}}
- Target Audience: {{targetAudience}}
- Length: {{pageCount}} pages (~{{wordCount}} words)
- Perspective: {{perspective}}

EXECUTIVE SUMMARY ({{execSummaryWords}} words)
- Problem statement
- Solution overview
- Key findings
- ROI/Value proposition
- Call to action

SECTIONS:

1. INTRODUCTION
   - Current state of {{industryContext}}
   - Market drivers and challenges
   - Purpose and scope of paper
   - Methodology overview

2. PROBLEM ANALYSIS
   - Detailed problem description
   - Impact on stakeholders
   - Cost of inaction
   - Root cause analysis
   - Industry benchmarks

3. LITERATURE REVIEW
   - Current research findings
   - Best practices analysis
   - Technology landscape
   - Regulatory considerations
   - Gap analysis

4. PROPOSED SOLUTION
   - Solution framework
   - Implementation methodology
   - Technology requirements
   - Stakeholder roles
   - Timeline and milestones

5. EVIDENCE & VALIDATION
   - Case studies ({{caseStudyCount}})
   - Pilot program results
   - Statistical analysis
   - ROI calculations
   - Risk assessment

6. IMPLEMENTATION GUIDE
   - Phase-by-phase approach
   - Resource requirements
   - Change management strategy
   - Success metrics
   - Common pitfalls to avoid

7. FUTURE IMPLICATIONS
   - Industry trends
   - Emerging technologies
   - Policy considerations
   - Scalability potential
   - Long-term vision

8. CONCLUSIONS & RECOMMENDATIONS
   - Key findings summary
   - Strategic recommendations
   - Next steps
   - Call to action

QUALITY REQUIREMENTS:
- Original research/insights
- {{minDataPoints}} supporting data points
- {{minReferences}} authoritative references
- Professional graphics suggestions
- Thought leadership positioning

COMPLIANCE:
- Industry standards adherence
- Regulatory alignment
- Ethical considerations
- Data privacy compliance`,
  variables: [
    'topic', 'industryFocus', 'targetAudience', 'pageCount', 'wordCount',
    'perspective', 'execSummaryWords', 'industryContext', 'caseStudyCount',
    'minDataPoints', 'minReferences'
  ],
  complianceLevel: 'general',
  validationRules: [
    {
      type: 'citation',
      check: (content: string) => {
        const references = content.match(/\[\d+\]/g)
        return references !== null && references.length >= 15
      },
      message: 'White paper must include at least 15 references',
      severity: 'error'
    }
  ],
  qualityMetrics: [
    { name: 'research-depth', minScore: 0, maxScore: 10, weight: 0.3 },
    { name: 'innovation', minScore: 0, maxScore: 10, weight: 0.25 },
    { name: 'practicality', minScore: 0, maxScore: 10, weight: 0.25 },
    { name: 'authority', minScore: 0, maxScore: 10, weight: 0.2 }
  ],
  tokenEstimate: 4000
}

/**
 * Template Registry
 */
export const PROMPT_TEMPLATES = new Map<string, PromptTemplate>([
  ['healthcare-blog', HEALTHCARE_BLOG_TEMPLATE],
  ['patient-education', PATIENT_EDUCATION_TEMPLATE],
  ['case-study', CASE_STUDY_TEMPLATE],
  ['white-paper', WHITE_PAPER_TEMPLATE]
])

/**
 * Get template by ID with variable substitution
 */
export function getPromptTemplate(
  templateId: string,
  variables: Record<string, any>
): string {
  const template = PROMPT_TEMPLATES.get(templateId)
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  let prompt = template.template
  
  // Simple variable substitution
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    prompt = prompt.replace(regex, String(value))
  }
  
  // Handle sections (for blog template)
  if (variables.sections && Array.isArray(variables.sections)) {
    const sectionPattern = /{{#sections}}([\s\S]*?){{\/sections}}/
    const sectionMatch = prompt.match(sectionPattern)
    
    if (sectionMatch) {
      const sectionTemplate = sectionMatch[1]
      const sectionContent = variables.sections.map((section: any, index: number) => {
        let content = sectionTemplate
        content = content.replace(/{{index}}/g, String(index + 1))
        for (const [key, value] of Object.entries(section)) {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        }
        return content
      }).join('\n')
      
      prompt = prompt.replace(sectionPattern, sectionContent)
    }
  }
  
  return prompt
}

/**
 * Validate generated content against template rules
 */
export function validateContent(
  content: string,
  templateId: string
): { valid: boolean; errors: string[]; warnings: string[] } {
  const template = PROMPT_TEMPLATES.get(templateId)
  if (!template) {
    return { valid: false, errors: [`Template ${templateId} not found`], warnings: [] }
  }

  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of template.validationRules) {
    if (!rule.check(content)) {
      if (rule.severity === 'error') {
        errors.push(rule.message)
      } else if (rule.severity === 'warning') {
        warnings.push(rule.message)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate quality score for generated content
 */
export function calculateQualityScore(
  content: string,
  templateId: string,
  metrics: Record<string, number>
): number {
  const template = PROMPT_TEMPLATES.get(templateId)
  if (!template) return 0

  let totalScore = 0
  let totalWeight = 0

  for (const metric of template.qualityMetrics) {
    const score = metrics[metric.name] || 0
    const normalizedScore = Math.min(Math.max(score, metric.minScore), metric.maxScore)
    totalScore += normalizedScore * metric.weight
    totalWeight += metric.weight
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0
}

/**
 * Get estimated token count for a template
 */
export function estimateTokens(
  templateId: string,
  variables: Record<string, any>
): number {
  const template = PROMPT_TEMPLATES.get(templateId)
  if (!template) return 0

  // Base estimate from template
  let estimate = template.tokenEstimate

  // Adjust based on word count if provided
  if (variables.minWords && variables.maxWords) {
    const avgWords = (variables.minWords + variables.maxWords) / 2
    // Rough estimate: 1 word ≈ 1.3 tokens
    estimate = Math.ceil(avgWords * 1.3)
  }

  // Add buffer for variable expansion
  estimate = Math.ceil(estimate * 1.1)

  return estimate
}