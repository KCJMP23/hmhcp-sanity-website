"use client"

import type React from "react"

import { useState } from "react"
import { FrostedCard } from "@/components/ui/frosted-card"
import { AppleButton } from "@/components/ui/apple-button"
import { FadeIn, StaggerContainer, StaggerItem, HoverEffect } from "@/components/ui/animations"
import { SectionContainer, SectionHeader } from "@/components/ui/section-container"
import { ArrowRight, Check, ExternalLink } from "lucide-react"

function FrostedCardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

export function DesignShowcase() {
  const [activeTab, setActiveTab] = useState("cards")

  return (
    <SectionContainer>
      <SectionHeader
        title="Apple-Inspired Design System"
        subtitle="Explore our design components featuring subtle gradients, consistent  corners, low-opacity shadows, generous whitespace, and purposeful animations."
        centered
      />

      <div className="flex flex-wrap gap-4 justify-center mb-12">
        <AppleButton
          variant={activeTab === "cards" ? "primary" : "secondary"}
          onClick={() => setActiveTab("cards")}
        >
          Cards
        </AppleButton>
        <AppleButton
          variant={activeTab === "buttons" ? "primary" : "secondary"}
          onClick={() => setActiveTab("buttons")}
        >
          Buttons
        </AppleButton>
        <AppleButton
          variant={activeTab === "animations" ? "primary" : "secondary"}
          onClick={() => setActiveTab("animations")}
        >
          Animations
        </AppleButton>
      </div>

      {activeTab === "cards" && (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StaggerItem>
            <FrostedCard>
              <FrostedCardHeader>
                <h3 className="text-xl font-light">Light Intensity Card</h3>
              </FrostedCardHeader>
              <p className="text-gray-600 dark:text-gray-300">
                Features subtle backdrop blur and gradient background with generous padding.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Subtle gradient background</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Consistent 12px border radius</span>
                </li>
              </ul>
            </FrostedCard>
          </StaggerItem>

          <StaggerItem>
            <FrostedCard>
              <FrostedCardHeader>
                <h3 className="text-xl font-light">Medium Intensity Card</h3>
              </FrostedCardHeader>
              <p className="text-gray-600 dark:text-gray-300">
                The default card style with balanced backdrop blur and shadow effects.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Medium backdrop blur effect</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Low-opacity shadows</span>
                </li>
              </ul>
            </FrostedCard>
          </StaggerItem>

          <StaggerItem>
            <FrostedCard>
              <FrostedCardHeader>
                <h3 className="text-xl font-light">Strong Intensity Card</h3>
              </FrostedCardHeader>
              <p className="text-gray-600 dark:text-gray-300">
                Maximum backdrop blur for content that needs to stand out more prominently.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Strong backdrop blur</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-blue-600 mr-2" />
                  <span>Hover animation effect</span>
                </li>
              </ul>
            </FrostedCard>
          </StaggerItem>
        </StaggerContainer>
      )}

      {activeTab === "buttons" && (
        <StaggerContainer className="flex flex-col items-center gap-8">
          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <FrostedCard>
                <h3 className="text-xl font-light mb-4">Primary Buttons</h3>
                <div className="space-y-4">
                  <AppleButton variant={"primary"} size={"sm"}>
                    Small Button
                  </AppleButton>
                  <AppleButton variant={"primary"} size={"md"}>
                    Medium Button
                  </AppleButton>
                  <AppleButton
                    variant={"primary"}
                    size={"lg"}
                    icon={<ArrowRight className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    Large Button
                  </AppleButton>
                </div>
              </FrostedCard>

              <FrostedCard>
                <h3 className="text-xl font-light mb-4">Secondary Buttons</h3>
                <div className="space-y-4">
                  <AppleButton variant={"secondary"} size={"sm"}>
                    Small Button
                  </AppleButton>
                  <AppleButton variant={"secondary"} size={"md"}>
                    Medium Button
                  </AppleButton>
                  <AppleButton
                    variant={"secondary"}
                    size={"lg"}
                    icon={<ExternalLink className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    Large Button
                  </AppleButton>
                </div>
              </FrostedCard>

              <FrostedCard>
                <h3 className="text-xl font-light mb-4">Other Variants</h3>
                <div className="space-y-4">
                  <AppleButton variant={"outline"} size={"md"}>
                    Outline Button
                  </AppleButton>
                  <AppleButton variant={"ghost"} size={"md"}>
                    Ghost Button
                  </AppleButton>
                  <AppleButton variant={"link"} size={"md"}>
                    Link Button
                  </AppleButton>
                </div>
              </FrostedCard>
            </div>
          </StaggerItem>
        </StaggerContainer>
      )}

      {activeTab === "animations" && (
        <div className="space-y-16">
          <FadeIn>
            <FrostedCard>
              <h3 className="text-xl font-light mb-4">Fade In Animation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This entire card uses the FadeIn component with Apple-style easing.
              </p>
              <AppleButton variant={"primary"}>Animated Button</AppleButton>
            </FrostedCard>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <HoverEffect>
                <FrostedCard>
                  <h3 className="text-xl font-light mb-4">Hover Effect 1</h3>
                  <p className="text-gray-600 dark:text-gray-300">This card scales and lifts slightly on hover.</p>
                </FrostedCard>
              </HoverEffect>
            </StaggerItem>

            <StaggerItem>
              <HoverEffect scale={1.03} rotate={1}>
                <FrostedCard>
                  <h3 className="text-xl font-light mb-4">Hover Effect 2</h3>
                  <p className="text-gray-600 dark:text-gray-300">This card scales less but adds a slight rotation.</p>
                </FrostedCard>
              </HoverEffect>
            </StaggerItem>

            <StaggerItem>
              <HoverEffect lift={false}>
                <FrostedCard>
                  <h3 className="text-xl font-light mb-4">Hover Effect 3</h3>
                  <p className="text-gray-600 dark:text-gray-300">This card scales without lifting on hover.</p>
                </FrostedCard>
              </HoverEffect>
            </StaggerItem>
          </StaggerContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeIn direction="left">
              <FrostedCard>
                <h3 className="text-xl font-light mb-4">Fade In From Left</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This card fades in from the left side with Apple-style easing.
                </p>
              </FrostedCard>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <FrostedCard>
                <h3 className="text-xl font-light mb-4">Fade In From Right</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This card fades in from the right side with a slight delay.
                </p>
              </FrostedCard>
            </FadeIn>
          </div>
        </div>
      )}
    </SectionContainer>
  )
}
