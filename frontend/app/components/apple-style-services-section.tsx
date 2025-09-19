"use client"

import type React from "react"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { FrostedCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"
import { SoftBlueIconWrapper } from "@/components/ui/icon-wrapper"

interface ServiceCardProps {
  title: string
  description: string
  icon: React.ReactNode
  index: number
}

const ServiceCard = ({ title, description, icon, index }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <FrostedCard className="h-full p-6 hover:shadow-xl transition-all duration-300">
        <SoftBlueIconWrapper size="lg" animate className="mb-4">
          {icon}
        </SoftBlueIconWrapper>
        <Typography variant="heading3" className="mb-2">
          {title}
        </Typography>
        <Typography variant="body" className="text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </Typography>
        <button className="inline-flex items-center text-primary-500 hover:text-primary-600 transition-colors">
          <span className="mr-1">Learn more</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </FrostedCard>
    </motion.div>
  )
}

export function AppleStyleServicesSection() {
  const services = [
    {
      title: "Healthcare Analytics",
      description: "Transform your healthcare data into actionable insights with our advanced analytics solutions.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
    },
    {
      title: "Clinical Decision Support",
      description: "Enhance clinical decision-making with evidence-based tools and AI-powered recommendations.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      title: "Patient Engagement",
      description: "Create meaningful connections with patients through personalized digital experiences.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <rect cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Healthcare Integration",
      description: "Seamlessly connect disparate healthcare systems for improved interoperability and workflow.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      title: "Quality Improvement",
      description: "Implement systematic approaches to enhance healthcare quality, safety, and efficiency.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <path d="m9 11-6 6v3h9l3-3" />
          <path d="m17 5-2 2-7 7v3h3l7-7 2-2" />
          <path d="M14 3a2 2 0 0 1 4 0v0a2 2 0 0 1-4 0v0z" />
        </svg>
      ),
    },
    {
      title: "Telehealth Solutions",
      description: "Deliver high-quality care remotely with our secure and user-friendly telehealth platform.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1" />
          <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
        </svg>
      ),
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="heading1" className="mb-4">
              Our Services
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="body" className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              We offer a comprehensive suite of healthcare technology solutions designed to transform patient care,
              optimize clinical workflows, and drive better outcomes.
            </Typography>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} index={index} />
          ))}
        </div>

        {/* Featured Service */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16"
        >
          <FrostedCard className="p-6 md:p-8 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <Typography variant="heading2" className="mb-4">
                  Integrated Healthcare Platform
                </Typography>
                <Typography variant="body" className="mb-6 text-gray-600 dark:text-gray-300">
                  Our flagship integrated healthcare platform combines analytics, clinical decision support, patient
                  engagement, and telehealth in one seamless solution. Experience the power of connected healthcare
                  technology designed for the modern healthcare organization.
                </Typography>
                <button className="inline-flex items-center px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                  <span className="mr-2">Explore the Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="md:w-1/2">
                <img
                  src="/placeholder.svg?height=400&width=600&query=integrated%20healthcare%20platform%20dashboard"
                  alt="Integrated Healthcare Platform"
                  className="shadow-lg"
                />
              </div>
            </div>
          </FrostedCard>
        </motion.div>
      </div>
    </section>
  )
}
