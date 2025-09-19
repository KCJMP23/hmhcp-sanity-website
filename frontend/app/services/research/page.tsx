import { fetchPageContent } from "@/lib/dal/unified-content"
import { ResearchServicesClient } from "./research-services-client"

export default async function ResearchServicesPage() {
  // Fetch data from unified content system
  let researchServicesData = null
  
  try {
    researchServicesData = await fetchPageContent('research', 'service')
  } catch (error) {
    console.error('Failed to fetch research services content:', error)
  }

  // Fallback data
  const fallbackPageData = {
    title: 'Research Services',
    subtitle: 'Advancing healthcare through evidence-based research and innovation',
    description: 'Our research services help healthcare organizations generate evidence, validate interventions, and advance medical knowledge through rigorous scientific inquiry and data analysis.',
    services: [
      {
        id: '1',
        title: 'Clinical Research',
        icon: 'Search',
        description: 'Comprehensive clinical research and trial management',
        features: [
          'Clinical trial design and management',
          'Regulatory compliance support',
          'Data collection and analysis',
          'Protocol development',
          'Patient recruitment strategies'
        ]
      },
      {
        id: '2',
        title: 'Health Economics',
        icon: 'BarChart3',
        description: 'Economic evaluation and health technology assessment',
        features: [
          'Cost-effectiveness analysis',
          'Budget impact modeling',
          'Real-world evidence studies',
          'Market access research',
          'Value-based care metrics'
        ]
      },
      {
        id: '3',
        title: 'Publication Support',
        icon: 'FileText',
        description: 'Scientific writing and publication assistance',
        features: [
          'Manuscript preparation',
          'Scientific writing support',
          'Peer review coordination',
          'Grant writing assistance',
          'Conference presentation development'
        ]
      },
      {
        id: '4',
        title: 'Data Analytics',
        icon: 'Target',
        description: 'Advanced analytics and statistical modeling',
        features: [
          'Statistical analysis planning',
          'Predictive modeling',
          'Machine learning applications',
          'Data visualization',
          'Biostatistical consulting'
        ]
      }
    ],
    researchTypes: {
      title: 'Types of Research We Conduct',
      items: [
        {
          name: 'Observational Studies',
          description: 'Real-world evidence generation through observational research',
          applications: [
            'Cohort studies',
            'Case-control studies',
            'Cross-sectional analysis',
            'Registry studies'
          ]
        },
        {
          name: 'Interventional Trials',
          description: 'Controlled trials to evaluate healthcare interventions',
          applications: [
            'Randomized controlled trials',
            'Pilot studies',
            'Feasibility studies',
            'Comparative effectiveness research'
          ]
        },
        {
          name: 'Systematic Reviews',
          description: 'Comprehensive evidence synthesis and meta-analysis',
          applications: [
            'Literature reviews',
            'Meta-analyses',
            'Network meta-analyses',
            'Evidence mapping'
          ]
        },
        {
          name: 'Quality Improvement Research',
          description: 'Research to improve healthcare processes and outcomes',
          applications: [
            'Implementation science',
            'Process improvement studies',
            'Patient safety research',
            'Healthcare innovation studies'
          ]
        }
      ]
    },
    outcomes: [
      'Published research papers',
      'Evidence-based recommendations',
      'Improved patient outcomes',
      'Cost savings identification',
      'Clinical practice guidelines',
      'Regulatory approvals',
      'Grant funding success',
      'Academic partnerships',
      'Industry collaborations',
      'Policy influence'
    ]
  }

  // Use Supabase data if available, otherwise use fallback
  const pageData = researchServicesData || fallbackPageData

  return <ResearchServicesClient {...pageData} />
}