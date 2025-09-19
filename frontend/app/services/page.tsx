"use client"

import { AppleStyleHero } from "@/components/apple-style-hero-simple"
import { FrostedGlassCard } from "@/components/frosted-glass-card-simple"
import { typography, spacing, componentClasses } from "@/lib/constants/typography"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations-simple"
import { Stethoscope, Users, Shield, Lightbulb, Target, Award, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { SoftBlueIconWrapper } from "@/components/ui/icon-wrapper"
import { useState, useEffect } from "react"

// Type definitions for Supabase content structure
interface ServicesHero {
  title: string
  subtitle: string
  primaryCTA: {
    text: string
    href: string
  }
  secondaryCTA: {
    text: string
    href: string
  }
  backgroundImage?: {
    _type: 'image'
    asset: any
  }
}

interface ServiceItem {
  _key: string
  title: string
  description: string
  features: string[]
  icon: string
  image?: {
    _type: 'image'
    asset: any
  }
}

interface ProcessStep {
  _key: string
  step: string
  title: string
  description: string
  duration: string
}

interface ServicesSection {
  _type: 'servicesSection'
  _key: string
  title: string
  subtitle: string
  services: ServiceItem[]
}

interface ProcessSection {
  _type: 'processSection'
  _key: string
  title: string
  subtitle: string
  steps: ProcessStep[]
}

interface ServicesData {
  _id: string
  _type: 'servicesPage'
  hero: ServicesHero
  sections: Array<ServicesSection | ProcessSection>
  seo?: {
    title: string
    description: string
    keywords: string[]
  }
}

// Helper function to find section by type
function findSection<T>(sections: ServicesData['sections'], type: string): T | undefined {
  return sections?.find(section => section._type === type) as T
}

// Safe image URL function
function safeImageUrl(image: any, fallback: string): string {
  if (image?.asset?.url) return image.asset.url
  return fallback
}

// Static fallback data for when CMS is unavailable
function getServicesStaticFallback(): ServicesData {
  return {
    _id: 'fallback',
    _type: 'servicesPage',
    hero: {
      title: "Healthcare Services & Solutions",
      subtitle: "Comprehensive healthcare consulting and implementation services tailored to transform your organization",
      primaryCTA: {
        text: "Explore Services",
        href: "#services"
      },
      secondaryCTA: {
        text: "Contact Us",
        href: "/contact"
      }
    },
    sections: [
      {
        _type: 'servicesSection',
        _key: 'services',
        title: "Our Healthcare Services",
        subtitle: "End-to-end solutions designed to improve patient outcomes and operational efficiency",
        services: [
          {
            _key: 'consulting',
            title: "Strategic Consulting",
            description: "Transform your healthcare organization with data-driven strategies and expert guidance",
            features: ["Digital transformation roadmaps", "Operational efficiency analysis", "Technology integration planning"],
            icon: "Lightbulb"
          },
          {
            _key: 'implementation',
            title: "Implementation Services",
            description: "Full-service implementation support for healthcare technology solutions",
            features: ["Project management", "Change management", "Training and adoption", "Go-live support"],
            icon: "Target"
          },
          {
            _key: 'research',
            title: "Clinical Research",
            description: "Comprehensive clinical research services from protocol design to regulatory submission",
            features: ["Protocol development", "Data management", "Statistical analysis", "Regulatory compliance"],
            icon: "Stethoscope"
          },
          {
            _key: 'quality',
            title: "Quality Improvement",
            description: "Systematic approaches to enhance patient safety and care quality",
            features: ["QI program design", "Performance metrics", "Risk assessment", "Compliance monitoring"],
            icon: "Shield"
          },
          {
            _key: 'education',
            title: "Education & Training",
            description: "Professional development programs for healthcare teams and organizations",
            features: ["Custom curricula", "Certification programs", "Online learning platforms", "Competency assessments"],
            icon: "Users"
          },
          {
            _key: 'analytics',
            title: "Analytics & Insights",
            description: "Data-driven insights to improve clinical and operational outcomes",
            features: ["Predictive analytics", "Population health", "Performance dashboards", "ROI analysis"],
            icon: "Award"
          }
        ]
      },
      {
        _type: 'processSection',
        _key: 'process',
        title: "Our Proven Process",
        subtitle: "A systematic approach to delivering exceptional healthcare solutions",
        steps: [
          {
            _key: 'discovery',
            step: "01",
            title: "Discovery",
            description: "Understanding your unique challenges and goals",
            duration: "1-2 weeks"
          },
          {
            _key: 'strategy',
            step: "02",
            title: "Strategy",
            description: "Developing tailored solutions and roadmaps",
            duration: "2-3 weeks"
          },
          {
            _key: 'implementation',
            step: "03",
            title: "Implementation",
            description: "Executing with precision and expertise",
            duration: "4-12 weeks"
          },
          {
            _key: 'optimization',
            step: "04",
            title: "Optimization",
            description: "Continuous improvement and support",
            duration: "Ongoing"
          }
        ]
      }
    ]
  }
}

export default function ServicesPage() {
  const [pageData, setPageData] = useState<ServicesData>(getServicesStaticFallback())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/cms/pages/services', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          // If API returns null or empty data, use fallback
          if (data && data.hero && data.sections) {
            setPageData(data)
          } else {
            console.log('API returned empty/null data, using fallback')
            setPageData(getServicesStaticFallback())
          }
        } else if (response.status === 404) {
          console.log('Services API route not found, using fallback data')
          setPageData(getServicesStaticFallback())
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching services data:', errorMessage)
        setError(errorMessage)
        setPageData(getServicesStaticFallback())
      } finally {
        setLoading(false)
      }
    }

    fetchServicesData()
  }, [])

  // Extract sections from the data
  const servicesSection = findSection<ServicesSection>(pageData.sections, 'servicesSection')
  const processSection = findSection<ProcessSection>(pageData.sections, 'processSection')

  // Loading state
  if (loading) {
    return (
      <main className="flex flex-col w-full min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className={typography.body + " mt-4"}>
              Loading services...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <AppleStyleHero
        title={pageData.hero.title}
        subtitle={pageData.hero.subtitle}
        primaryCTA={pageData.hero.primaryCTA}
        secondaryCTA={pageData.hero.secondaryCTA}
        backgroundImage={safeImageUrl(
          pageData.hero.backgroundImage,
          "/healthcare-data-analysis.jpg"
        )}
        height="full"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-900/65"
      />

      {/* Services Section */}
      {servicesSection && (
        <section id="services" className="py-16 md:py-24 bg-white dark:bg-gray-900">
          <div className={spacing.container}>
            <FadeIn className={componentClasses.sectionHeaderGroup}>
              <h2 className={typography.sectionHeader}>
                {servicesSection.title}
              </h2>
              <p className={typography.sectionSubtitle}>
                {servicesSection.subtitle}
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {servicesSection.services?.map((service, index) => {
                const IconComponent = {
                  Lightbulb,
                  Target,
                  Stethoscope,
                  Shield,
                  Users,
                  Award
                }[service.icon] || Lightbulb

                return (
                  <StaggerItem key={service._key || index}>
                    <FrostedGlassCard hoverEffect className="h-full p-8 relative overflow-hidden">
                      {/* Background Image for Service */}
                      <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/85 to-white/90 dark:from-gray-900/95 dark:via-gray-900/85 dark:to-gray-900/90"></div>
                        <img 
                          src={(() => {
                            const imageMap: { [key: string]: string } = {
                              'consulting': '/healthcare-consulting-service.png',
                              'implementation': '/healthcare-services-hero.png',
                              'research': '/clinical-research-service.png',
                              'quality': '/quality-improvement-service.png',
                              'education': '/medical-education.jpg',
                              'analytics': '/healthcare-data-analysis.jpg'
                            }
                            return imageMap[service._key] || '/healthcare-services-hero.png'
                          })()} 
                          alt={`${service.title} background`}
                          className="w-full h-full object-cover opacity-30"
                        />
                      </div>
                      <div className="flex flex-col h-full relative z-10">
                        <SoftBlueIconWrapper size="lg" animate className="mb-6">
                          <IconComponent />
                        </SoftBlueIconWrapper>
                        <h3 className={typography.cardTitle + " mb-4"}>
                          {service.title}
                        </h3>
                        <p className={typography.body + " mb-6 flex-grow"}>
                          {service.description}
                        </p>
                        {service.features && service.features.length > 0 && (
                          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                            {service.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </FrostedGlassCard>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Process Section */}
      {processSection && (
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
          <div className={spacing.container}>
            <FadeIn className={componentClasses.sectionHeaderGroup}>
              <h2 className={typography.sectionHeader}>
                {processSection.title}
              </h2>
              <p className={typography.sectionSubtitle}>
                {processSection.subtitle}
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSection.steps?.map((step, index) => (
                <StaggerItem key={step._key || index}>
                  <FrostedGlassCard hoverEffect className="p-6 text-center h-full flex flex-col">
                    <div className="text-4xl font-light text-blue-600 dark:text-blue-400 mb-4">
                      {step.step}
                    </div>
                    <h4 className={typography.cardTitle + " mb-2"}>
                      {step.title}
                    </h4>
                    <p className={typography.body + " mb-4 flex-grow"}>
                      {step.description}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center mt-auto">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{step.duration}</span>
                    </div>
                  </FrostedGlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-800/80">
        <div className={spacing.containerSmall + " text-center"}>
          <FadeIn>
            <h2 className={typography.ctaTitle}>
              Ready to Transform Your Healthcare Organization?
            </h2>
            <p className={typography.ctaSubtitle}>
              Let's discuss how our services can help you achieve better outcomes
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <Link href="/contact">
                <LiquidGlassButton 
                  variant="secondary" 
                  size="lg"
                >
                  Start Your Project
                </LiquidGlassButton>
              </Link>
              <Link href="/about">
                <LiquidGlassButton 
                  variant="secondary" 
                  size="lg"
                >
                  Learn About Us
                </LiquidGlassButton>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  )
}