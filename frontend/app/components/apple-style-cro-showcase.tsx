'use client'

import { motion } from 'framer-motion'
import { FlaskRound, Shield, Activity, TrendingUp, Award, Cpu, Microscope, LayoutDashboard } from 'lucide-react'
import { LiquidGlassButton } from './ui/liquid-glass-button'
// import { useCROShowcaseCards } from '@/lib/hooks/use-cms-content'  // Temporarily disabled
import * as Icons from 'lucide-react'

// Fallback data - Only 6 sections should be displayed
const fallbackSections = [
  {
    id: "clinical-trials",
    title: "Clinical Trial Excellence",
    subtitle: "End-to-end trial management",
    description: "Advanced clinical research capabilities enabling faster, more efficient trials with enhanced data quality and regulatory compliance.",
    icon: "Award",
    backgroundImage: "/hero-research.jpg",
    theme: "light",
    sort_order: 1,
    primaryButton: {
      text: "Explore Trials",
      href: "/research/clinical-studies"
    },
    secondaryButton: {
      text: "View Capabilities",
      href: "/research"
    }
  },
  {
    id: "digital-health",
    title: "Digital Health Innovation",
    subtitle: "Built for Healthcare Intelligence",
    description: "AI-powered platform ecosystem connecting wearable devices, EHR systems, and clinical workflows for comprehensive patient insights.",
    icon: "Cpu",
    backgroundImage: "/hero-technology.jpg",
    theme: "dark",
    sort_order: 2,
    primaryButton: {
      text: "View Platforms",
      href: "/platforms"
    },
    secondaryButton: {
      text: "See Partners",
      href: "/partners"
    }
  },
  {
    id: "regulatory",
    title: "Regulatory Excellence",
    subtitle: "FDA navigation & compliance",
    description: "Expert regulatory guidance and validation systems ensuring smooth pathways to approval for medical devices, software, and therapeutics.",
    icon: "Shield",
    backgroundImage: "/hero-consultation.jpg",
    theme: "dark",
    sort_order: 3,
    primaryButton: {
      text: "Regulatory Services",
      href: "/services"
    },
    secondaryButton: {
      text: "Compliance Guide",
      href: "/research/qa-qi"
    }
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    subtitle: "AI-powered clinical intelligence",
    description: "Machine learning and predictive analytics transform clinical data into actionable insights for improved patient outcomes and research efficiency.",
    icon: "TrendingUp",
    backgroundImage: "/hero-research.jpg",
    theme: "light",
    sort_order: 4,
    primaryButton: {
      text: "Analytics Platform",
      href: "/platforms"
    },
    secondaryButton: {
      text: "View Research",
      href: "/research"
    }
  },
  {
    id: "personalized-dashboard",
    title: "Personalized Dashboard",
    subtitle: "Your health overview at a glance",
    description: "Intuitive, customizable dashboard that presents your health metrics, appointments, and care plan in one unified view.",
    icon: "LayoutDashboard",
    backgroundImage: "/hero-consultation.jpg",
    theme: "light",
    sort_order: 5,
    primaryButton: {
      text: "View Demo",
      href: "/platforms"
    },
    secondaryButton: {
      text: "Learn More",
      href: "/research"
    }
  },
  {
    id: "intelliscore",
    title: "INTELLISCORE Tracking",
    subtitle: "Comprehensive health scoring system",
    description: "Real-time health scoring that monitors vitals, treatment adherence, and wellness indicators for proactive care management.",
    icon: "Activity",
    backgroundImage: "/hero-technology.jpg",
    theme: "dark",
    sort_order: 6,
    primaryButton: {
      text: "Get Started",
      href: "/contact"
    },
    secondaryButton: {
      text: "How It Works",
      href: "/platforms"
    }
  }
]

export function AppleStyleCROShowcase() {
  // Temporarily disable CMS to use only fallback data (6 sections)
  // const { content: cmsContent, loading, error } = useCROShowcaseCards(fallbackSections)

  // Use only fallback sections (exactly 6 sections as designed)
  const sections = fallbackSections.map((item) => {
    const IconComponent = item.icon && (Icons as any)[item.icon] 
      ? (Icons as any)[item.icon] 
      : Award

    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      icon: <IconComponent className="w-16 h-16" />,
      backgroundImage: item.backgroundImage,
      theme: item.theme || "light",
      primaryButton: item.primaryButton,
      secondaryButton: item.secondaryButton
    }
  })

  // Show loading skeleton if content is loading
  // Disabled since we're using static data only
  if (false) {
    return (
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="w-64 h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse" />
            <div className="w-96 h-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 animate-pulse" />
            <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-3xl p-8 lg:p-12 min-h-[500px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center mb-6"
          >
            <FlaskRound className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Clinical Research Organization
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-light text-gray-900 dark:text-gray-100 mb-6 tracking-tight"
          >
            Leading Healthcare Innovation
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-text text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Transforming healthcare through cutting-edge research, advanced technology platforms, and comprehensive regulatory expertise.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl p-8 lg:p-12 min-h-[500px] shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                section.theme === 'light' 
                  ? 'bg-white dark:bg-gray-800' 
                  : 'bg-gray-900 dark:bg-gray-800'
              }`}
              style={{
                backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Background overlay for better text readability - properly handles dark mode */}
              <div className={`absolute inset-0 ${
                section.theme === 'light' 
                  ? 'bg-white/90 dark:bg-gray-800/90' 
                  : 'bg-gray-900/90 dark:bg-gray-800/90'
              }`} />
              
              {/* Content with relative positioning to appear above overlay */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Icon */}
                <div className={`${
                  section.theme === 'light' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-blue-400'
                } mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  {section.icon}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className={`font-display text-3xl lg:text-4xl font-light ${
                    section.theme === 'light' 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-white'
                  } mb-4 tracking-tight leading-tight`}>
                    {section.title}
                  </h3>
                  
                  <p className={`font-text text-lg ${
                    section.theme === 'light' 
                      ? 'text-gray-600 dark:text-gray-300' 
                      : 'text-gray-300'
                  } mb-6 font-medium tracking-wide`}>
                    {section.subtitle}
                  </p>
                  
                  <p className={`font-text text-base ${
                    section.theme === 'light' 
                      ? 'text-gray-600 dark:text-gray-300' 
                      : 'text-gray-300'
                  } leading-relaxed mb-8 tracking-body`}>
                    {section.description}
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {section.primaryButton && (
                    <LiquidGlassButton 
                      variant="primary" 
                      size="md" 
                      href={section.primaryButton.href}
                    >
                      {section.primaryButton.text}
                    </LiquidGlassButton>
                  )}
                  
                  {section.secondaryButton && (
                    <LiquidGlassButton 
                      variant={section.theme === 'light' ? 'secondary-light' : 'secondary'} 
                      size="md" 
                      href={section.secondaryButton.href}
                    >
                      {section.secondaryButton.text}
                    </LiquidGlassButton>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}