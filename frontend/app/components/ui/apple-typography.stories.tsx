import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from './apple-typography'

const meta: Meta<typeof Typography> = {
  title: 'UI/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Apple-inspired typography system with responsive text scaling and proper semantic HTML elements. Built with Apple SF Pro fonts for a premium, professional appearance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'label'],
      description: 'HTML element to render',
    },
    variant: {
      control: { type: 'select' },
      options: ['display', 'heading1', 'heading2', 'heading3', 'heading4', 'body', 'small', 'caption', 'label'],
      description: 'Typography variant with Apple-inspired sizing',
    },
    children: {
      control: 'text',
      description: 'Text content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

// Basic usage
export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text using Apple SF Pro with responsive scaling and proper line height for optimal readability.',
  },
}

// All typography variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <Typography variant="display">
        Display Text - Premium Headlines
      </Typography>
      
      <Typography variant="heading1">
        Heading 1 - Main Page Titles
      </Typography>
      
      <Typography variant="heading2">
        Heading 2 - Section Headers
      </Typography>
      
      <Typography variant="heading3">
        Heading 3 - Subsection Titles
      </Typography>
      
      <Typography variant="heading4">
        Heading 4 - Component Headers
      </Typography>
      
      <Typography variant="body">
        Body text for main content. This variant provides optimal readability with proper line height 
        and responsive scaling. Perfect for paragraphs, descriptions, and general content.
      </Typography>
      
      <Typography variant="small">
        Small text for secondary information, captions, and less prominent content.
      </Typography>
      
      <Typography variant="caption">
        Caption text for image descriptions and very small annotations.
      </Typography>
      
      <Typography variant="label">
        Label text for form inputs and interface labels.
      </Typography>
    </div>
  ),
}

// Responsive scaling demonstration
export const ResponsiveScaling: Story = {
  render: () => (
    <div className="space-y-8 w-full">
      <div className="text-center">
        <Typography variant="display" className="mb-4">
          Responsive Typography
        </Typography>
        <Typography variant="body">
          Resize your browser window to see how the typography scales automatically 
          across different screen sizes for optimal readability.
        </Typography>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg">
          <Typography variant="heading3" className="mb-3">
            Desktop View
          </Typography>
          <Typography variant="body">
            Larger text sizes for comfortable reading on desktop screens with 
            generous spacing and clear hierarchy.
          </Typography>
        </div>
        
        <div className="p-6 border rounded-lg">
          <Typography variant="heading3" className="mb-3">
            Mobile Optimized
          </Typography>
          <Typography variant="body">
            Scaled appropriately for mobile devices with proper touch targets 
            and readable font sizes.
          </Typography>
        </div>
      </div>
    </div>
  ),
}

// Healthcare content examples
export const HealthcareContent: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      <article className="space-y-4">
        <Typography variant="heading1">
          Understanding Patient Care Excellence
        </Typography>
        
        <Typography variant="body">
          At HM Healthcare Partners, we believe that exceptional patient care begins with 
          understanding each individual's unique needs and circumstances. Our comprehensive 
          approach combines cutting-edge medical technology with compassionate, personalized service.
        </Typography>
        
        <Typography variant="heading2">
          Our Treatment Philosophy
        </Typography>
        
        <Typography variant="body">
          We employ evidence-based medicine while maintaining a patient-centered approach. 
          Every treatment plan is carefully tailored to the specific needs, preferences, 
          and goals of our patients.
        </Typography>
        
        <Typography variant="heading3">
          Key Treatment Areas
        </Typography>
        
        <Typography variant="body">
          Our expertise spans multiple medical specialties, ensuring comprehensive care 
          under one roof. From preventive medicine to complex surgical procedures, 
          our team is equipped to handle diverse healthcare needs.
        </Typography>
        
        <Typography variant="small">
          * Individual results may vary. Consult with your healthcare provider 
          to determine the best treatment approach for your specific condition.
        </Typography>
      </article>
    </div>
  ),
}

// Custom HTML elements
export const CustomElements: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography as="h1" variant="heading1">
        Custom H1 Element
      </Typography>
      
      <Typography as="h2" variant="heading2">
        Custom H2 Element
      </Typography>
      
      <Typography as="p" variant="body">
        Custom paragraph element with body styling.
      </Typography>
      
      <Typography as="span" variant="label">
        Inline span with label styling
      </Typography>
      
      <div className="p-4 border rounded-lg">
        <Typography as="label" variant="label" className="block mb-2">
          Form Label Example
        </Typography>
        <input 
          type="text" 
          placeholder="Input field" 
          className="w-full p-2 border rounded"
        />
        <Typography as="span" variant="caption" className="block mt-1">
          Helper text using caption variant
        </Typography>
      </div>
    </div>
  ),
}

// Dark mode support
export const DarkModeSupport: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <Typography variant="heading3" className="mb-3">
          Light Mode
        </Typography>
        <Typography variant="body">
          Typography automatically adapts to light backgrounds with proper contrast ratios 
          for optimal accessibility and readability.
        </Typography>
      </div>
      
      <div className="p-6 bg-gray-900 rounded-lg">
        <Typography variant="heading3" className="mb-3 text-white">
          Dark Mode
        </Typography>
        <Typography variant="body" className="text-gray-300">
          Dark mode support is built-in with automatic color adjustments 
          to maintain readability and visual hierarchy.
        </Typography>
      </div>
    </div>
  ),
}

// Text hierarchy demonstration
export const TextHierarchy: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <div className="border-l-4 border-blue-500 pl-6">
        <Typography variant="display" className="mb-2">
          1. Display
        </Typography>
        <Typography variant="caption">
          Largest text for hero sections and major announcements
        </Typography>
      </div>
      
      <div className="border-l-4 border-green-500 pl-6">
        <Typography variant="heading1" className="mb-2">
          2. Heading 1
        </Typography>
        <Typography variant="caption">
          Main page titles and primary headings
        </Typography>
      </div>
      
      <div className="border-l-4 border-purple-500 pl-6">
        <Typography variant="heading2" className="mb-2">
          3. Heading 2
        </Typography>
        <Typography variant="caption">
          Section headers and major subdivisions
        </Typography>
      </div>
      
      <div className="border-l-4 border-orange-500 pl-6">
        <Typography variant="heading3" className="mb-2">
          4. Heading 3
        </Typography>
        <Typography variant="caption">
          Subsection titles and component headers
        </Typography>
      </div>
      
      <div className="border-l-4 border-red-500 pl-6">
        <Typography variant="body" className="mb-2">
          5. Body Text
        </Typography>
        <Typography variant="caption">
          Main content, paragraphs, and readable text
        </Typography>
      </div>
      
      <div className="border-l-4 border-gray-400 pl-6">
        <Typography variant="small" className="mb-2">
          6. Small Text
        </Typography>
        <Typography variant="caption">
          Secondary information and less prominent content
        </Typography>
      </div>
    </div>
  ),
}

// Accessibility features
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-green-50">
        <Typography variant="heading3" className="mb-3">
          ✅ Accessibility Features
        </Typography>
        <ul className="space-y-2">
          <li>
            <Typography variant="body">
              <strong>Semantic HTML:</strong> Automatic mapping to appropriate HTML elements (h1, h2, p, etc.)
            </Typography>
          </li>
          <li>
            <Typography variant="body">
              <strong>Contrast Compliance:</strong> WCAG 2.1 AA compliant color ratios
            </Typography>
          </li>
          <li>
            <Typography variant="body">
              <strong>Responsive Design:</strong> Scales appropriately across devices
            </Typography>
          </li>
          <li>
            <Typography variant="body">
              <strong>Screen Reader Friendly:</strong> Proper heading hierarchy and semantic structure
            </Typography>
          </li>
        </ul>
      </div>
    </div>
  ),
}