import { fetchPageContent } from "@/lib/dal/unified-content"
import { ImplementationClient } from "./implementation-client"

export default async function ImplementationPage() {
  // Fetch data from unified content system
  let implementationData = null
  
  try {
    implementationData = await fetchPageContent('implementation', 'service')
  } catch (error) {
    console.error('Failed to fetch implementation content:', error)
  }

  // Fallback data
  const fallbackPageData = {
    title: 'Implementation Services',
    subtitle: 'Expert deployment and integration of healthcare technology solutions',
    description: 'Our implementation services ensure seamless deployment of healthcare platforms with minimal disruption to your operations. We handle everything from initial setup to full production rollout.',
    services: [
      {
        id: '1',
        title: 'Platform Deployment',
        icon: 'Server',
        description: 'End-to-end deployment of healthcare technology platforms',
        features: [
          'Infrastructure setup and configuration',
          'Database design and optimization',
          'Security implementation and hardening',
          'Performance tuning and optimization',
          'Disaster recovery planning'
        ]
      },
      {
        id: '2',
        title: 'System Integration',
        icon: 'Cog',
        description: 'Seamless integration with existing healthcare systems',
        features: [
          'EHR/EMR integration',
          'Laboratory system connectivity',
          'Billing system integration',
          'API development and management',
          'Data migration and validation'
        ]
      },
      {
        id: '3',
        title: 'User Training & Adoption',
        icon: 'Users',
        description: 'Comprehensive training programs for successful adoption',
        features: [
          'Role-based training curricula',
          'Hands-on training sessions',
          'Documentation and resources',
          'Change management support',
          'Ongoing user support'
        ]
      }
    ],
    methodology: {
      title: 'Our Implementation Methodology',
      phases: [
        {
          name: 'Planning & Design',
          duration: '2-4 weeks',
          activities: [
            'Requirements gathering',
            'Architecture design',
            'Project timeline development',
            'Resource allocation'
          ]
        },
        {
          name: 'Configuration & Development',
          duration: '4-8 weeks',
          activities: [
            'System configuration',
            'Custom development',
            'Integration setup',
            'Security implementation'
          ]
        },
        {
          name: 'Testing & Validation',
          duration: '2-4 weeks',
          activities: [
            'Unit testing',
            'Integration testing',
            'User acceptance testing',
            'Performance testing'
          ]
        },
        {
          name: 'Deployment & Go-Live',
          duration: '1-2 weeks',
          activities: [
            'Production deployment',
            'Data migration',
            'User training',
            'Go-live support'
          ]
        },
        {
          name: 'Post-Implementation Support',
          duration: 'Ongoing',
          activities: [
            'Issue resolution',
            'Performance monitoring',
            'User support',
            'Continuous improvement'
          ]
        }
      ]
    },
    successFactors: [
      'Experienced healthcare IT professionals',
      'Proven implementation methodology',
      'Strong project management',
      'Clear communication throughout',
      'Risk mitigation strategies',
      'Post-launch optimization'
    ]
  }

  // Use Supabase data if available, otherwise use fallback
  const pageData = implementationData || fallbackPageData

  return <ImplementationClient {...pageData} />
}