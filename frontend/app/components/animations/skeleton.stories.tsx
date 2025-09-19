import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton, SkeletonLine, SkeletonCircle, SkeletonButton } from './skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Animations/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Framer Motion-powered skeleton loading components for smooth placeholder animations. Provides consistent loading states across the application with customizable shapes and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton (CSS value)',
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton (CSS value)',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

// Basic skeleton
export const BasicSkeleton: Story = {
  args: {
    className: 'h-4 w-32',
  },
}

// All skeleton types
export const AllSkeletonTypes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Skeleton</h3>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Skeleton Lines</h3>
        <div className="space-y-2">
          <SkeletonLine width="12rem" />
          <SkeletonLine width="8rem" />
          <SkeletonLine width="10rem" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Skeleton Circles</h3>
        <div className="flex gap-4 items-center">
          <SkeletonCircle size="2rem" />
          <SkeletonCircle size="3rem" />
          <SkeletonCircle size="4rem" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Skeleton Buttons</h3>
        <div className="flex gap-4">
          <SkeletonButton width="4rem" height="2rem" />
          <SkeletonButton width="6rem" height="2.5rem" />
          <SkeletonButton width="8rem" height="3rem" />
        </div>
      </div>
    </div>
  ),
}

// Card layout example
export const CardSkeleton: Story = {
  render: () => (
    <div className="border rounded-lg p-6 w-80">
      <div className="flex items-start space-x-4">
        <SkeletonCircle size="3rem" />
        <div className="flex-1">
          <SkeletonLine width="8rem" className="mb-2" />
          <SkeletonLine width="6rem" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="mt-4 flex justify-between">
        <SkeletonButton width="4rem" height="2rem" />
        <SkeletonButton width="5rem" height="2rem" />
      </div>
    </div>
  ),
}

// Navigation skeleton
export const NavigationSkeleton: Story = {
  render: () => (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24 bg-white/20" />
        <div className="flex items-center space-x-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonLine key={i} width="4rem" className="bg-white/20" />
          ))}
        </div>
        <SkeletonCircle size="2rem" className="bg-white/20" />
      </div>
    </div>
  ),
}

// Article list skeleton
export const ArticleListSkeleton: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Skeleton className="h-16 w-16 rounded" />
            <div className="flex-1">
              <SkeletonLine width="100%" className="mb-2" />
              <SkeletonLine width="80%" className="mb-2" />
              <div className="flex items-center space-x-4 mt-3">
                <SkeletonLine width="3rem" />
                <SkeletonLine width="4rem" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
}

// Dashboard skeleton
export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonLine width="12rem" className="mb-2 h-6" />
          <SkeletonLine width="20rem" />
        </div>
        <SkeletonButton width="6rem" height="2.5rem" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <SkeletonCircle size="2rem" />
              <SkeletonLine width="2rem" />
            </div>
            <SkeletonLine width="3rem" className="mb-2 h-6" />
            <SkeletonLine width="4rem" />
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="border rounded-lg p-6">
        <SkeletonLine width="8rem" className="mb-4 h-5" />
        <Skeleton className="h-64 w-full rounded" />
      </div>
      
      {/* Table */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <SkeletonLine width="6rem" className="h-5" />
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center space-x-4">
              <SkeletonCircle size="2rem" />
              <div className="flex-1 grid grid-cols-4 gap-4">
                <SkeletonLine width="6rem" />
                <SkeletonLine width="4rem" />
                <SkeletonLine width="5rem" />
                <SkeletonLine width="3rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

// Loading states comparison
export const LoadingStatesComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Framer Motion Skeleton (Smooth)</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <SkeletonCircle size="2.5rem" />
            <div>
              <SkeletonLine width="6rem" className="mb-1" />
              <SkeletonLine width="4rem" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">CSS Pulse Animation (Legacy)</h3>
        <div className="border rounded-lg p-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

// Accessibility features
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">Motion Preferences Respected</h4>
        <p className="text-sm text-gray-600 mb-3">
          Framer Motion automatically respects user motion preferences (prefers-reduced-motion)
        </p>
        <SkeletonLine width="8rem" />
      </div>
      
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">Screen Reader Friendly</h4>
        <p className="text-sm text-gray-600 mb-3">
          Skeleton components provide loading context for assistive technologies
        </p>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  ),
}