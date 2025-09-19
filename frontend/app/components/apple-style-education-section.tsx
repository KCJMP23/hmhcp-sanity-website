"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap, Calendar, Users, ArrowRight } from "lucide-react"
import Image from "next/image"
import { FrostedCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"

interface EducationCardProps {
  title: string
  description: string
  image: string
  date: string
  attendees: string
  index: number
}

const EducationCard = ({ title, description, image, date, attendees, index }: EducationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <FrostedCard className="h-full overflow-hidden flex flex-col hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority={index < 2}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <Typography variant="heading3" className="mb-2">
            {title}
          </Typography>
          <Typography variant="body" className="mb-4 text-gray-600 dark:text-gray-300 flex-grow">
            {description}
          </Typography>
          <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary-500" />
              <Typography variant="caption">{date}</Typography>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-primary-500" />
              <Typography variant="caption">{attendees}</Typography>
            </div>
          </div>
        </div>
      </FrostedCard>
    </motion.div>
  )
}

interface EducationTabProps {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function AppleStyleEducationSection() {
  const [activeTab, setActiveTab] = useState(0)

  const tabs: EducationTabProps[] = [
    {
      title: "Workshops",
      icon: <GraduationCap className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Digital Health Innovation",
              description:
                "Explore the latest digital health technologies and learn how to implement them in your practice.",
              image: "/digital-health-workshop.png",
              date: "June 15-16, 2023",
              attendees: "Limited to 30 participants",
            },
            {
              title: "Patient Experience Design",
              description:
                "Learn human-centered design principles to enhance the patient experience in healthcare settings.",
              image: "/patient-experience-workshop.png",
              date: "July 22-23, 2023",
              attendees: "Limited to 25 participants",
            },
            {
              title: "Clinical Decision Support",
              description: "Develop skills in implementing and evaluating clinical decision support systems.",
              image: "/clinical-decision-support-workshop.png",
              date: "August 12-13, 2023",
              attendees: "Limited to 20 participants",
            },
            {
              title: "Healthcare Quality Improvement",
              description: "Master methodologies for continuous quality improvement in healthcare delivery.",
              image: "/healthcare-quality-workshop.png",
              date: "September 9-10, 2023",
              attendees: "Limited to 30 participants",
            },
          ].map((workshop, index) => (
            <EducationCard key={index} {...workshop} index={index} />
          ))}
        </div>
      ),
    },
    {
      title: "Courses",
      icon: <Calendar className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Healthcare Analytics Fundamentals",
              description: "A comprehensive introduction to healthcare data analytics and its applications.",
              image: "/healthcare-analytics-course.png",
              date: "Online, Self-paced",
              attendees: "Unlimited enrollment",
            },
            {
              title: "Medical Leadership",
              description: "Develop leadership skills specifically tailored for healthcare professionals.",
              image: "/medical-leadership-course.png",
              date: "10-week program",
              attendees: "Limited to 50 participants",
            },
            {
              title: "Healthcare Informatics",
              description: "Learn the principles of healthcare informatics and health information systems.",
              image: "/healthcare-informatics-course.png",
              date: "12-week program",
              attendees: "Limited to 40 participants",
            },
          ].map((course, index) => (
            <EducationCard key={index} {...course} index={index} />
          ))}
        </div>
      ),
    },
    {
      title: "Certifications",
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Healthcare Quality Professional",
              description: "Become certified in healthcare quality improvement methodologies and practices.",
              image: "/healthcare-quality-certification.png",
              date: "6-month program",
              attendees: "Limited to 30 participants per cohort",
            },
            {
              title: "Digital Health Specialist",
              description: "Gain expertise in digital health technologies and their implementation.",
              image: "/digital-health-certification.png",
              date: "8-month program",
              attendees: "Limited to 25 participants per cohort",
            },
            {
              title: "Healthcare Data Analyst",
              description: "Master healthcare data analysis techniques and tools for improved decision-making.",
              image: "/healthcare-data-analyst-certification.png",
              date: "9-month program",
              attendees: "Limited to 20 participants per cohort",
            },
          ].map((certification, index) => (
            <EducationCard key={index} {...certification} index={index} />
          ))}
        </div>
      ),
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="heading1" className="mb-4">
              Education & Training
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography variant="body" className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Empowering healthcare professionals with the knowledge and skills needed to excel in an evolving
              healthcare landscape through our comprehensive educational programs.
            </Typography>
          </motion.div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "flex items-center px-4 py-2  text-sm transition-all duration-300",
                  activeTab === index
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700",
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                <span>{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
          >
            {tabs[activeTab].content}
          </motion.div>
        </AnimatePresence>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <FrostedCard className="inline-block p-6 md:p-8 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-all duration-300">
            <Typography variant="heading3" className="mb-4">
              Ready to advance your healthcare career?
            </Typography>
            <Typography variant="body" className="mb-6 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Explore our full catalog of educational offerings and find the perfect program to enhance your skills and
              knowledge in healthcare.
            </Typography>
            <button className="inline-flex items-center px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              <span className="mr-2">View All Programs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </FrostedCard>
        </motion.div>
      </div>
    </section>
  )
}
