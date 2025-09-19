"use client"

import { motion } from "framer-motion"
import { MapPin, Clock, Building, DollarSign, Calendar, Heart, Home, GraduationCap, PiggyBank, Activity, ChevronRight } from "lucide-react"
import { Typography } from "@/components/ui/apple-typography"
import { FrostedCard } from "@/components/ui/global-styles"
import { AppleStyleHero } from "@/components/apple-style-hero-simple"
import Link from "next/link"

interface JobOpening {
  title: string
  department: string
  location: string
  type: string
  level: string
  description: string
  responsibilities: string[]
  requirements: string[]
  niceToHave?: string[]
  salary: string
  posted: string
  applicationUrl: string
  featured: boolean
}

interface JobOpeningsSection {
  title: string
  description: string
  openings: JobOpening[]
}

interface Benefit {
  title: string
  description: string
  icon: string
}

interface BenefitsSection {
  title: string
  description: string
  benefits: Benefit[]
}

interface CultureValue {
  title: string
  description: string
}

interface CultureSection {
  title: string
  description: string
  values: CultureValue[]
}

interface CTASection {
  title: string
  description: string
  primaryButton: {
    text: string
    href: string
  }
}

interface CareersPageClientProps {
  title: string
  subtitle: string
  jobOpeningsSection: JobOpeningsSection
  benefitsSection: BenefitsSection
  cultureSection: CultureSection
  ctaSection: CTASection
}

const IconComponent = ({ icon }: { icon: string }) => {
  const icons: { [key: string]: React.ReactNode } = {
    heart: <Heart className="h-8 w-8" />,
    home: <Home className="h-8 w-8" />,
    graduation: <GraduationCap className="h-8 w-8" />,
    calendar: <Calendar className="h-8 w-8" />,
    piggybank: <PiggyBank className="h-8 w-8" />,
    activity: <Activity className="h-8 w-8" />
  }
  return <>{icons[icon] || <Heart className="h-8 w-8" />}</>
}

export function CareersPageClient({
  title,
  subtitle,
  jobOpeningsSection,
  benefitsSection,
  cultureSection,
  ctaSection
}: CareersPageClientProps) {
  // Separate featured and regular openings
  const featuredOpenings = jobOpeningsSection.openings.filter(job => job.featured)
  const regularOpenings = jobOpeningsSection.openings.filter(job => !job.featured)

  return (
    <div className="w-full">
      {/* Apple-Style Hero Section */}
      <AppleStyleHero
        title={title}
        subtitle={subtitle}
        backgroundImage="/hero-careers.jpg"
        overlayColor="from-blue-900/60 via-blue-800/50 to-blue-700/60"
        primaryCTA={{
          text: "View Open Positions",
          href: "#openings",
        }}
        secondaryCTA={{
          text: "Learn About Culture",
          href: "#culture",
        }}
      />

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Culture Section */}
          <section id="culture" className="mb-20">
            <div className="text-center mb-12">
              <Typography variant="heading2" className="mb-4">
                {cultureSection.title}
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {cultureSection.description}
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cultureSection.values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <FrostedCard className="p-8 h-full">
                    <Typography variant="heading3" className="mb-4 text-blue-600 dark:text-blue-400">
                      {value.title}
                    </Typography>
                    <Typography variant="body" className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </Typography>
                  </FrostedCard>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 md:p-12">
            <div className="text-center mb-12">
              <Typography variant="heading2" className="mb-4">
                {benefitsSection.title}
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {benefitsSection.description}
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefitsSection.benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                    <IconComponent icon={benefit.icon} />
                  </div>
                  <Typography variant="heading4" className="mb-2">
                    {benefit.title}
                  </Typography>
                  <Typography variant="body" className="text-gray-600 dark:text-gray-300">
                    {benefit.description}
                  </Typography>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Job Openings Section */}
          <section id="openings" className="mb-20">
            <div className="text-center mb-12">
              <Typography variant="heading2" className="mb-4">
                {jobOpeningsSection.title}
              </Typography>
              <Typography variant="body" className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {jobOpeningsSection.description}
              </Typography>
            </div>

            {/* Featured Openings */}
            {featuredOpenings.length > 0 && (
              <>
                <Typography variant="heading3" className="text-center mb-8 text-gray-700 dark:text-gray-300">
                  Featured Positions
                </Typography>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  {featuredOpenings.map((job, index) => (
                    <motion.div
                      key={job.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <FrostedCard className="p-8 h-full hover:shadow-xl transition-all duration-300">
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <Typography variant="heading3" className="text-gray-900 dark:text-white">
                              {job.title}
                            </Typography>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                              Featured
                            </span>
                          </div>
                          <Typography variant="body" className="text-blue-600 dark:text-blue-400 mb-4">
                            {job.department} • {job.level}
                          </Typography>
                        </div>

                        <Typography variant="body" className="text-gray-600 dark:text-gray-300 mb-4">
                          {job.description}
                        </Typography>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>{job.type}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <DollarSign className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span>Posted {new Date(job.posted).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Link href={job.applicationUrl}>
                          <button className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium flex items-center justify-center">
                            View Details & Apply
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </button>
                        </Link>
                      </FrostedCard>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Regular Openings */}
            {regularOpenings.length > 0 && (
              <>
                <Typography variant="heading3" className="text-center mb-8 text-gray-700 dark:text-gray-300">
                  All Open Positions
                </Typography>
                <div className="space-y-6">
                  {regularOpenings.map((job, index) => (
                    <motion.div
                      key={job.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <FrostedCard className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1 mb-4 md:mb-0">
                            <Typography variant="heading4" className="mb-2">
                              {job.title}
                            </Typography>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center">
                                <Building className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                                {job.department}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                                {job.type}
                              </span>
                            </div>
                          </div>
                          <Link href={job.applicationUrl}>
                            <button className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium">
                              Apply Now
                            </button>
                          </Link>
                        </div>
                      </FrostedCard>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <Typography variant="heading2" className="text-white mb-4">
                  {ctaSection.title}
                </Typography>
                <Typography variant="body" className="text-blue-100 mb-8">
                  {ctaSection.description}
                </Typography>
                <Link href={ctaSection.primaryButton.href}>
                  <button className="py-3 px-8 bg-white text-blue-600 hover:bg-blue-50 transition-colors font-medium">
                    {ctaSection.primaryButton.text}
                  </button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}