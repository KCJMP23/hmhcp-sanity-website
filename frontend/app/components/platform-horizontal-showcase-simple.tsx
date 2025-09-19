"use client"

import { useState, useRef, useEffect, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { FrostedGlassCard } from "@/components/frosted-glass-card-simple"
import { Typography } from "@/components/ui/apple-typography"
import { FadeIn } from "@/components/animations-simple"

// Platform data
const platforms = [
  {
    id: "intellic",
    name: "IntelliC Health Platform",
    description: "Comprehensive clinical data management and analytics platform",
    image: "/healthcare-data-analysis.jpg",
    features: ["Electronic Health Records", "Clinical Decision Support", "Analytics Dashboard"],
    href: "/platforms/intellic",
  },
  {
    id: "precognitive",
    name: "Precognitive Health",
    description: "AI-powered predictive analytics for patient risk assessment",
    image: "/medical-technology.jpg",
    features: ["Risk Prediction", "Early Intervention", "Outcome Tracking"],
    href: "/platforms/precognitive-health",
  },
  {
    id: "wear-api",
    name: "WEAR API",
    description: "Wearable device integration platform for continuous monitoring",
    image: "/digital-health-interface.jpg",
    features: ["Device Integration", "Real-time Monitoring", "Patient App"],
    href: "/platforms/wear-api",
  },
  {
    id: "peregrine",
    name: "Peregrine Medical Press",
    description: "Digital publishing platform for medical education and research",
    image: "/medical-research.jpg",
    features: ["Interactive Content", "CME Tracking", "Research Library"],
    href: "/platforms/peregrine-medical-press",
  },
]

function PlatformHorizontalShowcaseComponent() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Premium autoslider functionality
  const startAutoPlay = () => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
    }
    autoPlayIntervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % platforms.length)
    }, 4000) // 4 seconds interval
  }

  const stopAutoPlay = () => {
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current)
      autoPlayIntervalRef.current = null
    }
  }

  // Handle manual navigation
  const scrollToIndex = (index: number, updateIndex: boolean = true) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = container.clientWidth // Full container width per card
      container.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      })
      if (updateIndex) {
        setActiveIndex(index)
      }
    }
  }

  // Handle next/prev navigation
  const handlePrev = () => {
    const newIndex = activeIndex === 0 ? platforms.length - 1 : activeIndex - 1
    scrollToIndex(newIndex)
    stopAutoPlay()
    if (isAutoPlaying) {
      setTimeout(() => startAutoPlay(), 1000) // Resume after 1 second
    }
  }

  const handleNext = () => {
    const newIndex = activeIndex === platforms.length - 1 ? 0 : activeIndex + 1
    scrollToIndex(newIndex)
    stopAutoPlay()
    if (isAutoPlaying) {
      setTimeout(() => startAutoPlay(), 1000) // Resume after 1 second
    }
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
    if (!isAutoPlaying) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }
  }

  // Update active index on scroll (only for manual scrolling)
  const handleScroll = () => {
    if (scrollContainerRef.current && !isAutoPlaying) {
      const container = scrollContainerRef.current
      const cardWidth = container.clientWidth // Full container width per card
      const index = Math.round(container.scrollLeft / cardWidth)
      if (index !== activeIndex && index >= 0 && index < platforms.length) {
        setActiveIndex(index)
      }
    }
  }

  // Auto-scroll effect - scroll when activeIndex changes
  useEffect(() => {
    scrollToIndex(activeIndex, false) // Don't update index to avoid rectangular dependency
  }, [activeIndex])

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay()
    } else {
      stopAutoPlay()
    }

    return () => stopAutoPlay()
  }, [isAutoPlaying])

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [activeIndex])

  // Pause on hover
  const handleMouseEnter = () => {
    if (isAutoPlaying) {
      stopAutoPlay()
    }
  }

  const handleMouseLeave = () => {
    if (isAutoPlaying) {
      startAutoPlay()
    }
  }

  // Haptic feedback function (will only work on supported devices)
  const triggerHapticFeedback = () => {
    if (typeof window !== "undefined" && "navigator" in window) {
      if (navigator.vibrate) {
        navigator.vibrate(10) // 10ms vibration
      }
    }
  }

  return (
    <section
      ref={sectionRef}
      className="w-full py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden"
    >
      <div className="container mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="inline-block bg-blue-100 dark:bg-blue-900/50 rounded-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 mb-4">
            Our Platforms
          </span>
          <Typography as="h2" variant="heading1" className="mb-4 dark:text-white">
            Digital Health Solutions
          </Typography>
          <Typography as="p" variant="body" className="max-w-3xl mx-auto">
            Innovative platforms designed to transform healthcare delivery and improve patient outcomes
          </Typography>
        </FadeIn>

        {/* Platform Device Mockup */}
        <div className="mb-16">
          <FadeIn className="relative mx-auto max-w-4xl">
            <div className="relative">
              {/* Device Frame */}
              <div className="relative z-20 mx-auto transform perspective-1000 rotate-x-5 shadow-2xl rounded-[2.5rem] border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 w-full max-w-3xl aspect-[16/10]">
                {/* Screen Content Container */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.8rem] bg-white dark:bg-gray-900 z-0">
                  {/* Image Layer - Behind everything */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={platforms[activeIndex].image || "/placeholder.svg"}
                      alt={platforms[activeIndex].name}
                      fill
                      className="object-cover"
                      priority={activeIndex === 0}
                    />
                  </div>

                  {/* Reflection Overlay - On top of image */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/10 z-10"></div>
                </div>
              </div>

              {/* Device Stand/Shadow */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-4 bg-gradient-to-t from-gray-400/50 to-transparent dark:from-gray-700/50 blur-md z-0"></div>
            </div>
          </FadeIn>
        </div>

        {/* Platform Showcase */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Premium Autoplay Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => {
                toggleAutoPlay()
                triggerHapticFeedback()
              }}
              className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2 md:left-8">
            <button
              onClick={() => {
                handlePrev()
                triggerHapticFeedback()
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Previous platform"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2 md:right-8">
            <button
              onClick={() => {
                handleNext()
                triggerHapticFeedback()
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Next platform"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Horizontal Scroll Container - PROPERLY Fixed cut-off issue */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-hidden snap-x snap-mandatory hide-scrollbar pb-12"
            style={{ scrollbarWidth: "none" }}
          >
            {platforms.map((platform, index) => (
              <div
                key={platform.id}
                className="w-full flex-shrink-0 snap-center px-4"
              >
                <FadeIn delay={0.1 * index}>
                  <FrostedGlassCard hoverEffect={true} rotate3d={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                      <div className="relative h-64 md:h-auto">
                        <Image
                          src={platform.image || "/placeholder.svg"}
                          alt={platform.name}
                          fill
                          className="object-cover rounded-2xl"
                          priority={index === 0}
                          sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-transparent md:hidden"></div>
                      </div>
                      <div className="p-8 md:p-10 flex flex-col">
                        <Typography as="h3" variant="heading3" className="mb-3">
                          {platform.name}
                        </Typography>
                        <Typography as="p" variant="body" className="mb-6">
                          {platform.description}
                        </Typography>

                        <div className="mb-8">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Key Features</h4>
                          <ul className="space-y-2">
                            {platform.features.map((feature, i) => (
                              <li key={i} className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto">
                          <Link
                            href={platform.href}
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
                            onClick={triggerHapticFeedback}
                          >
                            Learn more
                            <span className="ml-2 inline-block transform group-hover:translate-x-1 transition-transform">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </FrostedGlassCard>
                </FadeIn>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination Indicators with Progress */}
          <div className="flex justify-center mt-8 gap-2">
            {platforms.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollToIndex(index)
                  triggerHapticFeedback()
                }}
                className={`h-2 rounded-sm transition-all duration-300 ${
                  activeIndex === index 
                    ? "w-8 bg-blue-600" 
                    : "w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                }`}
                aria-label={`Go to platform ${index + 1}`}
                aria-current={activeIndex === index ? "true" : "false"}
              />
            ))}
          </div>

          {/* Premium Progress Bar */}
          {isAutoPlaying && (
            <div className="flex justify-center mt-4">
              <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-blue-600  transition-all duration-&lsqb;4000ms&rsqb; ease-linear ${
                    isAutoPlaying ? 'animate-[progress-bar_4s_linear_infinite]' : ''
                  }`}
                  style={{
                    '--tw-progress-start': '0%',
                    '--tw-progress-end': '100%'
                  } as React.CSSProperties}
                />
              </div>
            </div>
          )}
        </div>


        <div className="text-center mt-12">
          <Link href="/platforms">
            <button
              onClick={triggerHapticFeedback}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-xl active:scale-[0.98] transition-all duration-200 shadow-md rounded-full"
            >
              View All Platforms <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Export memoized component for better performance
export const PlatformHorizontalShowcase = memo(PlatformHorizontalShowcaseComponent)