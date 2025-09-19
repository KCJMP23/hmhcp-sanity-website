// BMAD Method AI Agent Router for Healthcare Content Management
// Routes different content types to appropriate BMAD agents

import { AIGenerationRequest, AIGenerationResponse } from '@/lib/types/cms-types'
import { logger } from '@/lib/logger'

export interface BMADAgentConfig {
  name: string
  description: string
  capabilities: string[]
  content_types: string[]
  healthcare_compliant: boolean
}

// BMAD Agent Configurations
export const BMAD_AGENTS: Record<string, BMADAgentConfig> = {
  'creative-writing-studio': {
    name: 'Creative Writing Studio',
    description: 'Healthcare-compliant content creation with medical accuracy',
    capabilities: [
      'Blog post writing',
      'Marketing copy',
      'Patient education materials',
      'Clinical content',
      'Website copy',
      'Email campaigns'
    ],
    content_types: [
      'blog-post',
      'hero-section',
      'service-description',
      'platform-description',
      'testimonial',
      'case-study',
      'newsletter'
    ],
    healthcare_compliant: true
  },
  'web-growth-pack': {
    name: 'Web Growth Pack',
    description: 'Healthcare marketing optimization with SEO and conversion focus',
    capabilities: [
      'SEO optimization',
      'Conversion rate optimization',
      'A/B testing strategies',
      'Landing page optimization',
      'Meta descriptions and titles',
      'Content performance analysis'
    ],
    content_types: [
      'seo-meta',
      'landing-page',
      'cta-section',
      'homepage-hero',
      'platform-feature',
      'service-category'
    ],
    healthcare_compliant: true
  },
  'healthcare-compliance-auditor': {
    name: 'Healthcare Compliance Auditor',
    description: 'HIPAA, FDA, and medical compliance verification',
    capabilities: [
      'HIPAA compliance review',
      'FDA regulatory compliance',
      'Medical accuracy verification',
      'Legal disclaimer review',
      'Privacy policy compliance',
      'Accessibility compliance (WCAG)'
    ],
    content_types: [
      'clinical-content',
      'research-publication',
      'medical-claim',
      'privacy-policy',
      'terms-of-service',
      'patient-information'
    ],
    healthcare_compliant: true
  },
  'infrastructure-devops': {
    name: 'Infrastructure DevOps',
    description: 'Technical documentation and system architecture content',
    capabilities: [
      'API documentation',
      'Technical specifications',
      'Integration guides',
      'Security documentation',
      'System architecture',
      'Developer resources'
    ],
    content_types: [
      'api-documentation',
      'integration-guide',
      'technical-specification',
      'security-policy',
      'developer-guide',
      'platform-architecture'
    ],
    healthcare_compliant: true
  }
}

// Content Type to Agent Mapping
const CONTENT_TYPE_ROUTING: Record<string, string[]> = {
  'homepage-hero': ['creative-writing-studio', 'web-growth-pack'],
  'blog-post': ['creative-writing-studio', 'healthcare-compliance-auditor'],
  'service-description': ['creative-writing-studio', 'web-growth-pack'],
  'platform-feature': ['creative-writing-studio', 'web-growth-pack'],
  'research-publication': ['creative-writing-studio', 'healthcare-compliance-auditor'],
  'clinical-content': ['creative-writing-studio', 'healthcare-compliance-auditor'],
  'cta-section': ['creative-writing-studio', 'web-growth-pack'],
  'testimonial': ['creative-writing-studio'],
  'case-study': ['creative-writing-studio', 'healthcare-compliance-auditor'],
  'seo-meta': ['web-growth-pack'],
  'privacy-policy': ['healthcare-compliance-auditor'],
  'api-documentation': ['infrastructure-devops'],
  'integration-guide': ['infrastructure-devops'],
  'patient-education': ['creative-writing-studio', 'healthcare-compliance-auditor'],
  'medical-claim': ['healthcare-compliance-auditor']
}

// Priority routing based on content type
export function getRecommendedAgents(contentType: string): string[] {
  return CONTENT_TYPE_ROUTING[contentType] || ['creative-writing-studio']
}

export function getPrimaryAgent(contentType: string): string {
  const agents = getRecommendedAgents(contentType)
  return agents[0]
}

// Generate context-aware prompts for different content types
export function generateBMADPrompt(request: AIGenerationRequest): string {
  const baseContext = `
    Context: Healthcare technology website (HMHCP - HM Healthcare Partners)
    Company Focus: Clinical research, healthcare technology platforms, regulatory consulting
    Target Audience: Healthcare professionals, researchers, pharmaceutical companies
    Compliance Requirements: HIPAA compliant, FDA aware, medically accurate
    Brand Voice: Professional, trustworthy, innovative, patient-focused
  `

  const contentTypePrompts: Record<string, string> = {
    'homepage-hero': `
      Create compelling homepage hero content that:
      - Immediately communicates HMHCP's value proposition
      - Appeals to healthcare decision-makers
      - Emphasizes clinical research excellence and technology innovation
      - Includes strong, actionable CTAs
      - Maintains professional medical tone
      - Highlights key differentiators (BMAD Method, regulatory expertise, platform integration)
    `,
    
    'blog-post': `
      Write a healthcare blog post that:
      - Provides valuable insights for healthcare professionals
      - Cites credible medical sources and research
      - Maintains HIPAA compliance (no patient-specific information)
      - Uses evidence-based claims only
      - Includes actionable takeaways
      - Optimizes for healthcare keywords
      - Follows medical writing best practices
    `,
    
    'service-description': `
      Create service descriptions that:
      - Clearly explain healthcare service benefits
      - Address specific pain points in healthcare/clinical research
      - Demonstrate ROI and outcomes
      - Include compliance and regulatory considerations
      - Appeal to healthcare decision-makers
      - Differentiate from competitors
      - Include relevant healthcare terminology
    `,
    
    'platform-feature': `
      Describe platform features that:
      - Focus on clinical workflow improvements
      - Emphasize data security and HIPAA compliance
      - Highlight integration capabilities with existing healthcare systems
      - Show measurable benefits for healthcare organizations
      - Use healthcare professional terminology
      - Address regulatory requirements
    `,
    
    'research-publication': `
      Summarize research content that:
      - Maintains scientific accuracy and objectivity
      - Uses appropriate medical terminology
      - Cites peer-reviewed sources
      - Follows academic writing standards
      - Avoids overstated claims
      - Includes proper disclaimers
      - Appeals to healthcare researchers and clinicians
    `,
    
    'clinical-content': `
      Create clinical content that:
      - Is medically accurate and evidence-based
      - Complies with FDA regulations for medical claims
      - Uses appropriate clinical terminology
      - Includes necessary medical disclaimers
      - Appeals to healthcare professionals
      - Avoids patient-specific information (HIPAA)
      - Cites credible medical sources
    `,
    
    'cta-section': `
      Create compelling calls-to-action that:
      - Drive healthcare professionals to take specific actions
      - Address common healthcare industry pain points
      - Emphasize compliance and security benefits
      - Use urgent but professional language
      - Focus on outcomes and ROI
      - Include trust signals for healthcare organizations
    `,
    
    'seo-meta': `
      Optimize SEO content that:
      - Targets healthcare and medical research keywords
      - Appeals to healthcare professionals in search results
      - Complies with Google's YMYL (Your Money or Your Life) guidelines
      - Emphasizes expertise, authority, and trustworthiness
      - Includes location-based targeting when relevant
      - Avoids medical claims that require FDA approval
    `
  }

  const specificPrompt = contentTypePrompts[request.content_type] || contentTypePrompts['blog-post']
  
  const lengthGuidance = request.target_length 
    ? `Target length: approximately ${request.target_length} words.`
    : 'Use appropriate length for the content type.'

  const toneGuidance = `Tone: ${request.tone || 'professional'} - appropriate for healthcare professionals.`
  
  const audienceGuidance = request.audience 
    ? `Primary audience: ${request.audience}`
    : 'Primary audience: Healthcare professionals, clinical researchers, healthcare administrators'

  return `${baseContext}

${specificPrompt}

${lengthGuidance}
${toneGuidance}
${audienceGuidance}

User Request: ${request.prompt}

Additional Context: ${JSON.stringify(request.context || {}, null, 2)}

Please provide healthcare-compliant, professional content that meets these requirements.`
}

// Mock BMAD API integration (replace with actual BMAD API calls)
export async function callBMADAgent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  try {
    logger.info('Calling BMAD agent', {
      agent_type: request.agent_type,
      content_type: request.content_type,
      prompt_length: request.prompt.length
    })

    const prompt = generateBMADPrompt(request)
    
    // Mock response - replace with actual BMAD API call
    const mockResponse: AIGenerationResponse = {
      id: `bmad_${Date.now()}`,
      content: generateMockContent(request),
      suggestions: generateMockSuggestions(request),
      seo_recommendations: generateMockSEORecommendations(request),
      compliance_notes: generateMockComplianceNotes(request),
      metadata: {
        agent_used: request.agent_type,
        generation_time: new Date().toISOString(),
        prompt_tokens: prompt.length,
        response_tokens: 500
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    logger.info('BMAD agent response generated', {
      response_id: mockResponse.id,
      content_length: mockResponse.content.length
    })

    return mockResponse

  } catch (error) {
    logger.error('BMAD agent call failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      agent_type: request.agent_type,
      content_type: request.content_type
    })
    
    throw new Error(`BMAD agent call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Mock content generation functions (replace with actual BMAD responses)
function generateMockContent(request: AIGenerationRequest): string {
  const contentTemplates: Record<string, string> = {
    'homepage-hero': `Revolutionize Healthcare Through Advanced Clinical Research

Transform patient outcomes with HMHCP's comprehensive clinical research organization, featuring AI-powered platforms, regulatory expertise, and the innovative BMAD Method for accelerated healthcare innovation.

Our cutting-edge technology platforms integrate seamlessly with existing healthcare systems, ensuring HIPAA compliance while delivering measurable improvements in clinical trial efficiency and patient care quality.`,

    'blog-post': `Healthcare Technology Innovation: Transforming Patient Care Through Digital Integration

The healthcare industry is experiencing unprecedented digital transformation, driven by advances in artificial intelligence, data analytics, and patient-centered care models. This evolution presents both opportunities and challenges for healthcare organizations seeking to improve patient outcomes while maintaining regulatory compliance.

Key areas of innovation include:

1. AI-powered clinical decision support systems
2. Integrated electronic health records (EHR) platforms
3. Remote patient monitoring and telehealth solutions
4. Predictive analytics for population health management

Organizations implementing these technologies report significant improvements in operational efficiency, patient satisfaction, and clinical outcomes while maintaining strict adherence to HIPAA and FDA requirements.`,

    'service-description': `Clinical Research Excellence Services

Our comprehensive clinical research services combine decades of regulatory expertise with cutting-edge technology platforms to accelerate your path to market approval. We specialize in:

• End-to-end clinical trial management
• FDA regulatory consulting and submission support
• Data management and biostatistics
• Quality assurance and compliance monitoring
• Post-market surveillance and pharmacovigilance

With our BMAD Method approach, we deliver 40% faster trial completion times while maintaining the highest standards of data quality and regulatory compliance.`,

    'default': `Professional healthcare content optimized for your specific needs, ensuring medical accuracy, regulatory compliance, and effective communication with healthcare professionals.`
  }

  return contentTemplates[request.content_type] || contentTemplates['default']
}

function generateMockSuggestions(request: AIGenerationRequest): string[] {
  const suggestions = [
    'Consider adding specific metrics or statistics to strengthen credibility',
    'Include relevant healthcare industry keywords for better SEO performance',
    'Add a compelling call-to-action that addresses specific healthcare pain points',
    'Consider incorporating patient outcome data or case study references',
    'Ensure all medical claims are properly qualified with appropriate disclaimers'
  ]

  return suggestions.slice(0, 3) // Return 3 random suggestions
}

function generateMockSEORecommendations(request: AIGenerationRequest) {
  return [
    {
      type: 'title' as const,
      suggestion: 'Include primary healthcare keyword in the first 60 characters',
      impact: 'high' as const
    },
    {
      type: 'description' as const,
      suggestion: 'Add location-based keywords if targeting local healthcare markets',
      impact: 'medium' as const
    },
    {
      type: 'keywords' as const,
      suggestion: 'Focus on long-tail healthcare professional keywords',
      impact: 'medium' as const
    }
  ]
}

function generateMockComplianceNotes(request: AIGenerationRequest) {
  const complianceNotes = [
    {
      type: 'hipaa' as const,
      issue: 'Ensure no patient-specific information is included',
      recommendation: 'Use de-identified examples and aggregate data only',
      severity: 'critical' as const
    },
    {
      type: 'fda' as const,
      issue: 'Medical claims require appropriate qualification',
      recommendation: 'Add disclaimers for any therapeutic or diagnostic claims',
      severity: 'warning' as const
    },
    {
      type: 'accessibility' as const,
      issue: 'Content should be accessible to users with disabilities',
      recommendation: 'Use clear language and proper heading structure',
      severity: 'info' as const
    }
  ]

  // Return relevant compliance notes based on content type
  if (request.content_type.includes('clinical') || request.content_type.includes('medical')) {
    return complianceNotes
  }
  
  return complianceNotes.slice(0, 2)
}

// Validate agent request before processing
export function validateBMADRequest(request: AIGenerationRequest): string[] {
  const errors: string[] = []

  if (!request.content_type) {
    errors.push('Content type is required')
  }

  if (!request.agent_type || !BMAD_AGENTS[request.agent_type]) {
    errors.push('Valid agent type is required')
  }

  if (!request.prompt || request.prompt.trim().length < 10) {
    errors.push('Prompt must be at least 10 characters long')
  }

  if (request.target_length && (request.target_length < 50 || request.target_length > 5000)) {
    errors.push('Target length must be between 50 and 5000 words')
  }

  return errors
}

// Get agent capabilities for UI display
export function getAgentCapabilities(agentType: string): string[] {
  return BMAD_AGENTS[agentType]?.capabilities || []
}

// Check if agent is suitable for healthcare content
export function isHealthcareCompliantAgent(agentType: string): boolean {
  return BMAD_AGENTS[agentType]?.healthcare_compliant || false
}