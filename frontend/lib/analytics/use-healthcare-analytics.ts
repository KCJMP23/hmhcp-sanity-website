'use client'

import { useEffect, useRef } from 'react'
import { initializeHealthcareTracking, getHealthcareTracker, type TrackingConfig } from './healthcare-tracking'

interface UseHealthcareAnalyticsProps {
  contentId: string
  contentSlug: string
  enabled?: boolean
  config?: Partial<TrackingConfig>
}

export function useHealthcareAnalytics({
  contentId,
  contentSlug,
  enabled = true,
  config = {}
}: UseHealthcareAnalyticsProps) {
  const trackerRef = useRef<ReturnType<typeof initializeHealthcareTracking> | null>(null)
  const isTrackingRef = useRef(false)

  useEffect(() => {
    if (!enabled || !contentId || isTrackingRef.current) return

    // Initialize tracker if it doesn't exist
    if (!trackerRef.current) {
      trackerRef.current = initializeHealthcareTracking(config)
    }

    // Start tracking this content
    trackerRef.current.initializeContentTracking(contentId, contentSlug)
    isTrackingRef.current = true

    // Cleanup function
    return () => {
      if (trackerRef.current && isTrackingRef.current) {
        trackerRef.current.stopTracking()
        isTrackingRef.current = false
      }
    }
  }, [contentId, contentSlug, enabled, config])

  // Stop tracking when component unmounts
  useEffect(() => {
    return () => {
      if (trackerRef.current && isTrackingRef.current) {
        trackerRef.current.stopTracking()
        isTrackingRef.current = false
      }
    }
  }, [])

  // Return tracker instance and helper functions
  return {
    tracker: trackerRef.current,
    isTracking: isTrackingRef.current,
    getSessionInfo: () => trackerRef.current?.getSessionInfo() || null,
    stopTracking: () => {
      if (trackerRef.current && isTrackingRef.current) {
        trackerRef.current.stopTracking()
        isTrackingRef.current = false
      }
    },
  }
}

// Hook for medical terminology tracking
export function useMedicalTerminologyTracking(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    // This hook can be used to enhance medical terminology tracking
    // Additional terminology-specific tracking logic would go here
    
  }, [enabled])
}

// Hook for scroll depth analytics
export function useScrollAnalytics(
  contentId: string, 
  thresholds: number[] = [25, 50, 75, 90, 100],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !contentId) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    const reportedThresholds = new Set<number>()

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !reportedThresholds.has(threshold)) {
          reportedThresholds.add(threshold)
          // Custom scroll tracking logic here
          break
        }
      }
    }

    let ticking = false
    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true })

    return () => {
      window.removeEventListener('scroll', requestTick)
    }
  }, [contentId, thresholds, enabled])
}

// Hook for time-based engagement tracking
export function useEngagementTracking(
  contentId: string,
  intervals: number[] = [30, 60, 120, 300], // seconds
  enabled: boolean = true
) {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    if (!enabled || !contentId) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    const startTime = Date.now()

    // Set up time-based tracking intervals
    timeoutsRef.current = intervals.map(interval => 
      setTimeout(() => {
        const actualTime = Math.round((Date.now() - startTime) / 1000)
        // Custom engagement tracking logic here
        console.log(`Engagement milestone: ${actualTime}s on ${contentId}`)
      }, interval * 1000)
    )

    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [contentId, intervals, enabled])
}

// Hook for healthcare professional behavior analysis
export function useHealthcareProfessionalTracking(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    // Track professional-specific behaviors
    const trackProfessionalBehavior = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return

      // Look for professional terminology interactions
      const professionalTerms = [
        'diagnosis', 'prognosis', 'etiology', 'pathophysiology',
        'pharmacokinetics', 'contraindication', 'adverse effects',
        'clinical trial', 'evidence-based', 'meta-analysis'
      ]

      const text = target.textContent?.toLowerCase() || ''
      const foundTerm = professionalTerms.find(term => text.includes(term))
      
      if (foundTerm) {
        // Professional terminology engagement detected
        console.log(`Professional term engagement: ${foundTerm}`)
      }
    }

    document.addEventListener('click', trackProfessionalBehavior, { passive: true })
    document.addEventListener('mouseenter', trackProfessionalBehavior, { passive: true })

    return () => {
      document.removeEventListener('click', trackProfessionalBehavior)
      document.removeEventListener('mouseenter', trackProfessionalBehavior)
    }
  }, [enabled])
}

// Hook for patient behavior analysis
export function usePatientBehaviorTracking(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    // Track patient-specific behaviors
    const trackPatientBehavior = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return

      // Look for patient-oriented content interactions
      const patientTerms = [
        'symptoms', 'treatment', 'prevention', 'home remedy',
        'side effects', 'recovery', 'wellness', 'health tips',
        'what to expect', 'how to', 'natural', 'alternative'
      ]

      const text = target.textContent?.toLowerCase() || ''
      const foundTerm = patientTerms.find(term => text.includes(term))
      
      if (foundTerm) {
        // Patient-oriented content engagement detected
        console.log(`Patient content engagement: ${foundTerm}`)
      }
    }

    document.addEventListener('click', trackPatientBehavior, { passive: true })

    return () => {
      document.removeEventListener('click', trackPatientBehavior)
    }
  }, [enabled])
}

// Hook for A/B testing with healthcare segments
export function useHealthcareABTesting(
  testName: string,
  variants: string[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !testName || variants.length === 0) return

    const tracker = getHealthcareTracker()
    if (!tracker) return

    // Get visitor classification for segment-based A/B testing
    const sessionInfo = tracker.getSessionInfo() as any
    const visitorType = sessionInfo?.visitorType || 'unknown'

    // Select variant based on visitor type and session hash
    const sessionHash = sessionInfo?.sessionHash || ''
    let variantIndex = 0
    
    if (visitorType === 'healthcare_professional') {
      // Different distribution for professionals
      variantIndex = parseInt(sessionHash.slice(-1), 16) % variants.length
    } else if (visitorType === 'patient') {
      // Different distribution for patients
      variantIndex = parseInt(sessionHash.slice(-2, -1), 16) % variants.length
    } else {
      // Default distribution for unknown visitors
      variantIndex = parseInt(sessionHash.slice(0, 1), 16) % variants.length
    }

    const selectedVariant = variants[variantIndex]

    // Track A/B test assignment
    console.log(`A/B Test: ${testName}, Variant: ${selectedVariant}, Visitor: ${visitorType}`)

    // You can store the variant in localStorage or state management
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ab_test_${testName}`, selectedVariant)
    }

    return () => {
      // Cleanup if needed
    }
  }, [testName, variants, enabled])
}