"use client"

import { ContentSection } from "@/components/content-section"
import { BeforeAfterSlider, SideBySideComparison, TabbedComparison } from "@/components/content-comparison"
import { StickyProgressHeader } from "@/components/sticky-section-header"
import { ScrollReveal } from "@/components/scroll-reveal"

export function ComparisonSection() {
  return (
    <div id="comparison-section" className="bg-gray-50">
      <StickyProgressHeader
        title="Content Comparison"
        subtitle="Before and after comparisons with interactive elements"
        sectionId="comparison-section"
      />

      <ContentSection width="wide" spacing="xl" className="bg-gray-50 dark:bg-gray-900">
        <div className="space-y-16">
          <ScrollReveal animation="fade">
            <div>
              <h3 className="text-2xl font-medium mb-6">Before/After Slider</h3>
              <BeforeAfterSlider
                beforeImage={{
                  src: "/healthcare-facility-before.png",
                  alt: "Healthcare facility before renovation",
                }}
                afterImage={{
                  src: "/healthcare-facility-after.png",
                  alt: "Healthcare facility after renovation",
                }}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.2}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Side-by-Side Comparison</h3>
              <SideBySideComparison
                leftContent={
                  <div>
                    <h4 className="font-semibold mb-4">Traditional Approach</h4>
                    <ul className="space-y-2">
                      <li>• Manual paper-based processes</li>
                      <li>• Fragmented patient data</li>
                      <li>• Limited accessibility</li>
                      <li>• Time-consuming workflows</li>
                      <li>• Higher error rates</li>
                    </ul>
                  </div>
                }
                rightContent={
                  <div>
                    <h4 className="font-semibold mb-4">Modern Solution</h4>
                    <ul className="space-y-2">
                      <li>• Digital automated workflows</li>
                      <li>• Integrated health records</li>
                      <li>• 24/7 patient portal access</li>
                      <li>• Streamlined operations</li>
                      <li>• Enhanced accuracy & safety</li>
                    </ul>
                  </div>
                }
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.4}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Tabbed Comparison</h3>
              <TabbedComparison
                tabs={[
                  {
                    label: "Features",
                    content: (
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold mb-4">Basic Plan</h4>
                          <ul className="space-y-2">
                            <li>• Core functionality</li>
                            <li>• Email support</li>
                            <li>• Basic analytics</li>
                            <li>• 5 user seats</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Enterprise Plan</h4>
                          <ul className="space-y-2">
                            <li>• Advanced features</li>
                            <li>• 24/7 phone support</li>
                            <li>• Custom analytics</li>
                            <li>• Unlimited users</li>
                            <li>• API access</li>
                            <li>• Custom integrations</li>
                          </ul>
                        </div>
                      </div>
                    ),
                  },
                  {
                    label: "Benefits",
                    content: (
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold mb-4">Basic Benefits</h4>
                          <ul className="space-y-2">
                            <li>• Cost-effective</li>
                            <li>• Easy to start</li>
                            <li>• Essential tools</li>
                            <li>• Standard security</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Enterprise Benefits</h4>
                          <ul className="space-y-2">
                            <li>• Scalable solution</li>
                            <li>• Priority support</li>
                            <li>• Advanced security</li>
                            <li>• Custom workflows</li>
                            <li>• Dedicated success manager</li>
                          </ul>
                        </div>
                      </div>
                    ),
                  },
                  {
                    label: "Pricing",
                    content: (
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold mb-4">$99/month</h4>
                          <ul className="space-y-2">
                            <li>• Monthly billing</li>
                            <li>• No setup fee</li>
                            <li>• 30-day trial</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Custom Pricing</h4>
                          <ul className="space-y-2">
                            <li>• Annual contracts</li>
                            <li>• Volume discounts</li>
                            <li>• Implementation support</li>
                            <li>• Training included</li>
                          </ul>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </ScrollReveal>
        </div>
      </ContentSection>
    </div>
  )
}