"use client"

import { ContentSection } from "@/components/content-section"
import { ExpandableContent, Tabs, CardFlip, HoverReveal } from "@/components/interactive-content"
import { StickyProgressHeader } from "@/components/sticky-section-header"
import { ScrollReveal } from "@/components/scroll-reveal"
import { tabContent, flipCardData } from "./showcase-data"

export function InteractiveSection() {
  return (
    <div id="interactive-section" className="bg-gray-50">
      <StickyProgressHeader
        title="Interactive Elements"
        subtitle="Engage users with interactive content components"
        sectionId="interactive-section"
      />

      <ContentSection width="wide" spacing="xl" className="bg-gray-50 dark:bg-gray-900">
        <div className="space-y-16">
          <ScrollReveal animation="fade">
            <div>
              <h3 className="text-2xl font-medium mb-6">Expandable Content</h3>
              <div className="space-y-4">
                <ExpandableContent
                  title="What is Digital Health Transformation?"
                >
                  <p className="mb-4">
                    Digital health transformation is the process of leveraging technology to improve healthcare
                    delivery, enhance patient experiences, and optimize operational efficiency. This comprehensive
                    approach involves implementing electronic health records (EHRs), telemedicine platforms, mobile
                    health applications, and data analytics tools.
                  </p>
                  <p>
                    The transformation journey requires careful planning, stakeholder engagement, and a clear vision
                    for how technology can support organizational goals while maintaining focus on patient-centered
                    care.
                  </p>
                </ExpandableContent>

                <ExpandableContent
                  title="Benefits of Healthcare Analytics"
                >
                  <p className="mb-4">
                    Healthcare analytics provides valuable insights that drive better clinical and operational
                    decisions. By analyzing large volumes of healthcare data, organizations can identify patterns,
                    predict outcomes, and optimize resource allocation.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Improved patient outcomes through predictive analytics</li>
                    <li>Reduced readmission rates</li>
                    <li>Enhanced operational efficiency</li>
                    <li>Better resource utilization</li>
                    <li>Data-driven clinical decision support</li>
                  </ul>
                </ExpandableContent>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.2}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Tabbed Content</h3>
              <Tabs tabs={tabContent} />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.4}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Card Flip Interactions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {flipCardData.map((card, index) => (
                  <CardFlip 
                    key={index} 
                    front={
                      <div className="text-center">
                        <div className="text-4xl mb-4">{card.front.icon}</div>
                        <h4 className="text-xl font-semibold mb-2">{card.front.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{card.front.description}</p>
                      </div>
                    }
                    back={
                      <div className="text-center">
                        <h4 className="text-xl font-semibold mb-2">{card.back.title}</h4>
                        <p className="text-sm mb-4">{card.back.description}</p>
                        {card.back.stats && (
                          <div className="space-y-1">
                            {card.back.stats.map((stat, i) => (
                              <div key={i} className="text-xs font-medium">{stat}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={0.6}>
            <div>
              <h3 className="text-2xl font-medium mb-6">Hover Reveal Effects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HoverReveal
                  preview={
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="text-xl font-semibold mb-2">Population Health Management</h4>
                      <p>Hover to learn more about our approach</p>
                    </div>
                  }
                  content={
                    <div className="p-6 bg-blue-600 text-white">
                      <h4 className="text-xl font-semibold mb-2">Our Approach</h4>
                      <p>
                        We use advanced analytics and risk stratification to identify high-risk populations and
                        implement targeted interventions that improve outcomes while reducing costs.
                      </p>
                    </div>
                  }
                />
                <HoverReveal
                  preview={
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="text-xl font-semibold mb-2">Value-Based Care</h4>
                      <p>Hover to discover the benefits</p>
                    </div>
                  }
                  content={
                    <div className="p-6 bg-blue-600 text-white">
                      <h4 className="text-xl font-semibold mb-2">Key Benefits</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Improved patient outcomes</li>
                        <li>• Reduced healthcare costs</li>
                        <li>• Enhanced care coordination</li>
                        <li>• Better provider satisfaction</li>
                      </ul>
                    </div>
                  }
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </ContentSection>
    </div>
  )
}