"use client"

import { ContentSection } from "@/components/content-section"
import { AnimatedHeading, GradientText } from "@/components/animated-typography"
import { StickyProgressHeader } from "@/components/sticky-section-header"
import { ScrollReveal } from "@/components/scroll-reveal"

export function TypographySection() {
  return (
    <div id="typography-section">
      <StickyProgressHeader
        title="Typography Enhancements"
        subtitle="Exploring various typographic treatments and animations"
        sectionId="typography-section"
      />

      <ContentSection width="narrow" spacing="xl" className="bg-white dark:bg-gray-900">
        <div className="space-y-12">
          <ScrollReveal animation="fade">
            <div>
              <h3 className="text-2xl font-medium mb-4">Standard Typography</h3>
              <h1 className="mb-4">Heading Level 1</h1>
              <h2 className="mb-4">Heading Level 2</h2>
              <h3 className="mb-4">Heading Level 3</h3>
              <p className="mb-4">
                This is a standard paragraph with regular styling. The typography is responsive and adjusts based on
                the viewport size. We use a clamp function to ensure text is always readable regardless of screen
                size.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.2}>
            <div>
              <h3 className="text-2xl font-medium mb-4">Animated Typography</h3>
              <AnimatedHeading animation="fade" className="mb-4">
                Fade Animation Heading
              </AnimatedHeading>
              <AnimatedHeading animation="reveal" className="mb-4">
                Reveal Animation Heading
              </AnimatedHeading>
              <AnimatedHeading animation="slide" className="mb-4">
                Slide Animation Heading
              </AnimatedHeading>
              <AnimatedHeading animation="character" className="mb-4">
                Character Animation Heading
              </AnimatedHeading>
              <AnimatedHeading animation="highlight" className="mb-4">
                Highlight Animation Heading
              </AnimatedHeading>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.4}>
            <div>
              <h3 className="text-2xl font-medium mb-4">Gradient Text</h3>
              <h2 className="mb-4">
                <GradientText className="text-gradient-blue">Blue Gradient Text</GradientText>
              </h2>
              <h2 className="mb-4">
                <GradientText className="text-gradient-purple">Purple Gradient Text</GradientText>
              </h2>
              <h2 className="mb-4">
                <GradientText className="text-gradient-teal">Teal Gradient Text</GradientText>
              </h2>
              <h2 className="mb-4">
                <GradientText className="text-gradient-sunset">Sunset Gradient Text</GradientText>
              </h2>
            </div>
          </ScrollReveal>
        </div>
      </ContentSection>
    </div>
  )
}