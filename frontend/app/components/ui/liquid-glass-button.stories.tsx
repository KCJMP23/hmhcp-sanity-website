import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { LiquidGlassButton } from './liquid-glass-button'
import { ArrowRight, Download, Settings, Sparkles, Play, Save } from 'lucide-react'

const meta: Meta<typeof LiquidGlassButton> = {
  title: 'UI/LiquidGlassButton',
  component: LiquidGlassButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A premium button component with Apple-inspired liquid glass design. Features multiple variants, sizes, and supports both button and link functionality with smooth animations and visual effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'secondary-light'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'cta'],
      description: 'Size of the button',
    },
    showArrow: {
      control: 'boolean',
      description: 'Show arrow icon in the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    href: {
      control: 'text',
      description: 'URL for link functionality (renders as Link component)',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof LiquidGlassButton>

export default meta
type Story = StoryObj<typeof meta>

// Primary variant stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Primary Button',
  },
}

export const PrimaryWithIcon: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: (
      <>
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Content
      </>
    ),
  },
}

export const PrimaryWithArrow: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    showArrow: true,
    children: 'Get Started',
  },
}

// Secondary variant stories
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Secondary Button',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
}

export const SecondaryLight: Story = {
  args: {
    variant: 'secondary-light',
    size: 'md',
    children: 'Secondary Light',
  },
}

// Size variations
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <LiquidGlassButton variant="primary" size="sm">
        Small
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="md">
        Medium
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="lg">
        Large
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="xl">
        Extra Large
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="cta">
        Call to Action
      </LiquidGlassButton>
    </div>
  ),
}

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <div className="p-8 bg-white rounded-lg">
        <div className="flex gap-4">
          <LiquidGlassButton variant="primary" size="md">
            Primary
          </LiquidGlassButton>
          <LiquidGlassButton variant="secondary-light" size="md">
            Secondary Light
          </LiquidGlassButton>
        </div>
      </div>
      <div className="p-8 bg-gray-900 rounded-lg">
        <LiquidGlassButton variant="secondary" size="md">
          Secondary (for dark backgrounds)
        </LiquidGlassButton>
      </div>
    </div>
  ),
}

// Interactive states
export const InteractiveStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <LiquidGlassButton variant="primary" size="md">
        Normal
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="md" disabled>
        Disabled
      </LiquidGlassButton>
    </div>
  ),
}

// With different icons
export const WithDifferentIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <LiquidGlassButton variant="primary" size="md">
        <Download className="w-4 h-4 mr-2" />
        Download
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="md">
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="md">
        <Play className="w-4 h-4 mr-2" />
        Play
      </LiquidGlassButton>
      <LiquidGlassButton variant="primary" size="md">
        <Save className="w-4 h-4 mr-2" />
        Save
      </LiquidGlassButton>
    </div>
  ),
}

// As Link
export const AsLink: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    href: '/example',
    showArrow: true,
    children: 'Navigate to Page',
  },
}

// Long text
export const LongText: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'This is a very long button text to test wrapping',
  },
}

// Premium use case examples
export const PremiumUseCases: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">AI Features</h3>
        <div className="flex gap-4 justify-center">
          <LiquidGlassButton variant="primary" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Content
          </LiquidGlassButton>
          <LiquidGlassButton variant="secondary-light" size="md">
            <Settings className="w-4 h-4 mr-2" />
            AI Settings
          </LiquidGlassButton>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
        <div className="flex gap-4 justify-center">
          <LiquidGlassButton variant="primary" size="md">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </LiquidGlassButton>
          <LiquidGlassButton variant="secondary-light" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  ),
}