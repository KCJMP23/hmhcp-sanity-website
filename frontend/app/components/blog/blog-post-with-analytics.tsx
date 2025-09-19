'use client'

import { useEffect } from 'react'
import { useHealthcareAnalytics } from '@/lib/analytics/use-healthcare-analytics'

interface BlogPostWithAnalyticsProps {
  contentId: string
  contentSlug: string
  title: string
  content: string
  author?: string
  publishedAt: string
  enableAnalytics?: boolean
  className?: string
}

export function BlogPostWithAnalytics({
  contentId,
  contentSlug,
  title,
  content,
  author,
  publishedAt,
  enableAnalytics = true,
  className = '',
}: BlogPostWithAnalyticsProps) {
  // Initialize healthcare analytics tracking
  const { tracker, isTracking, getSessionInfo } = useHealthcareAnalytics({
    contentId,
    contentSlug,
    enabled: enableAnalytics,
    config: {
      enabled: enableAnalytics,
      scrollThresholds: [25, 50, 75, 90, 100],
      timeThresholds: [30, 60, 120, 300, 600], // 30s, 1m, 2m, 5m, 10m
    }
  })

  // Add medical terminology click tracking
  useEffect(() => {
    if (!enableAnalytics || !isTracking) return

    const handleTerminologyClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target) return

      // Check if clicked element or its parent has medical terminology
      let element: HTMLElement | null = target
      let depth = 0
      const maxDepth = 3

      while (element && depth < maxDepth) {
        const text = element.textContent?.toLowerCase() || ''
        const classList = element.className?.toLowerCase() || ''
        
        // Check if element has medical term indicators
        if (classList.includes('medical-term') || 
            classList.includes('terminology') ||
            element.hasAttribute('data-medical-term')) {
          
          const term = element.getAttribute('data-medical-term') || 
                       element.textContent?.trim() || ''
          
          if (term) {
            console.log('Medical terminology clicked:', term)
            // The tracker will automatically detect and track this
            break
          }
        }

        element = element.parentElement
        depth++
      }
    }

    document.addEventListener('click', handleTerminologyClick)
    
    return () => {
      document.removeEventListener('click', handleTerminologyClick)
    }
  }, [enableAnalytics, isTracking])

  // Debug info (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && tracker) {
      const interval = setInterval(() => {
        console.log('Analytics Session Info:', getSessionInfo())
      }, 30000) // Log every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [tracker, getSessionInfo])

  // Enhanced content with medical terminology markup
  const enhancedContent = enhanceMedicalTerminology(content)

  return (
    <article className={`blog-post-with-analytics ${className}`}>
      {/* Analytics Status (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>Analytics Status:</strong> {isTracking ? '✅ Tracking Active' : '❌ Not Tracking'} |
          <strong> Content ID:</strong> {contentId} |
          <strong> Slug:</strong> {contentSlug}
        </div>
      )}

      {/* Blog Post Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {author && <span>By {author}</span>}
          <span>Published {new Date(publishedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Blog Post Content */}
      <div 
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: enhancedContent }}
      />

      {/* Medical Terminology Legend */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Medical Terminology
        </h3>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Medical terms in this article are highlighted and tracked for analytics purposes. 
          Click on highlighted terms to see engagement metrics.
        </p>
      </div>
    </article>
  )
}

// Function to enhance content with medical terminology markup
function enhanceMedicalTerminology(content: string): string {
  // Common medical terms to highlight (this could be loaded from API)
  const medicalTerms = [
    // Cardiology
    'cardiovascular', 'cardiac', 'heart', 'coronary', 'artery', 'hypertension', 'hypotension',
    'arrhythmia', 'tachycardia', 'bradycardia', 'myocardial', 'angina', 'atherosclerosis',
    
    // Neurology
    'neurological', 'brain', 'seizure', 'stroke', 'cognitive', 'dementia', 'alzheimer',
    'parkinson', 'migraine', 'neuropathy', 'epilepsy', 'concussion',
    
    // General Medical
    'diagnosis', 'prognosis', 'treatment', 'therapy', 'medication', 'prescription',
    'symptoms', 'syndrome', 'pathology', 'etiology', 'epidemiology', 'clinical',
    'pharmaceutical', 'pharmacology', 'dosage', 'contraindication', 'adverse effects',
    
    // Oncology
    'cancer', 'tumor', 'malignant', 'benign', 'metastasis', 'chemotherapy', 'radiation',
    'oncology', 'carcinoma', 'sarcoma', 'lymphoma', 'leukemia', 'biopsy',
    
    // Common procedures
    'surgery', 'surgical', 'procedure', 'operation', 'anesthesia', 'endoscopy',
    'biopsy', 'catheterization', 'transplant', 'implant',
  ]

  let enhancedContent = content

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = medicalTerms.sort((a, b) => b.length - a.length)

  sortedTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    enhancedContent = enhancedContent.replace(regex, (match) => {
      return `<span class="medical-term bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer transition-colors" data-medical-term="${match.toLowerCase()}" title="Medical terminology: ${match}">${match}</span>`
    })
  })

  return enhancedContent
}

// Hook for medical terminology engagement stats
export function useMedicalTerminologyStats(contentId: string) {
  useEffect(() => {
    // This could fetch terminology engagement stats for this specific content
    // For now, we'll just log when the component mounts
    console.log(`Monitoring terminology engagement for content: ${contentId}`)
  }, [contentId])

  // Return mock stats (in real implementation, this would fetch from API)
  return {
    topTerms: [
      { term: 'cardiovascular', clicks: 12, category: 'cardiology' },
      { term: 'diagnosis', clicks: 8, category: 'general' },
      { term: 'treatment', clicks: 6, category: 'general' },
    ],
    totalInteractions: 26,
    professionalEngagement: 65, // percentage
    patientEngagement: 35, // percentage
  }
}