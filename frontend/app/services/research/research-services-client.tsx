'use client'

import React from 'react'
import { AppleStyleHero } from '@/components/apple-style-hero-simple'
import { FrostedGlassCard } from '@/components/frosted-glass-card'
import { Search, BarChart3, FileText, Users, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface ResearchService {
  id: string
  title: string
  icon: string
  description: string
  features: string[]
}

interface ResearchType {
  name: string
  description: string
  applications: string[]
}

interface ResearchServicesData {
  title: string
  subtitle: string
  description: string
  services: ResearchService[]
  researchTypes: {
    title: string
    items: ResearchType[]
  }
  outcomes: string[]
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Search,
  BarChart3,
  FileText,
  Users,
  Target
}

export function ResearchServicesClient({
  title,
  subtitle,
  description,
  services,
  researchTypes,
  outcomes
}: ResearchServicesData) {
  return (
    <>
      <AppleStyleHero
        title={title}
        subtitle={subtitle}
        backgroundImage="/healthcare-research-hero.png"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-700/60"
        primaryCTA={{
          text: "Start Research Project",
          href: "/contact"
        }}
        secondaryCTA={{
          text: "View All Services",
          href: "/services"
        }}
      />

      {/* Introduction */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <FrostedGlassCard className="p-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {description}
            </p>
          </FrostedGlassCard>
        </div>
      </section>

      {/* Research Services */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-gray-100/90 dark:from-gray-900/95 dark:to-gray-800/90"></div>
          <img 
            src="/clinical-research-service.png" 
            alt="Research services" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Our Research Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive research solutions for healthcare innovation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Search
              return (
                <FrostedGlassCard key={service.id} className="p-8 relative overflow-hidden">
                  {/* Service Background Image */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/85 dark:from-gray-800/95 dark:to-gray-700/85"></div>
                    <img 
                      src={(() => {
                        const imageMap: { [key: string]: string } = {
                          '1': '/clinical-research-study.jpg',
                          '2': '/healthcare-research-director.png',
                          '3': '/digital-health-research.png',
                          '4': '/population-health-research.png',
                          '5': '/quality-improvement-research.png'
                        }
                        return imageMap[service.id] || '/clinical-research-service.png'
                      })()} 
                      alt={`${service.title} background`}
                      className="w-full h-full object-cover opacity-30"
                    />
                  </div>
                  <div className="flex items-center mb-4 relative z-10">
                    <Icon className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 relative z-10">
                    {service.description}
                  </p>
                  <ul className="space-y-2 relative z-10">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="block w-2 h-2 bg-blue-600 mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </FrostedGlassCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* Research Types */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              {researchTypes.title}
            </h2>
          </div>

          <div className="space-y-8">
            {researchTypes.items.map((type, index) => (
              <FrostedGlassCard key={index} className="p-8">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                  {type.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {type.description}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {type.applications.map((application, appIndex) => (
                    <div key={appIndex} className="flex items-center">
                      <Target className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{application}</span>
                    </div>
                  ))}
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Research Outcomes */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Research Outcomes & Impact
            </h2>
          </div>

          <FrostedGlassCard className="p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                </div>
              ))}
            </div>
          </FrostedGlassCard>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
            Ready to Advance Healthcare Through Research?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Partner with us to conduct impactful healthcare research
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LiquidGlassButton 
              variant="primary" 
              size="lg" 
              href="/contact"
            >
              Start Research Project
              <ArrowRight className="ml-2 h-5 w-5" />
            </LiquidGlassButton>
            <LiquidGlassButton 
              variant="secondary" 
              size="lg" 
              href="/services"
            >
              View All Services
            </LiquidGlassButton>
          </div>
        </div>
      </section>
    </>
  )
}