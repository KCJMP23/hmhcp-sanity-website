
import { StrategicConsultingClient } from "./strategic-consulting-client"
import { fetchPageContent } from "@/lib/dal/unified-content"

export default async function StrategicConsultingPage() {
  // Fetch data from Supabase
  let strategicConsultingData = null
  
  try {
    strategicConsultingData = await fetchPageContent('strategic-consulting', 'page')
  } catch (error) {
    console.error('Failed to fetch strategic consulting data:', error)
  }

  // Fallback data
  const fallbackPageData = {
    title: 'Strategic Consulting',
    subtitle: 'Transform your healthcare organization with data-driven strategies and innovative solutions',
    description: 'Our strategic consulting services help healthcare organizations navigate complex challenges, optimize operations, and achieve sustainable growth through expert guidance and proven methodologies.',
    services: [
      {
        id: '1',
        title: 'Healthcare Technology Strategy',
        icon: 'Cpu',
        description: 'Transform your healthcare operations with cutting-edge technology solutions',
        features: [
          'Digital health strategy development',
          'EHR optimization and integration',
          'Cybersecurity and HIPAA compliance',
          'Interoperability solutions',
          'Technology change management'
        ]
      },
      {
        id: '2',
        title: 'Digital Transformation',
        icon: 'TrendingUp',
        description: 'Develop comprehensive roadmaps for healthcare digitalization',
        features: [
          'Technology assessment and gap analysis',
          'Digital maturity evaluation',
          'Implementation roadmap development',
          'Change management planning',
          'ROI projections and business case development'
        ]
      },
      {
        id: '3',
        title: 'Operational Excellence',
        icon: 'Target',
        description: 'Optimize workflows and enhance operational efficiency',
        features: [
          'Process optimization and automation',
          'Workflow redesign and standardization',
          'Performance metrics development',
          'Cost reduction strategies',
          'Quality improvement initiatives'
        ]
      },
      {
        id: '4',
        title: 'Clinical Innovation',
        icon: 'Lightbulb',
        description: 'Drive innovation in clinical care delivery and patient outcomes',
        features: [
          'Clinical pathway optimization',
          'Care coordination strategies',
          'Patient engagement solutions',
          'Outcomes measurement frameworks',
          'Evidence-based practice implementation'
        ]
      },
      {
        id: '5',
        title: 'Data & Analytics Strategy',
        icon: 'BarChart3',
        description: 'Leverage data to drive informed decision-making',
        features: [
          'Data governance framework design',
          'Analytics capability assessment',
          'Predictive modeling strategies',
          'Real-world evidence generation',
          'AI/ML implementation planning'
        ]
      }
    ],
    approach: {
      title: 'Our Consulting Approach',
      steps: [
        {
          phase: 'Discovery',
          description: 'Comprehensive assessment of current state, challenges, and opportunities'
        },
        {
          phase: 'Strategy Development',
          description: 'Create tailored strategies aligned with organizational goals and industry best practices'
        },
        {
          phase: 'Implementation Planning',
          description: 'Develop detailed roadmaps with clear milestones and success metrics'
        },
        {
          phase: 'Execution Support',
          description: 'Provide hands-on guidance and expertise throughout implementation'
        },
        {
          phase: 'Continuous Improvement',
          description: 'Monitor progress, measure outcomes, and optimize strategies'
        }
      ]
    },
    benefits: [
      'Accelerated digital transformation',
      'Improved operational efficiency',
      'Enhanced patient outcomes',
      'Reduced costs and increased revenue',
      'Data-driven decision making',
      'Competitive advantage in healthcare'
    ]
  }

  // Use Supabase data if available, otherwise use fallback
  const pageData = strategicConsultingData || fallbackPageData

  return <StrategicConsultingClient {...pageData} />
}