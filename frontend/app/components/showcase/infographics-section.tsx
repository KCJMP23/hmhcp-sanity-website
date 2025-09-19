"use client"

import { ContentSection } from "@/components/content-section"
import { ComparisonChart, StatGrid, ProgressCircleGrid } from "@/components/animated-infographics"
import { StickyProgressHeader } from "@/components/sticky-section-header"
import { ScrollReveal } from "@/components/scroll-reveal"
import { comparisonData, statData, progressData } from "./showcase-data"

export function InfographicsSection() {
  return (
    <div id="infographics-section">
      <StickyProgressHeader
        title="Animated Infographics"
        subtitle="Data visualization with engaging animations"
        sectionId="infographics-section"
      />

      <ContentSection width="wide" spacing="xl" className="bg-white dark:bg-gray-900">
        <div className="space-y-16">
          <ScrollReveal animation="fade">
            <div>
              <h3 className="text-2xl font-medium mb-6">Performance Comparison</h3>
              <ComparisonChart data={comparisonData} />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.4}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Statistics Grid</h3>
              <StatGrid stats={statData} />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.6}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Progress Circles</h3>
              <ProgressCircleGrid items={progressData} />
            </div>
          </ScrollReveal>
        </div>
      </ContentSection>
    </div>
  )
}