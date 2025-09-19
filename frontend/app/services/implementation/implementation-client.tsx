'use client'

import React from 'react'
import { AppleStyleHero } from '@/components/apple-style-hero-simple'
import { FrostedGlassCard } from '@/components/frosted-glass-card'
import { Cog, Server, Users, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface ImplementationService {
  id: string
  title: string
  icon: string
  description: string
  features: string[]
}

interface MethodologyPhase {
  name: string
  duration: string
  activities: string[]
}

interface ImplementationData {
  title: string
  subtitle: string
  description: string
  services: ImplementationService[]
  methodology: {
    title: string
    phases: MethodologyPhase[]
  }
  successFactors: string[]
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Cog,
  Server,
  Users,
  CheckCircle,
  Clock
}

export function ImplementationClient({
  title,
  subtitle,
  description,
  services,
  methodology,
  successFactors
}: ImplementationData) {
  return (
    <>
      <AppleStyleHero
        title={title}
        subtitle={subtitle}
        backgroundImage="/healthcare-services-hero.png"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-700/60"
        primaryCTA={{
          text: "Schedule Implementation",
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

      {/* Services */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 to-gray-100/90 dark:from-gray-900/95 dark:to-gray-800/90"></div>
          <img 
            src="/healthcare-services-hero.png" 
            alt="Implementation services" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Our Implementation Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive deployment solutions for healthcare technology
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Server
              return (
                <FrostedGlassCard key={service.id} className="p-8 relative overflow-hidden">
                  {/* Service Background Image */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/85 dark:from-gray-800/95 dark:to-gray-700/85"></div>
                    <img 
                      src={(() => {
                        const imageMap: { [key: string]: string } = {
                          '1': '/healthcare-technology.jpg',
                          '2': '/medical-technology.jpg',
                          '3': '/digital-health-interface.jpg'
                        }
                        return imageMap[service.id] || '/healthcare-services-hero.png'
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

      {/* Implementation Methodology */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              {methodology.title}
            </h2>
          </div>

          <div className="space-y-8">
            {methodology.phases.map((phase, index) => (
              <FrostedGlassCard key={index} className="p-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                        {phase.name}
                      </h3>
                      <span className="text-sm text-blue-600 font-medium">
                        {phase.duration}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {phase.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start">
                          <span className="block w-2 h-2 bg-blue-600 mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Success Factors */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Our Implementation Success Factors
            </h2>
          </div>

          <FrostedGlassCard className="p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {successFactors.map((factor, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{factor}</span>
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
            Ready to Implement Your Healthcare Technology?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let's discuss your implementation requirements and timeline
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LiquidGlassButton 
              variant="primary" 
              size="lg" 
              href="/contact"
            >
              Schedule Implementation
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