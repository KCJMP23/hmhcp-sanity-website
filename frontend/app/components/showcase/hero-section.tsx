"use client"

import { AnimatedHeading, AnimatedParagraph } from "@/components/animated-typography"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-950 py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/70"></div>
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center">
          <AnimatedHeading as="h1" animation="character" className="text-white mb-6">
            Content Presentation Showcase
          </AnimatedHeading>
          <AnimatedParagraph animation="fade" delay={0.8} className="max-w-2xl mx-auto text-xl text-blue-100 mb-10">
            Exploring premium content presentation techniques for healthcare websites
          </AnimatedParagraph>
        </div>
      </div>
    </section>
  )
}