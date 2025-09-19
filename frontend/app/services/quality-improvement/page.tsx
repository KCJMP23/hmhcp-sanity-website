import { fetchPageContent } from "@/lib/dal/unified-content"
import { QualityImprovementClient } from "./quality-improvement-client"

export default async function QualityImprovementPage() {
  // Fetch data from unified content system
  let qualityImprovementData = null
  
  try {
    qualityImprovementData = await fetchPageContent('quality-improvement', 'service')
  } catch (error) {
    console.error('Failed to fetch quality improvement content:', error)
  }

  // Fallback data
  const fallbackPageData = {
    title: 'Quality Improvement',
    subtitle: 'Drive excellence in healthcare through systematic quality improvement initiatives',
    description: 'Our quality improvement services help healthcare organizations enhance patient outcomes, reduce errors, and optimize processes through evidence-based methodologies and continuous improvement frameworks.',
    services: [
      {
        id: '1',
        title: 'Clinical Quality Programs',
        icon: 'Award',
        description: 'Comprehensive quality improvement for clinical outcomes',
        features: [
          'Clinical quality metrics development',
          'Outcome measurement and tracking',
          'Evidence-based practice implementation',
          'Clinical pathway optimization',
          'Patient safety initiatives'
        ]
      },
      {
        id: '2',
        title: 'Operational Quality',
        icon: 'Target',
        description: 'Optimize operational processes and efficiency',
        features: [
          'Process improvement initiatives',
          'Workflow optimization',
          'Resource utilization analysis',
          'Cost-effectiveness studies',
          'Performance benchmarking'
        ]
      },
      {
        id: '3',
        title: 'Data Analytics',
        icon: 'BarChart',
        description: 'Leverage data to drive quality improvements',
        features: [
          'Quality metrics dashboard',
          'Predictive analytics',
          'Real-time monitoring',
          'Trend analysis',
          'Reporting automation'
        ]
      },
      {
        id: '4',
        title: 'Patient Safety',
        icon: 'Shield',
        description: 'Comprehensive patient safety programs',
        features: [
          'Risk assessment protocols',
          'Incident reporting systems',
          'Safety culture development',
          'Error reduction strategies',
          'Compliance monitoring'
        ]
      }
    ],
    frameworks: {
      title: 'Quality Improvement Frameworks',
      items: [
        {
          name: 'Lean Healthcare',
          description: 'Eliminate waste and optimize value in healthcare delivery',
          components: [
            'Value stream mapping',
            'Waste identification',
            'Continuous flow',
            'Pull systems',
            'Perfection pursuit'
          ]
        },
        {
          name: 'Six Sigma',
          description: 'Data-driven approach to eliminate defects and reduce variation',
          components: [
            'DMAIC methodology',
            'Statistical analysis',
            'Process capability',
            'Control charts',
            'Root cause analysis'
          ]
        },
        {
          name: 'PDSA Cycles',
          description: 'Plan-Do-Study-Act cycles for systematic improvement',
          components: [
            'Hypothesis planning',
            'Small-scale testing',
            'Data collection',
            'Analysis and learning',
            'Implementation scaling'
          ]
        }
      ]
    },
    outcomes: [
      'Improved patient safety scores',
      'Reduced medical errors',
      'Enhanced clinical outcomes',
      'Increased operational efficiency',
      'Better patient satisfaction',
      'Cost reduction and savings',
      'Regulatory compliance',
      'Staff engagement improvement'
    ]
  }

  // Use Supabase data if available, otherwise use fallback
  const pageData = qualityImprovementData || fallbackPageData

  return <QualityImprovementClient {...pageData} />
}