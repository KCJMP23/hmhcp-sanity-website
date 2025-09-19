import { Typography } from "@/components/ui/apple-typography"
import { FrostedGlassCard } from "@/components/frosted-glass-card-simple"
import { FadeIn } from "@/components/animations-simple"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { fetchPageContent } from "@/lib/dal/unified-content"
import Link from "next/link"
import { Check, FlaskConical, FileSearch, Shield, BarChart3, Users, Clock } from "lucide-react"

// GROQ query for clinical research page
const clinicalResearchQuery = `
  *[_type == "servicePage" && slug.current == "clinical-research"][0] {
    title,
    hero {
      title,
      subtitle,
      backgroundImage
    },
    overview {
      title,
      content
    },
    services[] {
      title,
      description,
      icon
    },
    capabilities[] {
      title,
      description
    },
    stats[] {
      number,
      label,
      suffix
    },
    cta {
      title,
      subtitle,
      primaryButton {
        text,
        link
      }
    }
  }
`

// Icon mapping
const iconMap: Record<string, any> = {
  flask: FlaskConical,
  fileSearch: FileSearch,
  shield: Shield,
  barChart: BarChart3,
  users: Users,
  clock: Clock
}

// Fallback data
const fallbackData = {
  title: "Clinical Research Services",
  hero: {
    title: "Clinical Research Excellence",
    subtitle: "Accelerate medical discoveries with comprehensive clinical research support and expertise"
  },
  overview: {
    title: "Advancing Healthcare Through Research",
    content: "Our clinical research services provide end-to-end support for studies that drive medical innovation. From protocol design to data analysis, we ensure your research meets the highest standards of scientific rigor and regulatory compliance."
  },
  services: [
    {
      title: "Study Design & Protocol Development",
      description: "Create robust research protocols that meet regulatory requirements and scientific objectives",
      icon: "flask"
    },
    {
      title: "Clinical Data Management",
      description: "Ensure data integrity with advanced EDC systems and quality control processes",
      icon: "fileSearch"
    },
    {
      title: "Regulatory Compliance",
      description: "Navigate FDA and international regulatory requirements with expert guidance",
      icon: "shield"
    },
    {
      title: "Statistical Analysis",
      description: "Apply advanced statistical methods to derive meaningful insights from clinical data",
      icon: "barChart"
    },
    {
      title: "Patient Recruitment",
      description: "Develop effective strategies to recruit and retain qualified study participants",
      icon: "users"
    },
    {
      title: "Project Management",
      description: "Keep studies on track with experienced project management and timeline optimization",
      icon: "clock"
    }
  ],
  capabilities: [
    {
      title: "Phase I-IV Clinical Trials",
      description: "Full-service support for all phases of clinical development"
    },
    {
      title: "Real-World Evidence Studies",
      description: "Design and execute observational studies to complement clinical trial data"
    },
    {
      title: "Medical Device Studies",
      description: "Specialized expertise in device trials and post-market surveillance"
    },
    {
      title: "Biomarker Research",
      description: "Integrate biomarker analysis into clinical development programs"
    }
  ],
  stats: [
    {
      number: "500",
      label: "Studies Completed",
      suffix: "+"
    },
    {
      number: "98",
      label: "Regulatory Approval Rate",
      suffix: "%"
    },
    {
      number: "50",
      label: "Active Research Sites",
      suffix: "+"
    }
  ],
  cta: {
    title: "Partner with Us for Your Next Clinical Study",
    subtitle: "Let our expertise guide your research to successful outcomes",
    primaryButton: {
      text: "Discuss Your Research",
      link: "/contact?service=clinical-research"
    }
  }
}

export default async function ClinicalResearchPage() {
  let pageContent = null
  
  try {
    pageContent = await fetchPageContent('clinical-research', 'service')
  } catch (error) {
    console.error('Failed to fetch clinical research content:', error)
  }

  const content = pageContent || fallbackData

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <FadeIn>
            <Typography as="h1" variant="display" className="mb-6 text-white">
              {content.hero.title}
            </Typography>
            <Typography as="p" variant="heading3" className="max-w-3xl mx-auto text-white/90 font-light">
              {content.hero.subtitle}
            </Typography>
          </FadeIn>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="max-w-4xl mx-auto text-center">
              <Typography as="h2" variant="heading2" className="mb-6">
                {content.overview.title}
              </Typography>
              <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400 text-lg">
                {content.overview.content}
              </Typography>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Section */}
      {content.stats && (
        <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content.stats.map((stat: any, index: number) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="text-center">
                    <Typography as="div" className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {stat.number}{stat.suffix}
                    </Typography>
                    <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </Typography>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="text-center mb-12">
              Our Research Services
            </Typography>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.services.map((service: any, index: number) => {
              const Icon = iconMap[service.icon] || FlaskConical
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <FrostedGlassCard className="p-8 h-full">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Typography as="h3" variant="heading4" className="mb-3">
                      {service.title}
                    </Typography>
                    <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                      {service.description}
                    </Typography>
                  </FrostedGlassCard>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="text-center mb-12">
              Research Capabilities
            </Typography>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.capabilities.map((capability: any, index: number) => (
              <FadeIn key={index} delay={index * 0.1}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <Typography as="h3" variant="heading4" className="mb-2">
                      {capability.title}
                    </Typography>
                    <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                      {capability.description}
                    </Typography>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="mb-4 text-white">
              {content.cta.title}
            </Typography>
            <Typography as="p" variant="body" className="mb-8 text-white/90 text-lg">
              {content.cta.subtitle}
            </Typography>
            <Link href={content.cta.primaryButton.link}>
              <LiquidGlassButton variant="secondary" size="lg">
                {content.cta.primaryButton.text}
              </LiquidGlassButton>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}