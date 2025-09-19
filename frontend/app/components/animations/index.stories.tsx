import type { Meta, StoryObj } from '@storybook/react'
import { FadeIn, StaggerContainer, StaggerItem } from './index'

const meta: Meta<typeof FadeIn> = {
  title: 'Animations/Framer Motion Components',
  component: FadeIn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Standardized Framer Motion animation components for consistent entrance animations throughout the application. Includes FadeIn for individual elements and StaggerContainer/StaggerItem for orchestrated animations.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FadeIn>

export default meta
type Story = StoryObj<typeof meta>

// FadeIn examples
export const FadeInBasic: Story = {
  render: () => (
    <div className="space-y-4">
      <FadeIn>
        <div className="p-6 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold">Fade In Animation</h3>
          <p>This element fades in from the bottom with a smooth transition.</p>
        </div>
      </FadeIn>
    </div>
  ),
}

export const FadeInDirections: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <FadeIn direction="up">
        <div className="p-4 bg-blue-100 rounded-lg text-center">
          <strong>From Bottom</strong>
          <p className="text-sm">direction="up"</p>
        </div>
      </FadeIn>
      
      <FadeIn direction="down">
        <div className="p-4 bg-green-100 rounded-lg text-center">
          <strong>From Top</strong>
          <p className="text-sm">direction="down"</p>
        </div>
      </FadeIn>
      
      <FadeIn direction="left">
        <div className="p-4 bg-purple-100 rounded-lg text-center">
          <strong>From Right</strong>
          <p className="text-sm">direction="left"</p>
        </div>
      </FadeIn>
      
      <FadeIn direction="right">
        <div className="p-4 bg-orange-100 rounded-lg text-center">
          <strong>From Left</strong>
          <p className="text-sm">direction="right"</p>
        </div>
      </FadeIn>
    </div>
  ),
}

export const FadeInWithDelay: Story = {
  render: () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="p-4 bg-blue-100 rounded-lg">First (no delay)</div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div className="p-4 bg-green-100 rounded-lg">Second (0.2s delay)</div>
      </FadeIn>
      <FadeIn delay={0.4}>
        <div className="p-4 bg-purple-100 rounded-lg">Third (0.4s delay)</div>
      </FadeIn>
    </div>
  ),
}

// StaggerContainer examples
export const StaggeredList: Story = {
  render: () => (
    <StaggerContainer className="space-y-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <StaggerItem key={item}>
          <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
            List Item {item}
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
}

export const StaggeredGrid: Story = {
  render: () => (
    <StaggerContainer className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
        <StaggerItem key={item}>
          <div className="aspect-square bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
            {item}
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
}

export const StaggeredCards: Story = {
  render: () => (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.15}>
      {[
        { title: 'Healthcare AI', description: 'AI-powered healthcare solutions', color: 'from-blue-500 to-cyan-500' },
        { title: 'Medical Research', description: 'Clinical trial management', color: 'from-green-500 to-emerald-500' },
        { title: 'Patient Care', description: 'Comprehensive patient management', color: 'from-purple-500 to-pink-500' },
        { title: 'Data Analytics', description: 'Healthcare data insights', color: 'from-orange-500 to-red-500' },
        { title: 'Compliance', description: 'HIPAA and regulatory compliance', color: 'from-indigo-500 to-purple-500' },
        { title: 'Telemedicine', description: 'Remote healthcare delivery', color: 'from-teal-500 to-green-500' },
      ].map((card, index) => (
        <StaggerItem key={index}>
          <div className={`p-6 bg-gradient-to-br ${card.color} text-white rounded-xl`}>
            <h3 className="text-xl font-bold mb-2">{card.title}</h3>
            <p className="opacity-90">{card.description}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  ),
}

// Performance comparison
export const PerformanceComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Framer Motion (Smooth, GPU-accelerated)</h3>
        <FadeIn>
          <div className="p-6 bg-green-100 border-2 border-green-500 rounded-lg">
            <strong>✓ Framer Motion Animation</strong>
            <p className="text-sm mt-2">Smooth, performant, and respects user motion preferences</p>
          </div>
        </FadeIn>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">CSS Animation (Legacy)</h3>
        <div className="animate-pulse">
          <div className="p-6 bg-orange-100 border-2 border-orange-500 rounded-lg">
            <strong>⚠ CSS Animation</strong>
            <p className="text-sm mt-2">Basic animation, may not respect motion preferences</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

// Real-world use cases
export const RealWorldUseCases: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
        <FadeIn direction="up" duration={0.8}>
          <div className="text-center p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">
            <h1 className="text-3xl font-bold mb-4">Healthcare Innovation</h1>
            <p className="text-lg opacity-90">Transforming healthcare through technology</p>
          </div>
        </FadeIn>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Feature Cards</h3>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['AI-Powered', 'Secure', 'Scalable'].map((feature, index) => (
            <StaggerItem key={index}>
              <div className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">{feature}</h4>
                <p className="text-sm text-gray-600">Advanced healthcare solutions</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <StaggerContainer className="space-y-3">
          {['Processing patient data...', 'Analyzing medical records...', 'Generating insights...'].map((text, index) => (
            <StaggerItem key={index}>
              <div className="p-4 bg-blue-50 rounded-lg flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-blue-800">{text}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  ),
}