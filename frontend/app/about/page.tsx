"use client"

import { useState, useEffect } from "react"
import { AppleStyleHero } from "@/components/apple-style-hero-simple"
import { FrostedGlassCard } from "@/components/frosted-glass-card-simple"
import { typography, spacing, componentClasses } from "@/lib/constants/typography"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations-simple"
import { Users, Heart, Shield, Lightbulb, Target, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getPageBySlug, getTeamMembers, safeImageUrl as supabaseSafeImageUrl } from "@/lib/supabase-content"
import { SoftBlueIconWrapper } from "@/components/ui/icon-wrapper"

// Static image URL helper for build compatibility
function safeImageUrl(path: any, fallback: string = '/images/placeholder.jpg', options?: any): string {
  if (!path) return fallback
  if (typeof path === 'string' && path.startsWith('http')) return path
  return fallback
}

// Type definitions matching Sanity schema
interface AboutHero {
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

interface TeamMember {
  _key: string
  name: string
  role: string
  description: string
  image?: {
    _type: 'image'
    asset: any
  }
}

interface ValueItem {
  _key: string
  title: string
  description: string
  icon: string
}

interface MissionSection {
  _type: 'missionSection'
  _key: string
  title: string
  subtitle: string
  content: string
}

interface TeamSection {
  _type: 'teamSection'
  _key: string
  title: string
  subtitle: string
  members: TeamMember[]
}

interface ValuesSection {
  _type: 'valuesSection'
  _key: string
  title: string
  subtitle: string
  items: ValueItem[]
}

interface AboutData {
  _id: string
  _type: 'aboutPage'
  hero: AboutHero
  sections: Array<MissionSection | TeamSection | ValuesSection>
  seo?: {
    title: string
    description: string
    keywords: string[]
  }
}

// Helper function to find section by type
function findSection<T>(sections: AboutData['sections'], type: string): T | undefined {
  return sections?.find(section => section._type === type) as T
}

export default function AboutPage() {
  const [pageData, setPageData] = useState<AboutData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAboutData()
  }, [])

  const fetchAboutData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cms/pages/about')
      if (response.ok) {
        const data = await response.json()
        setPageData(data)
      } else {
        throw new Error('Failed to fetch about data')
      }
    } catch (error) {
      console.error('Error fetching about data:', error)
      // Fallback to static data on error
      setPageData(getAboutStaticFallback())
    } finally {
      setLoading(false)
    }
  }

  // Static fallback data for when CMS is not available
  const getAboutStaticFallback = (): AboutData => ({
    _id: 'fallback',
    _type: 'aboutPage',
    hero: {
      title: "Leading CRO-Venture Innovation",
      subtitle: "Accelerating digital health startups through comprehensive clinical research and technology-driven solutions",
      primaryCTA: {
        text: "Explore CRO Services",
        href: "/research"
      },
      secondaryCTA: {
        text: "Technology Partners",
        href: "/partners"
      }
    },
    sections: [
      {
        _type: 'missionSection',
        _key: 'mission',
        title: "Our Mission",
        subtitle: "Enabling the CRO-Venture Model for Digital Health Innovation",
        content: "We are a digital-health solution-focused contract research organization (CRO) with a mission to enable a CRO-Venture model for small biomedical and mHealth startups. Through our ONEHealth Ecosystem, we create comprehensive technology-driven platforms that accelerate clinical trials, reduce healthcare costs, and improve patient outcomes. Our unique approach combines clinical research expertise with technology innovation, providing end-to-end support from preclinical studies through FDA approval and market launch."
      },
      {
        _type: 'valuesSection',
        _key: 'values',
        title: "Our Core Strengths",
        subtitle: "What sets our CRO-venture model apart in digital health innovation",
        items: [
          {
            _key: 'clinical-excellence',
            title: "Clinical Research Excellence",
            description: "Comprehensive clinical research services from protocol design to regulatory submission and FDA approval",
            icon: "Award"
          },
          {
            _key: 'technology-integration',
            title: "Technology Integration", 
            description: "ONEHealth Ecosystem connecting EHR systems, wearable devices, and AI analytics for comprehensive data collection",
            icon: "Lightbulb"
          },
          {
            _key: 'venture-partnership',
            title: "CRO-Venture Partnership",
            description: "Unique funding and risk-sharing model that accelerates digital health startups from concept to market",
            icon: "Users"
          },
          {
            _key: 'regulatory-expertise',
            title: "Regulatory Expertise",
            description: "Expert navigation of FDA pathways for medical devices, software as medical devices (SaMD), and digital therapeutics",
            icon: "Shield"
          }
        ]
      }
    ]
  })

  // Show loading state while fetching data or if hero data is missing
  if (loading || !pageData || !pageData.hero) {
    return (
      <main className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className={typography.body}>
              Loading about us information...
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Extract sections from the data
  const missionSection = findSection<MissionSection>(pageData.sections, 'missionSection')
  const teamSection = findSection<TeamSection>(pageData.sections, 'teamSection')
  const valuesSection = findSection<ValuesSection>(pageData.sections, 'valuesSection')

  return (
    <main className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <AppleStyleHero
        title={pageData.hero.title}
        subtitle={pageData.hero.subtitle}
        primaryCTA={pageData.hero.primaryCTA}
        secondaryCTA={pageData.hero.secondaryCTA}
        backgroundImage="/healthcare-professionals-meeting.jpg"
        height="full"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-900/65"
      />

      {/* Mission Section */}
      {missionSection && (
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className={spacing.containerSmall + " text-center"}>
            <FadeIn>
              <h2 className={typography.sectionHeader}>
                {missionSection.title}
              </h2>
              <p className={typography.sectionSubtitle + " mb-8"}>
                {missionSection.subtitle}
              </p>
              <p className={typography.bodyLarge}>
                {missionSection.content}
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Values Section */}
      {valuesSection && (
        <section className="py-24 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/95 to-white/90 dark:from-gray-800/95 dark:to-gray-900/90"></div>
            <img 
              src="/healthcare-partnership-meeting.png" 
              alt="Company values" 
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <div className={`${spacing.container} relative z-10`}>
            <FadeIn className={componentClasses.sectionHeaderGroup}>
              <h2 className={typography.sectionHeader}>
                {valuesSection.title}
              </h2>
              <p className={typography.sectionSubtitle}>
                {valuesSection.subtitle}
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {valuesSection.items?.map((item, index) => {
                const IconComponent = {
                  Lightbulb,
                  Shield,
                  Users,
                  Award,
                  Heart,
                  Target
                }[item.icon] || Lightbulb

                return (
                  <StaggerItem key={item._key || index}>
                    <FrostedGlassCard hoverEffect className="h-full p-8 text-center">
                      <SoftBlueIconWrapper size="lg" animate className="mb-6 mx-auto">
                        <IconComponent />
                      </SoftBlueIconWrapper>
                      <h3 className={typography.cardTitle + " mb-4"}>
                        {item.title}
                      </h3>
                      <p className={typography.body}>
                        {item.description}
                      </p>
                    </FrostedGlassCard>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Team Section */}
      {teamSection && (
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className={spacing.container}>
            <FadeIn className={componentClasses.sectionHeaderGroup}>
              <h2 className={typography.sectionHeader}>
                {teamSection.title}
              </h2>
              <p className={typography.sectionSubtitle}>
                {teamSection.subtitle}
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamSection.members?.map((member, index) => (
                <FadeIn key={member._key || index} delay={index * 0.1}>
                  <FrostedGlassCard hoverEffect className="p-8 text-center">
                    {member.image && (
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden">
                        <Image
                          src={safeImageUrl(member.image, "/healthcare-executive-portrait.png", { width: 96, height: 96 })}
                          alt={member.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className={typography.cardTitle + " mb-2"}>
                      {member.name}
                    </h3>
                    <p className="font-text text-base text-blue-600 dark:text-blue-400 mb-4">
                      {member.role}
                    </p>
                    <p className={typography.body}>
                      {member.description}
                    </p>
                  </FrostedGlassCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-blue-800/80">
        <div className={spacing.containerSmall + " text-center"}>
          <FadeIn>
            <h2 className={typography.ctaTitle}>
              Ready to Accelerate Your Digital Health Innovation?
            </h2>
            <p className={typography.ctaSubtitle}>
              Join our CRO-venture ecosystem and transform your healthcare technology from concept to market
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <LiquidGlassButton 
                variant="primary" 
                size="cta" 
                href="/contact"
              >
                Start Your Clinical Trial
              </LiquidGlassButton>
              <LiquidGlassButton 
                variant="secondary" 
                size="cta" 
                href="/research"
              >
                View CRO Capabilities
              </LiquidGlassButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  )
}