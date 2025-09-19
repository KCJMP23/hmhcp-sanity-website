"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"

// Platform data
const platforms = [
  {
    id: "intellic",
    name: "IntelliC Health Platform",
    description: "Comprehensive clinical data management and analytics platform",
    image: "/intellic-ehr-screen.svg",
    features: ["Electronic Health Records", "Clinical Decision Support", "Analytics Dashboard"],
    href: "/platforms/intellic",
  },
  {
    id: "precognitive",
    name: "Precognitive Health",
    description: "AI-powered predictive analytics for patient risk assessment",
    image: "/platform-precognitive-detail.svg",
    features: ["Risk Prediction", "Early Intervention", "Outcome Tracking"],
    href: "/platforms/precognitive-health",
  },
  {
    id: "wear-api",
    name: "WEAR API",
    description: "Wearable device integration platform for continuous monitoring",
    image: "/wearable-health-tech.svg",
    features: ["Device Integration", "Real-time Monitoring", "Patient App"],
    href: "/platforms/wear-api",
  },
  {
    id: "peregrine",
    name: "Peregrine Medical Press",
    description: "Digital publishing platform for medical education and research",
    image: "/peregrine-overview.svg",
    features: ["Interactive Content", "CME Tracking", "Research Library"],
    href: "/platforms/peregrine-medical-press",
  },
]

export function PlatformShowcase() {
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

        {/* Platform Showcase */}
        <div className="relative">
          {/* Navigation Controls */}
          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2 md:left-8">
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 rounded-full font-light"
              aria-label="Previous platform"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
          </div>
          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2 md:right-8">
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 rounded-full font-light"
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
                className="min-w-full md:min-w-[80%] lg:min-w-[60%] flex-shrink-0 snap-center px-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassmorphismCard hoverEffect={true} highlightBorder={true} coloredShadow={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                      <div className="relative h-64 md:h-auto">
                        <Image
                          src={platform.image || "/placeholder.svg"}
                          alt={platform.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  </GlassmorphismCard>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {platforms.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md border border-blue-400/30 dark:border-blue-300/40"
            >
              View All Platforms <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  )
}
