'use client'

interface CTASectionProps {
  title?: string
  subtitle?: string
  primaryCTA?: string
  secondaryCTA?: string
}

export function CTASection({ 
  title = "Ready to Get Started?", 
  subtitle = "Join thousands of healthcare professionals who trust our platform",
  primaryCTA = "Get Started",
  secondaryCTA = "Learn More"
}: CTASectionProps) {
  return (
    <section className="bg-blue-600 dark:bg-blue-700 text-white py-16">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-4xl font-light mb-6">
          {title}
        </h2>
        <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light shadow-lg hover:shadow-xl transition-all duration-300">
            {primaryCTA}
          </button>
          <button className="border-white/30 dark:border-white/40 bg-white/15 dark:bg-white/10 backdrop-blur-md text-white hover:bg-white/25 dark:hover:bg-white/20 px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg rounded-full font-light transition-all duration-300">
            {secondaryCTA}
          </button>
        </div>
      </div>
    </section>
  )
}
