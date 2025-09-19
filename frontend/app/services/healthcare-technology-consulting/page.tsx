import { Typography } from "@/components/ui/apple-typography"
import { FrostedGlassCard } from "@/components/frosted-glass-card-simple"
import { FadeIn } from "@/components/animations-simple"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { fetchPageContent } from "@/lib/dal/unified-content"
import Link from "next/link"
import { Check, Shield, Cpu, LineChart, Users, Zap } from "lucide-react"


// Icon mapping
const iconMap: Record<string, any> = {
  shield: Shield,
  cpu: Cpu,
  lineChart: LineChart,
  users: Users,
  zap: Zap
}

// Fallback data
const fallbackData = {
  title: "Healthcare Technology Consulting",
  hero: {
    title: "Healthcare Technology Consulting",
    subtitle: "Transform your healthcare operations with cutting-edge technology solutions designed for better patient outcomes"
  },
  overview: {
    title: "Strategic Technology Partnership",
    content: "Our healthcare technology consulting services help organizations navigate the complex landscape of digital health transformation. We combine deep healthcare expertise with innovative technology solutions to drive operational excellence and improved patient care."
  },
  services: [
    {
      title: "Digital Health Strategy",
      description: "Develop comprehensive digital health roadmaps aligned with your organizational goals and patient needs",
      icon: "lineChart"
    },
    {
      title: "EHR Optimization",
      description: "Maximize the value of your electronic health records through workflow optimization and integration",
      icon: "cpu"
    },
    {
      title: "Cybersecurity & Compliance",
      description: "Ensure HIPAA compliance and protect patient data with robust security frameworks",
      icon: "shield"
    },
    {
      title: "Interoperability Solutions",
      description: "Connect disparate systems to enable seamless data exchange and care coordination",
      icon: "zap"
    },
    {
      title: "Change Management",
      description: "Guide your team through technology adoption with comprehensive training and support",
      icon: "users"
    }
  ],
  benefits: [
    {
      title: "Improved Patient Outcomes",
      description: "Leverage technology to enhance care quality and patient satisfaction"
    },
    {
      title: "Operational Efficiency",
      description: "Streamline workflows and reduce administrative burden"
    },
    {
      title: "Cost Optimization",
      description: "Identify opportunities for cost savings through technology"
    },
    {
      title: "Regulatory Compliance",
      description: "Stay ahead of healthcare regulations and standards"
    }
  ],
  cta: {
    title: "Ready to Transform Your Healthcare Technology?",
    subtitle: "Let's discuss how we can help you achieve your digital health goals",
    primaryButton: {
      text: "Schedule a Consultation",
      link: "/contact?service=healthcare-technology-consulting"
    }
  }
}

export default async function HealthcareTechnologyConsultingPage() {
  let pageContent = null
  
  try {
    pageContent = await fetchPageContent('healthcare-technology-consulting', 'service')
  } catch (error) {
    console.error('Failed to fetch healthcare technology consulting content:', error)
  }

  const content = pageContent || fallbackData

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
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

      {/* Services Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="text-center mb-12">
              Our Consulting Services
            </Typography>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.services.map((service: any, index: number) => {
              const Icon = iconMap[service.icon] || Cpu
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

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="text-center mb-12">
              Key Benefits
            </Typography>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.benefits.map((benefit: any, index: number) => (
              <FadeIn key={index} delay={index * 0.1}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <Typography as="h3" variant="heading4" className="mb-2">
                      {benefit.title}
                    </Typography>
                    <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                      {benefit.description}
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