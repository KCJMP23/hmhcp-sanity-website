'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { HeroSlide } from "@/lib/supabase-content"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"

export interface SlideData {
  id: string
  title: string
  subtitle: string
  description: string
  primaryCTA: {
    text: string
    href: string
  }
  secondaryCTA: {
    text: string
    href: string
  }
  backgroundGradient: string
  backgroundImage?: string
  badge?: string
  order: number
  isActive: boolean
}

interface HealthcareHeroSlideshowProps {
  slides?: SlideData[] | HeroSlide[]
  autoplayDelay?: number
  className?: string
}

const defaultSlides: SlideData[] = [
  {
    id: "cro-venture-model",
    title: "CRO-Venture Model for Healthcare Innovation",
    subtitle: "Accelerating Digital Health Startups to Market",
    description: "Our unique CRO-venture model provides comprehensive clinical research services and funding to support digital health innovation from preclinical studies through FDA approval.",
    primaryCTA: {
      text: "Explore CRO Services",
      href: "/research"
    },
    secondaryCTA: {
      text: "Partner With Us",
      href: "/contact"
    },
    backgroundGradient: "from-blue-900 via-blue-800 to-indigo-900",
    backgroundImage: "/hero-research.jpg",
    badge: "CRO-Venture Leader",
    order: 1,
    isActive: true
  },
  {
    id: "digital-health-ecosystem",
    title: "ONEHealth Ecosystem Platform",
    subtitle: "Integrated Clinical Research Technology",
    description: "Revolutionary platform connecting EHR systems, wearable devices, and clinical workflows to enable technology-driven trials and comprehensive digital health solutions.",
    primaryCTA: {
      text: "View Platforms",
      href: "/platforms"
    },
    secondaryCTA: {
      text: "See Partners",
      href: "/partners"
    },
    backgroundGradient: "from-blue-900 via-blue-800 to-blue-700",
    backgroundImage: "/hero-technology.jpg",
    badge: "Digital Health Innovation",
    order: 2,
    isActive: true
  },
  {
    id: "clinical-trial-excellence",
    title: "Technology-Driven Clinical Trials",
    subtitle: "Faster, More Efficient Research",
    description: "Advanced clinical trial management with AI-powered analytics, regulatory expertise, and comprehensive data management for biotech and mHealth startups.",
    primaryCTA: {
      text: "Start Clinical Trial",
      href: "/contact"
    },
    secondaryCTA: {
      text: "Research Capabilities",
      href: "/research/clinical-studies"
    },
    backgroundGradient: "from-blue-800 via-blue-700 to-blue-600",
    backgroundImage: "/hero-consultation.jpg",
    badge: "Clinical Trial Excellence",
    order: 3,
    isActive: true
  },
  {
    id: "healthcare-analytics-qi",
    title: "Evidence-Based Healthcare Analytics & QI Studies",
    subtitle: "Quality Improvement Research",
    description: "Specialized CRO services for quality improvement research, healthcare analytics, and evidence generation driving measurable patient outcomes.",
    primaryCTA: {
      text: "QI Research Services",
      href: "/research/qa-qi"
    },
    secondaryCTA: {
      text: "View Analytics Platform",
      href: "/platforms"
    },
    backgroundGradient: "from-blue-700 via-blue-600 to-blue-500",
    backgroundImage: "/hero-research.jpg",
    badge: "Quality Improvement Research",
    order: 4,
    isActive: true
  }
]

export function HealthcareHeroSlideshow({ 
  slides = defaultSlides, 
  autoplayDelay = 6000,
  className 
}: HealthcareHeroSlideshowProps) {
  // Ensure we have slides and filter active slides and sort by order
  const slidesToUse = slides && slides.length > 0 ? slides : defaultSlides
  const activeSlides = slidesToUse
    .filter(slide => slide.isActive)
    .sort((a, b) => a.order - b.order)
  
  // Debug logging
  console.log('Active slides:', activeSlides.map(slide => ({
    id: slide.id,
    backgroundImage: slide.backgroundImage,
    title: slide.title
  })))
  
  const [api, setApi] = React.useState<any>()
  const [current, setCurrent] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(true)

  // Add dark background class for navigation transparency
  React.useEffect(() => {
    document.body.classList.add('has-dark-background')
    
    return () => {
      document.body.classList.remove('has-dark-background')
    }
  }, [])
  
  const autoplay = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false })
  )

  React.useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    onSelect()

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  React.useEffect(() => {
    if (!api) return
    
    if (isPlaying) {
      autoplay.current.play()
    } else {
      autoplay.current.stop()
    }
  }, [api, isPlaying])

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
    if (api) {
      if (isPlaying) {
        autoplay.current.stop()
      } else {
        autoplay.current.play()
      }
    }
  }

  return (
    <section className={cn("relative min-h-screen flex items-center justify-center overflow-hidden", className)}>
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        plugins={[autoplay.current]}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="h-screen -ml-0">
          {activeSlides.map((slide) => (
            <CarouselItem key={slide.id} className="h-screen pl-0">
              <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                {/* Background Image using img tag */}
                <img 
                  src={slide.backgroundImage}
                  alt="Healthcare background"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  style={{ transform: 'scale(1.05)', transformOrigin: 'center' }}
                />
                {/* Blue gradient overlay for readability and theme consistency */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/50 to-indigo-900/65 dark:from-blue-950/70 dark:via-blue-900/60 dark:to-indigo-950/75 z-10" />
                
                {/* Content */}
                <div className="relative z-40 max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 text-white py-12 md:py-16 lg:py-20 xl:py-24" style={{
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)',
                  fontFamily: 'SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
                }}>
                  {slide.badge && (
                    <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 text-xs sm:text-sm font-light mb-4 sm:mb-6 shadow-lg" style={{
                      backdropFilter: 'blur(20px) saturate(180%)',
                      boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 2px 8px rgba(255, 255, 255, 0.2)'
                    }}>
                      {slide.badge}
                    </div>
                  )}
                  
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl opacity-90 mb-3 sm:mb-4 md:mb-6 tracking-wide" style={{
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    fontWeight: '300'
                  }}>
                    {slide.subtitle}
                  </p>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl mb-4 sm:mb-6 md:mb-8 leading-tight tracking-tight" style={{
                    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    fontWeight: '300'
                  }}>
                    {slide.title}
                  </h1>
                  
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl opacity-85 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed" style={{
                    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                    fontWeight: '300'
                  }}>
                    {slide.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center">
                    <LiquidGlassButton 
                      variant="primary" 
                      size="cta" 
                      href={slide.primaryCTA.href}
                    >
                      {slide.primaryCTA.text}
                    </LiquidGlassButton>
                    <LiquidGlassButton 
                      variant="secondary" 
                      size="cta" 
                      href={slide.secondaryCTA.href}
                    >
                      {slide.secondaryCTA.text}
                    </LiquidGlassButton>
                  </div>
                </div>

              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Navigation */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
          {/* Slide indicators */}
          <div className="flex gap-1.5 sm:gap-2 bg-white/15 dark:bg-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 border border-white/30 dark:border-white/20" style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 2px 8px rgba(255, 255, 255, 0.2)'
          }}>
            {activeSlides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300",
                  current === index
                    ? "bg-white scale-125 shadow-sm"
                    : "bg-white/50 dark:bg-white/40 hover:bg-white/70 dark:hover:bg-white/60"
                )}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Custom Arrow Navigation */}
        <div className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-50">
          <CarouselPrevious 
            className="bg-white/20 dark:bg-white/15 backdrop-blur-md border-white/40 dark:border-white/30 text-white hover:bg-white/30 dark:hover:bg-white/25 w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 shadow-lg"
            variant="outline"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
        
        <div className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-50">
          <CarouselNext 
            className="bg-white/20 dark:bg-white/15 backdrop-blur-md border-white/40 dark:border-white/30 text-white hover:bg-white/30 dark:hover:bg-white/25 w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 shadow-lg"
            variant="outline"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </Carousel>
    </section>
  )
}