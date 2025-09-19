'use client'

import React from 'react'
import { AppleStyleHero } from '@/components/apple-style-hero-simple'
import { FrostedGlassCard } from '@/components/frosted-glass-card'
import { TrendingUp, Award, BarChart, Shield, Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface QualityService {
  id: string
  title: string
  icon: string
  description: string
  features: string[]
}

interface QualityFramework {
  name: string
  description: string
  components: string[]
}

interface QualityImprovementData {
  title: string
  subtitle: string
  description: string
  services: QualityService[]
  frameworks: {
    title: string
    items: QualityFramework[]
  }
  outcomes: string[]
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  TrendingUp,
  Award,
  BarChart,
  Shield,
  Target
}

export function QualityImprovementClient({
  title,
  subtitle,
  description,
  services,
  frameworks,
  outcomes
}: QualityImprovementData) {
  return (
    <>
      <AppleStyleHero
        title={title}
        subtitle={subtitle}
        primaryCTA={{
          text: "Start Quality Initiative",
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Our Quality Improvement Services
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive quality programs designed to enhance healthcare outcomes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Award
              return (
                <FrostedGlassCard key={service.id} className="p-8">
                  <div className="flex items-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
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

      {/* Quality Frameworks */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              {frameworks.title}
            </h2>
          </div>

          <div className="space-y-8">
            {frameworks.items.map((framework, index) => (
              <FrostedGlassCard key={index} className="p-8">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                  {framework.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {framework.description}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {framework.components.map((component, compIndex) => (
                    <div key={compIndex} className="flex items-center">
                      <Target className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{component}</span>
                    </div>
                  ))}
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Expected Outcomes */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Expected Outcomes
            </h2>
          </div>

          <FrostedGlassCard className="p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
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
            Ready to Improve Healthcare Quality?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let's discuss how our quality improvement programs can enhance your outcomes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md border border-blue-400/30 dark:border-blue-300/40"
            >
              Start Quality Initiative
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}