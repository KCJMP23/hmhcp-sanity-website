"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { FrostedGlassCard } from "@/components/frosted-glass-card"
import { Typography } from "@/components/ui/apple-typography"

// Platform data
const platforms = [
  {
    id: "intellic",
    name: "IntelliC Health Platform",
    description: "Comprehensive clinical data management and analytics platform",
    image: "/intellic-platform-dashboard.png",
    features: ["Electronic Health Records", "Clinical Decision Support", "Analytics Dashboard"],
    href: "/platforms/intellic",
  },
  {
    id: "precognitive",
    name: "Precognitive Health",
    description: "AI-powered predictive analytics for patient risk assessment",
    image: "/precognitive-health-dashboard.png",
    features: ["Risk Prediction", "Early Intervention", "Outcome Tracking"],
    href: "/platforms/precognitive-health",
  },
  {
    id: "wear-api",
    name: "WEAR API",
    description: "Wearable device integration platform for continuous monitoring",
    image: "/wearapi-dashboard.png",
    features: ["Device Integration", "Real-time Monitoring", "Patient App"],
    href: "/platforms/wear-api",
  },
  {
    id: "peregrine",
    name: "Peregrine Medical Press",
    description: "Digital publishing platform for medical education and research",
    image: "/peregrine-device-mockup.png",
    features: ["Interactive Content", "CME Tracking", "Research Library"],
    href: "/platforms/peregrine-medical-press",
  },
]

export function PlatformHorizontalShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [50, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  // Handle manual navigation
  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const itemWidth = container.scrollWidth / platforms.length
      container.scrollTo({
        left: itemWidth * index,
        behavior: "smooth",
      })
      setActiveIndex(index)
    }
  }

  // Handle next/prev navigation
  const handlePrev = () => {
    const newIndex = activeIndex === 0 ? platforms.length - 1 : activeIndex - 1
    scrollToIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex = activeIndex === platforms.length - 1 ? 0 : activeIndex + 1
    scrollToIndex(newIndex)
  }

  // Update active index on scroll
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const itemWidth = container.scrollWidth / platforms.length
      const index = Math.round(container.scrollLeft / itemWidth)
      if (index !== activeIndex) {
        setActiveIndex(index)
      }
    }
  }

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [activeIndex])

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
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
            Our Platforms
          </span>
          <Typography as="h2" variant="heading1" className="mb-4 dark:text-white">
            Digital Health Solutions
          </Typography>
          <Typography as="p" variant="body" className="max-w-3xl mx-auto">
            Innovative platforms designed to transform healthcare delivery and improve patient outcomes
          </Typography>
        </motion.div>

        {/* Platform Device Mockup */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ y, opacity }}
            className="relative mx-auto max-w-4xl"
          >
            <div className="relative">
              {/* Device Frame */}
              <div className="relative z-10 mx-auto transform perspective-1000 rotate-x-5 shadow-2xl -[2.5rem] border-8 border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 w-full max-w-3xl aspect-[16/10]">
                {/* Screen Content */}
                <div className="absolute inset-0 overflow-hidden -[1.8rem] bg-white dark:bg-gray-900">
                  <Image
                    src={platforms[activeIndex].image || "/placeholder.svg"}
                    alt={platforms[activeIndex].name}
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
          </motion.div>
        </div>

        {/* Platform Showcase */}
        <div className="relative">
          {/* Navigation Controls */}
          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2 md:left-8">
            <motion.button
              onClick={() => {
                handlePrev()
                triggerHapticFeedback()
              }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous platform"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
          </div>
          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2 md:right-8">
            <motion.button
              onClick={() => {
                handleNext()
                triggerHapticFeedback()
              }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              aria-label="Next platform"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
          </div>

          {/* Horizontal Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-hidden snap-x snap-mandatory hide-scrollbar pb-12"
            style={{ scrollbarWidth: "none" }}
          >
            {platforms.map((platform, index) => (
              <div
                key={platform.id}
                className="min-w-full md:min-w-[90%] lg:min-w-[80%] xl:min-w-[60%] flex-shrink-0 snap-center px-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <FrostedGlassCard hoverEffect={true} rotate3d={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                      <div className="relative h-64 md:h-auto">
                        <Image
                          src={platform.image || "/placeholder.svg"}
                          alt={platform.name}
                          fill
                          className="object-cover"
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
                                <span className="w-2 h-2 bg-blue-500 mr-2"></span>
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
                            <motion.span
                              initial={{ x: 0 }}
                              whileHover={{ x: 5 }}
                              transition={{ duration: 0.2 }}
                              className="ml-2 inline-block"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </motion.span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </FrostedGlassCard>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {platforms.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollToIndex(index)
                  triggerHapticFeedback()
                }}
                className={`h-2  transition-all ${
                  activeIndex === index ? "w-8 bg-blue-600" : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
                aria-label={`Go to platform ${index + 1}`}
                aria-current={activeIndex === index ? "true" : "false"}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/platforms">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerHapticFeedback}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
            >
              View All Platforms <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  )
}
