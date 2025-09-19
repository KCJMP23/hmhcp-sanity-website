'use client'

import React from 'react'
import { AppleStyleHero } from '@/components/apple-style-hero-simple'
import { FrostedGlassCard } from '@/components/frosted-glass-card'
import { BookOpen, Users, Award, Computer, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TrainingProgram {
  id: string
  title: string
  icon: string
  description: string
  features: string[]
}

interface TrainingMethod {
  name: string
  description: string
  benefits: string[]
}

interface EducationTrainingData {
  title: string
  subtitle: string
  description: string
  programs: TrainingProgram[]
  methods: {
    title: string
    items: TrainingMethod[]
  }
  certifications: string[]
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  BookOpen,
  Users,
  Award,
  Computer,
  FileText
}

export function EducationTrainingClient({
  title,
  subtitle,
  description,
  programs,
  methods,
  certifications
}: EducationTrainingData) {
  return (
    <>
      <AppleStyleHero
        title={title}
        subtitle={subtitle}
        backgroundImage="/hero-education-training.jpg"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-700/60"
        primaryCTA={{
          text: "Explore Training Programs",
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

      {/* Training Programs */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Our Education & Training Programs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive training solutions for healthcare professionals
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => {
              const Icon = iconMap[program.icon] || BookOpen
              return (
                <FrostedGlassCard key={program.id} className="p-8">
                  <div className="flex items-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                      {program.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {program.description}
                  </p>
                  <ul className="space-y-2">
                    {program.features.map((feature, index) => (
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

      {/* Training Methods */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              {methods.title}
            </h2>
          </div>

          <div className="space-y-8">
            {methods.items.map((method, index) => (
              <FrostedGlassCard key={index} className="p-8">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                  {method.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {method.description}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {method.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center">
                      <Award className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </FrostedGlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
              Professional Certifications
            </h2>
          </div>

          <FrostedGlassCard className="p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {certifications.map((certification, index) => (
                <div key={index} className="flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{certification}</span>
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
            Ready to Enhance Your Team's Skills?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Explore our comprehensive training programs and certification options
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-md border border-blue-400/30 dark:border-blue-300/40"
            >
              Explore Training Programs
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