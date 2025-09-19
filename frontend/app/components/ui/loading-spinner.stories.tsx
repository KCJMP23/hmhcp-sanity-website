import type { Meta, StoryObj } from '@storybook/react'
import { LoadingSpinner } from './loading-spinner'

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile loading spinner component built with Framer Motion for smooth animations. Supports multiple variants, sizes, and can display loading text alongside the spinner.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'white', 'muted', 'success', 'warning', 'destructive'],
      description: 'Color variant of the spinner',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    text: {
      control: 'text',
      description: 'Loading text to display alongside spinner',
    },
    textClassName: {
      control: 'text',
      description: 'Custom CSS classes for the text',
    },
  },
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

// Basic usage
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default',
  },
}

export const WithText: Story = {
  args: {
    variant: 'default',
    size: 'default',
    text: 'Loading...',
  },
}

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <LoadingSpinner variant="default" text="Default" />
        <LoadingSpinner variant="muted" text="Muted" />
        <LoadingSpinner variant="success" text="Success" />
        <LoadingSpinner variant="warning" text="Warning" />
        <LoadingSpinner variant="destructive" text="Error" />
      </div>
      
      {/* White variant on dark background */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <LoadingSpinner variant="white" text="White (for dark backgrounds)" />
      </div>
    </div>
  ),
}

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <LoadingSpinner variant="default" size="sm" text="Small" />
      <LoadingSpinner variant="default" size="default" text="Default" />
      <LoadingSpinner variant="default" size="lg" text="Large" />
      <LoadingSpinner variant="default" size="xl" text="Extra Large" />
    </div>
  ),
}

// Different use cases
export const UseCases: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Form Submission</h3>
        <div className="p-4 border rounded-lg">
          <LoadingSpinner variant="default" size="sm" text="Signing in..." />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Data Processing</h3>
        <div className="p-4 border rounded-lg">
          <LoadingSpinner variant="default" size="default" text="Processing your request..." />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">AI Generation</h3>
        <div className="p-4 border rounded-lg bg-blue-50">
          <LoadingSpinner variant="default" size="lg" text="Generating AI content..." />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Success State</h3>
        <div className="p-4 border rounded-lg bg-green-50">
          <LoadingSpinner variant="success" size="default" text="Upload complete!" />
        </div>
      </div>
    </div>
  ),
}

// In buttons
export const InButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
        <LoadingSpinner variant="white" size="sm" />
        <span className="ml-2">Loading...</span>
      </button>
      
      <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center">
        <LoadingSpinner variant="default" size="sm" />
        <span className="ml-2">Processing...</span>
      </button>
      
      <button className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center">
        <LoadingSpinner variant="white" size="default" />
        <span className="ml-3">Saving Changes...</span>
      </button>
    </div>
  ),
}

// Custom styling
export const CustomStyling: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    text: 'Custom styled loading...',
    textClassName: 'text-blue-600 font-bold',
    className: 'p-4 bg-blue-50 rounded-lg',
  },
}

// Accessibility
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <p className="mb-2 text-sm text-gray-600">
          Includes proper ARIA attributes and screen reader support:
        </p>
        <LoadingSpinner 
          variant="default" 
          size="default" 
          text="Loading content..." 
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The LoadingSpinner automatically includes proper ARIA attributes (role="status", aria-label) and screen reader text for accessibility.',
      },
    },
  },
}