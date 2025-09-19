'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart, Activity, Zap, Calendar, Users, BarChart3, ArrowRight } from 'lucide-react'
import { useTheme } from 'next-themes'
// import { usePhoneScreens, getContentData } from '@/lib/hooks/use-cms-content'  // Temporarily disabled
// import type { PhoneScreen } from '@/lib/types/cms-types'  // Temporarily disabled
import * as Icons from 'lucide-react'

interface PhoneScreenDisplay {
  id: string
  title: string
  subtitle: string
  content: React.ReactNode
}

const fallbackPhoneScreens: PhoneScreenDisplay[] = [
  {
    id: 'dashboard',
    title: 'Personalized Dashboard',
    subtitle: 'Your health overview at a glance',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/50 dark:to-gray-900">
        <div className="text-center mb-6">
          <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Good Morning, Sarah</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Treatment Day 12 • Next appointment in 3 days</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center mb-2">
              <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Energy Level</span>
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">8.7/10</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center mb-2">
              <Heart className="w-4 h-4 text-red-500 dark:text-red-400 mr-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Heart Rate</span>
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">68 <span className="text-xs text-gray-500 dark:text-gray-400">bpm</span></div>
          </div>
        </div>
        
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Care Insight</h3>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">Your recovery metrics are trending positively. Consider 20min walking today.</p>
          <button className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center">
            View Details <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    )
  },
  {
    id: 'intelliscore',
    title: 'INTELLISCORE Tracking',
    subtitle: 'Comprehensive health scoring system',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/50 dark:to-gray-900">
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 dark:from-purple-500 dark:to-blue-600 rounded-full"></div>
            <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">87</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">of 100</div>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excellent Progress</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Your treatment journey is on track</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">Treatment Adherence</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">95%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">Recovery Markers</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Good</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">Wellness Goals</span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">85%</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'appointments',
    title: 'Smart Scheduling',
    subtitle: 'AI-powered appointment management',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-green-50 to-white dark:from-green-950/50 dark:to-gray-900">
        <div className="flex items-center mb-6">
          <Calendar className="w-6 h-6 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Schedule</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-500 dark:border-green-400">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Oncologist Visit</h3>
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">Today</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Dr. Smith - Treatment Review</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2:00 PM - 3:00 PM</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-500 dark:border-blue-400">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Lab Work</h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Tomorrow</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Routine blood tests</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">9:00 AM - 9:30 AM</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-purple-500 dark:border-purple-400">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Support Group</h3>
              <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">Wed</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Virtual meeting</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">7:00 PM - 8:00 PM</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'team',
    title: 'Care Team Hub',
    subtitle: 'Connect with your healthcare providers',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/50 dark:to-gray-900">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Care Team</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
              DS
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dr. Sarah Smith</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Medical Oncologist</p>
            </div>
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
          </div>
          
          <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
              MJ
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Maria Johnson</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Nurse Navigator</p>
            </div>
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
          </div>
          
          <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
              RL
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dr. Robert Lee</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Radiologist</p>
            </div>
            <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
          </div>
        </div>
        
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl mt-6 transition-colors">
          Send Message
        </button>
      </div>
    )
  },
  {
    id: 'analytics',
    title: 'Health Analytics',
    subtitle: 'Track your progress over time',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/50 dark:to-gray-900">
        <div className="flex items-center mb-6">
          <BarChart3 className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Report</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Energy Levels</h3>
          <div className="h-16 bg-gradient-to-r from-orange-200 to-orange-400 dark:from-orange-300 dark:to-orange-500 rounded-lg flex items-end justify-between p-2">
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '60%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '80%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '70%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '90%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '85%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '95%' }}></div>
            <div className="w-1 bg-orange-600 dark:bg-orange-700 rounded-full" style={{ height: '88%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">+15%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Energy Improvement</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">92%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Medication Adherence</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'insights',
    title: 'AI Insights',
    subtitle: 'Personalized recommendations',
    content: (
      <div className="p-4 h-full bg-gradient-to-b from-teal-50 to-white dark:from-teal-950/50 dark:to-gray-900">
        <div className="flex items-center mb-6">
          <Zap className="w-6 h-6 text-teal-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Insights</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-teal-500 dark:border-teal-400">
            <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Nutrition Recommendation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Based on your recent lab results, consider increasing protein intake to 1.2g per kg body weight.</p>
            <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 px-2 py-1 rounded-full">High Priority</span>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-blue-500 dark:border-blue-400">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Activity Suggestion</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Your sleep quality improved by 18% this week. Try a 15-minute walk after lunch to maintain this trend.</p>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Medium Priority</span>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-purple-500 dark:border-purple-400">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Appointment Reminder</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Don't forget to prepare questions for Dr. Smith about your treatment progress.</p>
            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">Reminder</span>
          </div>
        </div>
      </div>
    )
  }
]

// Helper function to render phone screen content based on CMS data
function renderPhoneScreenContent(screenData: any): React.ReactNode {
  const { content_type, content_data } = screenData

  // For now, return the appropriate fallback content based on content_type
  // In the future, this could dynamically render based on content_data
  switch (content_type) {
    case 'dashboard':
      return fallbackPhoneScreens[0]?.content
    case 'intelliscore': 
      return fallbackPhoneScreens[1]?.content
    case 'appointments':
      return fallbackPhoneScreens[2]?.content
    case 'team':
      return fallbackPhoneScreens[3]?.content
    case 'analytics':
      return fallbackPhoneScreens[4]?.content
    case 'insights':
      return fallbackPhoneScreens[5]?.content
    default:
      // Try to match by id or use first screen as fallback
      const fallbackIndex = fallbackPhoneScreens.findIndex(screen => screen.id === screenData.id)
      return fallbackPhoneScreens[fallbackIndex >= 0 ? fallbackIndex : 0]?.content
  }
}

export function InteractivePhoneShowcase() {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [isPinned, setIsPinned] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { theme, resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // Temporarily disable CMS to use only fallback data (6 screens)
  // const { content: cmsContent, loading, error } = usePhoneScreens(fallbackPhoneScreens)
  const loading = false
  const error = null

  // Use only fallback screens (exactly 6 screens as designed)
  const phoneScreens: PhoneScreenDisplay[] = fallbackPhoneScreens
  
  // Handle hydration and mobile detection
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Cache viewport height and mobile check
    let cachedViewportHeight = window.innerHeight
    const isMobileView = window.innerWidth < 1024
    
    const handleScroll = () => {
      if (!containerRef.current || !sectionRef.current) return
      
      // Quick mobile check
      if (isMobileView) {
        setIsPinned(false)
        return
      }

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const headerHeight = 80
      
      // Optimized pinning check with cached viewport height
      const shouldPin = containerRect.top <= headerHeight && containerRect.bottom >= cachedViewportHeight
      
      // Only update state if changed
      setIsPinned(prev => prev !== shouldPin ? shouldPin : prev)

      if (shouldPin) {
        // More accurate progress calculation
        const totalScrollableHeight = containerRect.height - cachedViewportHeight
        const currentScrolled = Math.abs(containerRect.top)
        const scrollProgress = totalScrollableHeight > 0 ? currentScrolled / totalScrollableHeight : 0
        
        // Clamp progress between 0 and 1
        const normalizedProgress = Math.max(0, Math.min(1, scrollProgress))
        
        // Calculate screen index with smoother transitions
        const screenCount = phoneScreens.length
        const rawIndex = normalizedProgress * (screenCount - 1)
        const screenIndex = Math.round(rawIndex)
        const clampedIndex = Math.max(0, Math.min(screenCount - 1, screenIndex))
        
        // Only update if changed
        setCurrentScreen(prev => prev !== clampedIndex ? clampedIndex : prev)
      } else {
        // Keep the last screen visible when scrolling past the section
        if (containerRect.top > headerHeight) {
          setCurrentScreen(prev => prev !== 0 ? 0 : prev)
        } else if (containerRect.bottom < cachedViewportHeight) {
          // Keep showing the last screen when scrolled past
          const lastScreen = phoneScreens.length - 1
          setCurrentScreen(prev => prev !== lastScreen ? lastScreen : prev)
        }
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Resize handler to update cached viewport height
    const handleResize = () => {
      cachedViewportHeight = window.innerHeight
      handleScroll()
    }
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    handleScroll() // Call once to set initial state
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, []) // Remove currentScreen dependency to prevent infinite loops

  // Show loading skeleton if content is loading
  if (loading) {
    return (
      <div 
        className="relative pt-20 overflow-hidden"
        style={{ height: isMobile ? '100vh' : `${100 + phoneScreens.length * 25}vh` }}
      >
        <div 
          className="absolute w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden"
          style={{ top: '80px', height: 'calc(100vh - 80px)', zIndex: 1 }}
        >
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95"></div>
            <img 
              src="/patient-experience-workshop.png" 
              alt="Patient experience workshop" 
              className="w-full h-full object-cover opacity-10"
            />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-center w-full">
              {/* Left side - Loading skeleton */}
              <div className="space-y-6 lg:space-y-8">
                <div>
                  <div className="w-32 h-8 bg-gray-700 rounded-full animate-pulse mb-8"></div>
                  <div className="w-3/4 h-16 bg-gray-700 rounded animate-pulse mb-6 lg:mb-8"></div>
                  <div className="w-full h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="w-5/6 h-6 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Progress indicator skeleton */}
                <div className="flex space-x-2">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="w-6 h-2 bg-gray-700 rounded-full animate-pulse"></div>
                  ))}
                </div>
                
                {/* Features skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 lg:p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gray-600 rounded-xl animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-600 rounded ml-3 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-gray-600 rounded animate-pulse"></div>
                        <div className="w-3/4 h-4 bg-gray-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right side - Phone skeleton - Hidden on mobile */}
              <div className="hidden lg:flex justify-center">
                <div className="w-80 h-[640px] bg-gray-700 rounded-[3rem] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden" // Remove pt-20 as it creates extra spacing
      style={{ height: isMobile ? '100vh' : `${100 + phoneScreens.length * 25}vh` }} // Optimized height calculation for 6 screens
    >
      <div 
        ref={sectionRef}
        className={`${isPinned ? 'fixed left-0 w-full' : 'absolute w-full'} bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden transform-gpu`}
        style={{
          top: isPinned ? '80px' : currentScreen === phoneScreens.length - 1 ? 'auto' : '0',
          bottom: isPinned ? 'auto' : currentScreen === phoneScreens.length - 1 ? '0' : 'auto',
          height: '100vh',
          zIndex: 1,
          willChange: isPinned ? 'transform' : 'auto',
          backfaceVisibility: 'hidden',
          perspective: 1000
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95"></div>
          <img 
            src="/patient-experience-workshop.png" 
            alt="Patient experience workshop" 
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto py-8 lg:py-12">
          <div className="phone-showcase-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-center w-full min-h-full">
            {/* Left side - Text content that changes with screens */}
            <div className="phone-showcase-text space-y-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-medium mb-4">
                  <Heart className="w-3 h-3 mr-1" />
                  Mobile Experience
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-3 tracking-tight">
                  {phoneScreens[currentScreen]?.title || "Your complete care companion"}
                </h2>
                <p className="text-base lg:text-lg text-gray-200 max-w-3xl leading-relaxed">
                  {phoneScreens[currentScreen]?.subtitle || "The MyBC Health app brings all aspects of your breast cancer care into one intuitive platform."}
                </p>
              </div>
              
              {/* Progress indicator and counter combined */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {phoneScreens.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        index === currentScreen 
                          ? 'w-6 bg-blue-600 dark:bg-blue-400' 
                          : 'w-1 bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-300">
                  {currentScreen + 1} of 6
                </div>
              </div>

              {/* Dynamic feature highlights that change with screens */}
              <div className="phone-showcase-features grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  const screenFeatures = [
                    // Dashboard features
                    [
                      { icon: Heart, color: 'blue', title: 'Real-Time Sync', desc: 'All health data synchronizes instantly across your care team for coordinated care.' },
                      { icon: Activity, color: 'green', title: 'Health Metrics', desc: 'Track energy levels, heart rate, and recovery indicators in real-time.' },
                      { icon: Zap, color: 'purple', title: 'AI Care Insights', desc: 'Personalized recommendations based on your unique health patterns and data.' },
                      { icon: Users, color: 'orange', title: 'Care Team Hub', desc: 'Connect with your entire healthcare team through one unified platform.' }
                    ],
                    // INTELLISCORE features
                    [
                      { icon: BarChart3, color: 'purple', title: 'Progress Tracking', desc: 'Comprehensive scoring system tracks your treatment journey and recovery.' },
                      { icon: Activity, color: 'green', title: 'Treatment Adherence', desc: 'Monitor medication compliance and appointment attendance with 95% accuracy.' },
                      { icon: Heart, color: 'blue', title: 'Recovery Markers', desc: 'Track key health indicators and treatment response over time.' },
                      { icon: Zap, color: 'orange', title: 'Wellness Goals', desc: 'Personal health targets and lifestyle improvements tailored to your needs.' }
                    ],
                    // Appointments features
                    [
                      { icon: Calendar, color: 'green', title: 'Smart Scheduling', desc: 'AI-powered appointment management that learns your preferences and needs.' },
                      { icon: Zap, color: 'blue', title: 'Auto Reminders', desc: 'Never miss important appointments with intelligent notification system.' },
                      { icon: Users, color: 'purple', title: 'Provider Coordination', desc: 'Seamlessly coordinate between oncologists, nurses, and specialists.' },
                      { icon: Activity, color: 'orange', title: 'Treatment Planning', desc: 'Optimize your care schedule around treatment cycles and recovery.' }
                    ],
                    // Care Team features
                    [
                      { icon: Users, color: 'indigo', title: 'Team Communication', desc: 'HIPAA-compliant messaging between all your healthcare providers.' },
                      { icon: Heart, color: 'green', title: 'Provider Profiles', desc: 'Detailed information about each member of your care team.' },
                      { icon: Activity, color: 'blue', title: 'Real-Time Status', desc: 'See when your providers are available for questions and consultations.' },
                      { icon: Zap, color: 'purple', title: 'Care Coordination', desc: 'Unified platform ensures everyone has the latest information.' }
                    ],
                    // Analytics features
                    [
                      { icon: BarChart3, color: 'orange', title: 'Health Analytics', desc: 'Detailed insights into your energy levels and treatment response.' },
                      { icon: Activity, color: 'green', title: 'Progress Trends', desc: '15% energy improvement and 92% medication adherence tracking.' },
                      { icon: Zap, color: 'purple', title: 'Predictive Insights', desc: 'AI algorithms predict optimal treatment timing and outcomes.' },
                      { icon: Heart, color: 'blue', title: 'Recovery Patterns', desc: 'Identify patterns in your recovery and optimize your care plan.' }
                    ],
                    // AI Insights features
                    [
                      { icon: Zap, color: 'teal', title: 'Personalized AI', desc: 'Machine learning provides tailored recommendations for your care.' },
                      { icon: Activity, color: 'blue', title: 'Smart Suggestions', desc: 'Nutrition and activity recommendations based on your lab results.' },
                      { icon: Heart, color: 'purple', title: 'Health Optimization', desc: 'AI identifies opportunities to improve your treatment outcomes.' },
                      { icon: Users, color: 'green', title: 'Care Reminders', desc: 'Intelligent reminders help you prepare for appointments and treatments.' }
                    ]
                  ];

                  const features = screenFeatures[currentScreen] || screenFeatures[0];
                  
                  return features.map((feature, index) => (
                    <div key={`${currentScreen}-${index}`} className={`bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl p-3 lg:p-4 shadow-sm hover:shadow-lg transition-all duration-300 transform-gpu`}>
                      <div className="flex items-center mb-2">
                        <div className={`w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <feature.icon className={`w-4 h-4 text-white`} />
                        </div>
                        <h3 className="font-medium text-sm text-white ml-2 line-clamp-1">{feature.title}</h3>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed line-clamp-2">
                        {feature.desc}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Right side - iPhone mockup - Hidden on mobile */}
            <div className="phone-showcase-mockup hidden lg:flex justify-center items-center">
              <div className="phone-mockup relative w-[375px] h-[812px] scale-[0.65] xl:scale-75 2xl:scale-[0.85]">
                {/* iPhone 15 Pro outline */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  viewBox="0 0 375 812" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer frame */}
                  <rect 
                    x="2" 
                    y="2" 
                    width="371" 
                    height="808" 
                    rx="60" 
                    stroke="url(#gradient1)" 
                    strokeWidth="4"
                    fill="none"
                  />
                  
                  {/* Inner screen border - just outline, no fill */}
                  <rect 
                    x="10" 
                    y="10" 
                    width="355" 
                    height="792" 
                    rx="55" 
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Power button */}
                  <rect 
                    x="373" 
                    y="200" 
                    width="4" 
                    height="60" 
                    rx="2" 
                    fill="url(#gradient1)"
                  />
                  
                  {/* Volume buttons */}
                  <rect 
                    x="-2" 
                    y="150" 
                    width="4" 
                    height="40" 
                    rx="2" 
                    fill="url(#gradient1)"
                  />
                  <rect 
                    x="-2" 
                    y="200" 
                    width="4" 
                    height="40" 
                    rx="2" 
                    fill="url(#gradient1)"
                  />
                  
                  {/* Mute switch */}
                  <rect 
                    x="-2" 
                    y="100" 
                    width="4" 
                    height="30" 
                    rx="2" 
                    fill="url(#gradient1)"
                  />
                  
                  {/* Dynamic Island */}
                  <rect 
                    x="125" 
                    y="20" 
                    width="125" 
                    height="35" 
                    rx="17.5" 
                    fill="#1a1a1a"
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#888888" />
                      <stop offset="50%" stopColor="#bbbbbb" />
                      <stop offset="100%" stopColor="#888888" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Screen content container - positioned behind the frame */}
                <div className="absolute inset-[12px] rounded-[48px] overflow-hidden bg-black z-10">
                  {/* Screen background */}
                  <div className="absolute inset-0 bg-white dark:bg-gray-900">
                    {/* Status bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-black dark:bg-gray-800 flex items-center justify-between px-6 text-white">
                      <span className="text-xs font-medium">9:41</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-3" viewBox="0 0 24 18" fill="white">
                          <rect x="0" y="6" width="6" height="12" rx="1" />
                          <rect x="8" y="4" width="6" height="14" rx="1" />
                          <rect x="16" y="2" width="6" height="16" rx="1" />
                        </svg>
                        <svg className="w-4 h-3" viewBox="0 0 24 18" fill="white">
                          <path d="M1 9C6 3 11 0 16 0C20 0 23 2 24 4L22 6C21 5 19 4 16 4C12 4 9 6 6 9L1 9Z" />
                          <path d="M5 13C7 11 10 10 12 10C14 10 16 11 17 12L15 14C14.5 13.5 13.5 13 12 13C10.5 13 9.5 13.5 9 14L5 13Z" />
                          <circle cx="12" cy="17" r="1" />
                        </svg>
                        <svg className="w-6 h-3" viewBox="0 0 28 14" fill="none" stroke="white" strokeWidth="1.5">
                          <rect x="1" y="3" width="20" height="8" rx="2" />
                          <rect x="22" y="5.5" width="3" height="3" rx="0.5" fill="white" />
                          <rect x="3" y="5" width="16" height="4" rx="1" fill="white" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Main content area with smooth transitions */}
                    <div className="absolute top-12 left-0 right-0 bottom-8 overflow-hidden">
                      <div className="w-full h-full transition-opacity duration-300 ease-in-out">
                        {mounted && phoneScreens[currentScreen]?.content}
                      </div>
                    </div>
                    
                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black dark:bg-gray-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}