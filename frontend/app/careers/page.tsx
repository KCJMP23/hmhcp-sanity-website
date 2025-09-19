"use client"

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchWithBackup } from '@/lib/cms/fetch-with-backup'
import { CareersPageClient } from "./careers-client"

// TypeScript interfaces
interface JobOpening {
  title: string
  department: string
  location: string
  type: string
  level: string
  description: string
  responsibilities: string[]
  requirements: string[]
  niceToHave: string[]
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

interface CareersPageData {
  title: string
  subtitle: string
  jobOpeningsSection: JobOpeningsSection
  benefitsSection: BenefitsSection
  cultureSection: CultureSection
  ctaSection: CTASection
}

function getCareersStaticFallback(): CareersPageData {
  return {
    title: "Join Our Team",
    subtitle: "Build the future of healthcare with passionate innovators",
    jobOpeningsSection: {
      title: "Open Positions",
      description: "We're looking for talented individuals who share our passion for transforming healthcare",
      openings: [
        {
          title: "Senior Frontend Engineer",
          department: "Engineering",
          location: "Boston, MA (Hybrid)",
          type: "Full-time",
          level: "Senior",
          description: "Join our engineering team to build cutting-edge healthcare applications using React, TypeScript, and Next.js",
          responsibilities: [
            "Design and implement responsive web applications",
            "Collaborate with UX/UI designers and backend engineers",
            "Optimize application performance and accessibility",
            "Mentor junior developers and conduct code reviews",
            "Contribute to technical architecture decisions"
          ],
          requirements: [
            "5+ years of experience with React and TypeScript",
            "Strong understanding of modern web development practices",
            "Experience with healthcare applications or HIPAA compliance",
            "Excellent communication and collaboration skills",
            "Bachelor's degree in Computer Science or equivalent experience"
          ],
          niceToHave: [
            "Experience with Next.js and server-side rendering",
            "Knowledge of healthcare standards (HL7, FHIR)",
            "Experience with cloud platforms (AWS, Azure)",
            "Contributions to open-source projects"
          ],
          salary: "$140,000 - $180,000",
          posted: "2025-06-15",
          applicationUrl: "/careers/apply/senior-frontend-engineer",
          featured: true
        },
        {
          title: "Healthcare Data Scientist",
          department: "Data & Analytics",
          location: "Remote (US)",
          type: "Full-time",
          level: "Mid-Senior",
          description: "Apply machine learning and analytics to improve healthcare outcomes and operational efficiency",
          responsibilities: [
            "Develop predictive models for healthcare applications",
            "Analyze large healthcare datasets for insights",
            "Collaborate with clinical teams to understand requirements",
            "Create data visualizations and dashboards",
            "Present findings to stakeholders"
          ],
          requirements: [
            "3+ years of experience in data science or analytics",
            "Strong skills in Python, R, and SQL",
            "Experience with healthcare data (claims, EHR, clinical)",
            "Master's degree in Data Science, Statistics, or related field",
            "Understanding of healthcare privacy regulations"
          ],
          niceToHave: [
            "PhD in relevant field",
            "Experience with deep learning frameworks",
            "Published research in healthcare analytics",
            "Experience with real-time data processing"
          ],
          salary: "$120,000 - $160,000",
          posted: "2025-06-10",
          applicationUrl: "/careers/apply/healthcare-data-scientist",
          featured: true
        },
        {
          title: "Product Manager - Digital Health",
          department: "Product",
          location: "San Francisco, CA (Hybrid)",
          type: "Full-time",
          level: "Senior",
          description: "Lead product strategy and development for our digital health platform",
          responsibilities: [
            "Define product vision and roadmap",
            "Work closely with engineering and design teams",
            "Conduct user research and gather feedback",
            "Prioritize features based on business impact",
            "Collaborate with healthcare partners and stakeholders"
          ],
          requirements: [
            "5+ years of product management experience",
            "Experience with healthcare or health tech products",
            "Strong analytical and problem-solving skills",
            "Excellent stakeholder management abilities",
            "Bachelor's degree or equivalent experience"
          ],
          niceToHave: [
            "MBA or advanced degree",
            "Clinical background or healthcare domain expertise",
            "Experience with agile methodologies",
            "Track record of successful product launches"
          ],
          salary: "$150,000 - $190,000",
          posted: "2025-06-08",
          applicationUrl: "/careers/apply/product-manager-digital-health",
          featured: false
        },
        {
          title: "Clinical Implementation Specialist",
          department: "Customer Success",
          location: "Chicago, IL (Travel Required)",
          type: "Full-time",
          level: "Mid",
          description: "Support healthcare organizations in implementing our solutions",
          responsibilities: [
            "Lead on-site implementation projects",
            "Train healthcare staff on our platforms",
            "Gather feedback and requirements from users",
            "Troubleshoot technical issues",
            "Document best practices and workflows"
          ],
          requirements: [
            "3+ years in healthcare IT or clinical settings",
            "Strong technical and communication skills",
            "Ability to travel 30-50% of the time",
            "Clinical background (RN, RT, etc.) preferred",
            "Experience with EHR systems"
          ],
          niceToHave: [
            "Project management certification",
            "Experience with change management",
            "Knowledge of healthcare regulations",
            "Technical certifications"
          ],
          salary: "$80,000 - $110,000",
          posted: "2025-06-05",
          applicationUrl: "/careers/apply/clinical-implementation-specialist",
          featured: false
        }
      ]
    },
    benefitsSection: {
      title: "Benefits & Perks",
      description: "We take care of our team so they can take care of others",
      benefits: [
        {
          title: "Comprehensive Healthcare",
          description: "100% coverage for employee and family medical, dental, and vision insurance",
          icon: "heart"
        },
        {
          title: "Flexible Work",
          description: "Remote-first culture with flexible hours and hybrid office options",
          icon: "home"
        },
        {
          title: "Professional Growth",
          description: "$5,000 annual learning budget and dedicated time for professional development",
          icon: "graduation"
        },
        {
          title: "Time Off",
          description: "Unlimited PTO, 12 company holidays, and sabbatical opportunities",
          icon: "calendar"
        },
        {
          title: "Retirement",
          description: "401(k) with 6% company match and financial planning resources",
          icon: "piggybank"
        },
        {
          title: "Wellness",
          description: "Monthly wellness stipend, mental health support, and fitness programs",
          icon: "activity"
        }
      ]
    },
    cultureSection: {
      title: "Our Culture",
      description: "What makes HM Healthcare Partners a great place to work",
      values: [
        {
          title: "Mission-Driven",
          description: "Every day, our work directly impacts patient care and healthcare outcomes. We're united by our mission to transform healthcare for the better."
        },
        {
          title: "Collaborative Innovation",
          description: "We believe the best solutions come from diverse perspectives working together. Our teams collaborate across disciplines to solve complex healthcare challenges."
        },
        {
          title: "Continuous Learning",
          description: "Healthcare is constantly evolving, and so are we. We encourage curiosity, experimentation, and continuous improvement in everything we do."
        },
        {
          title: "Work-Life Integration",
          description: "We understand that great work comes from healthy, balanced individuals. Our flexible policies support you in bringing your best self to work."
        }
      ]
    },
    ctaSection: {
      title: "Ready to make an impact?",
      description: "Join us in transforming healthcare through innovation and compassion",
      primaryButton: {
        text: "View All Openings",
        href: "#openings"
      }
    }
  }
}

export default function CareersPage() {
  const [pageData, setPageData] = useState<CareersPageData>(getCareersStaticFallback())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCareersData = async () => {
      try {
        setLoading(true)
        const data = await fetchWithBackup<CareersPageData>('/api/cms/pages/careers', 'careers')
        setPageData(data)
      } catch (error) {
        console.error('Error fetching careers data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch careers data')
        setPageData(getCareersStaticFallback())
      } finally {
        setLoading(false)
      }
    }
    fetchCareersData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading careers...</span>
      </div>
    )
  }

  return <CareersPageClient {...pageData} />
}