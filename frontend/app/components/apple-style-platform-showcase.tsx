"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Brain, Users, BarChart3, AlertTriangle, Bell, TrendingUp, Watch, Heart, Smartphone } from "lucide-react"
import { AppleLinkButton } from "./apple-style-button"
import { FrostedGlassCard, FrostedGlassCardContent } from "./frosted-glass-card"

// Platform data type
interface PlatformFeature {
  title: string
  description: string
  icon: React.ReactNode
}

interface Platform {
  id: number
  name: string
  description: string
  image: string
  features: PlatformFeature[]
  slug: string
}

// Sample platform data - in a real app, this would come from your data source
const platforms: Platform[] = [
  {
    id: 1,
    name: "IntelliC Health Platform",
    description: "Comprehensive patient management system with integrated analytics and clinical decision support.",
    image: "/intellic-ehr-screen.svg",
    features: [
      {
        title: "Clinical Decision Support",
        description: "AI-powered recommendations based on patient data and medical best practices.",
        icon: <Brain className="w-8 h-8 text-blue-600" />,
      },
      {
        title: "Patient Engagement",
        description: "Secure messaging, appointment scheduling, and health tracking for patients.",
        icon: <Users className="w-8 h-8 text-blue-600" />,
      },
      {
        title: "Analytics Dashboard",
        description: "Real-time insights into clinical operations and patient outcomes.",
        icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      },
    ],
    slug: "intellic",
  },
  {
    id: 2,
    name: "Precognitive Health",
    description: "AI-powered predictive analytics for patient risk assessment and early intervention.",
    image: "/platform-precognitive-detail.svg",
    features: [
      {
        title: "Risk Prediction",
        description: "Advanced algorithms to identify patients at risk for adverse events.",
        icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
      },
      {
        title: "Early Intervention",
        description: "Automated alerts and care pathways for preventive intervention.",
        icon: <Bell className="w-8 h-8 text-orange-600" />,
      },
      {
        title: "Outcome Tracking",
        description: "Longitudinal tracking of patient outcomes and intervention effectiveness.",
        icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      },
    ],
    slug: "precognitive-health",
  },
  {
    id: 3,
    name: "WEAR API",
    description: "Wearable device integration platform for continuous patient monitoring and data collection.",
    image: "/wearable-health-tech.svg",
    features: [
      {
        title: "Device Integration",
        description: "Seamless connectivity with popular wearable health devices and sensors.",
        icon: <Watch className="w-8 h-8 text-green-600" />,
      },
      {
        title: "Real-time Monitoring",
        description: "Continuous tracking of vital signs and health metrics with alert thresholds.",
        icon: <Heart className="w-8 h-8 text-green-600" />,
      },
      {
        title: "Patient App",
        description: "User-friendly mobile application for patients to view their health data.",
        icon: <Smartphone className="w-8 h-8 text-green-600" />,
      },
    ],
    slug: "wear-api",
  },
]

export function AppleStylePlatformShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  // Auto-cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      const platform = platforms[activeIndex]
      if (platform) {
        setActiveFeature((prev) => (prev + 1) % platform.features.length)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [activeIndex])

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % platforms.length)
    setActiveFeature(0)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + platforms.length) % platforms.length)
    setActiveFeature(0)
  }

  const handleDotClick = (index: number) => {
    setActiveIndex(index)
    setActiveFeature(0)
  }

  const activePlatform = platforms[activeIndex]

  return (
    <section
      className="py-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      ref={containerRef}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 mb-4">
            Our Platforms
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4 dark:text-white">
            Innovative Digital Health Platforms
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our cutting-edge platforms are designed to transform healthcare delivery and improve patient outcomes
          </p>
        </motion.div>

        <div className="relative">
          {/* Device Mockup with Platform */}
          <motion.div
            className="relative mx-auto max-w-4xl"
            style={{ y, opacity }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.42, 0, 0.58, 1] }}
          >
            <div className="relative">
              {/* Device Frame */}
              <div className="relative z-10 mx-auto transform perspective-1000 rotate-x-5 shadow-2xl -[2.5rem] border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 w-full max-w-3xl aspect-[16/10]">
                {/* Screen Content */}
                <div className="absolute inset-0 overflow-hidden -[1.8rem] bg-white dark:bg-gray-900">
                  <Image
                    src={activePlatform.image || "/placeholder.svg"}
                    alt={activePlatform.name}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Reflection Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/10"></div>
                </div>
              </div>

              {/* Device Stand/Shadow */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-4 bg-gradient-to-t from-gray-400/50 to-transparent dark:from-gray-700/50 blur-md"></div>
            </div>

            {/* Platform Info */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, ease: [0.42, 0, 0.58, 1] }}
            >
              <h3 className="text-2xl font-medium mb-2 dark:text-white">{activePlatform.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">{activePlatform.description}</p>

              {/* Feature Spotlight */}
              <FrostedGlassCard className="max-w-2xl mx-auto" intensity="light">
                <FrostedGlassCardContent>
                  <div className="flex items-center justify-center mb-4">
                    {activePlatform.features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveFeature(index)}
                        className={`w-2.5 h-2.5  mx-1.5 transition-all ${
                          index === activeFeature
                            ? "bg-primary-600 dark:bg-primary-400 scale-125"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                        aria-label={`Feature ${index + 1}`}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeIndex}-${activeFeature}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                      className="text-center"
                    >
                      <div className="mb-3 flex justify-center">{activePlatform.features[activeFeature].icon}</div>
                      <h4 className="text-xl font-medium mb-2 dark:text-white">
                        {activePlatform.features[activeFeature].title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {activePlatform.features[activeFeature].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </FrostedGlassCardContent>
              </FrostedGlassCard>

              <div className="mt-8">
                <AppleLinkButton
                  href={`/platforms/${activePlatform.slug}`}
                  variant="primary"
                  size="large"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Learn more about {activePlatform.name}
                </AppleLinkButton>
              </div>
            </motion.div>
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={handlePrev}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous platform"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="flex space-x-2">
              {platforms.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3  transition-all ${
                    index === activeIndex
                      ? "bg-primary-600 dark:bg-primary-400 scale-125"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={`Platform ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next platform"
            >
              <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
