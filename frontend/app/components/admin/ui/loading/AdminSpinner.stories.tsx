/**
 * @fileoverview Storybook stories for AdminSpinner component
 * @module components/admin/ui/loading/AdminSpinner.stories
 * @since 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react'
import { AdminSpinner } from './AdminSpinner'

const meta = {
  title: 'Admin/UI/Loading/AdminSpinner',
  component: AdminSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A flexible loading spinner component designed for healthcare admin interfaces.
Provides multiple size and color variants with accessibility support.
Can be used inline, centered, or as a full-screen overlay.

**Healthcare Use Cases:**
- Patient data loading indicators
- Medical record processing
- Report generation progress
- Database query execution
- Form submission feedback

**Accessibility Features:**
- ARIA role="status" for screen readers
- Customizable labels for context
- High contrast color options
- Keyboard navigation support
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'aria-hidden-focus',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size variant of the spinner',
      table: {
        type: { summary: 'xs | sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'white'],
      description: 'Color theme of the spinner',
      table: {
        type: { summary: 'primary | secondary | success | warning | danger | info | white' },
        defaultValue: { summary: 'primary' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Loading...' },
      },
    },
    showLabel: {
      control: 'boolean',
      description: 'Show label text next to spinner',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    center: {
      control: 'boolean',
      description: 'Center the spinner in container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    overlay: {
      control: 'boolean',
      description: 'Full screen overlay mode with backdrop',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof AdminSpinner>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default spinner with medium size and primary color
 */
export const Default: Story = {
  args: {},
}

/**
 * All size variants displayed together for comparison
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <AdminSpinner size="xs" />
        <p className="mt-2 text-sm text-gray-600">Extra Small</p>
      </div>
      <div className="text-center">
        <AdminSpinner size="sm" />
        <p className="mt-2 text-sm text-gray-600">Small</p>
      </div>
      <div className="text-center">
        <AdminSpinner size="md" />
        <p className="mt-2 text-sm text-gray-600">Medium</p>
      </div>
      <div className="text-center">
        <AdminSpinner size="lg" />
        <p className="mt-2 text-sm text-gray-600">Large</p>
      </div>
      <div className="text-center">
        <AdminSpinner size="xl" />
        <p className="mt-2 text-sm text-gray-600">Extra Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available size variants: xs, sm, md, lg, xl',
      },
    },
  },
}

/**
 * All color variants displayed together
 */
export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="text-center">
        <AdminSpinner color="primary" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Primary</p>
      </div>
      <div className="text-center">
        <AdminSpinner color="secondary" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Secondary</p>
      </div>
      <div className="text-center">
        <AdminSpinner color="success" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Success</p>
      </div>
      <div className="text-center">
        <AdminSpinner color="warning" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Warning</p>
      </div>
      <div className="text-center">
        <AdminSpinner color="danger" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Danger</p>
      </div>
      <div className="text-center">
        <AdminSpinner color="info" size="lg" />
        <p className="mt-2 text-sm text-gray-600">Info</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available color variants with healthcare-appropriate theming',
      },
    },
  },
}

/**
 * Spinner with visible label text
 */
export const WithLabel: Story = {
  args: {
    showLabel: true,
    label: 'Processing patient data...',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Spinner with visible label text for context-aware loading states',
      },
    },
  },
}

/**
 * Centered spinner in container
 */
export const Centered: Story = {
  args: {
    center: true,
    size: 'xl',
    showLabel: true,
    label: 'Loading medical records...',
  },
  render: (args) => (
    <div className="h-64 w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <AdminSpinner {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spinner centered within a container, useful for content loading areas',
      },
    },
  },
}

/**
 * Full screen overlay spinner
 */
export const Overlay: Story = {
  args: {
    overlay: true,
    size: 'xl',
    color: 'white',
    showLabel: true,
    label: 'Saving changes...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Full screen overlay spinner with backdrop blur for blocking interactions',
      },
    },
  },
}

/**
 * Healthcare data processing scenario
 */
export const HealthcareDataProcessing: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-white rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Patient Data Processing</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="font-medium text-blue-900">Analyzing lab results</p>
            <p className="text-sm text-blue-700">Processing 127 test results...</p>
          </div>
          <AdminSpinner color="primary" size="md" />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <p className="font-medium text-green-900">Generating report</p>
            <p className="text-sm text-green-700">Creating patient summary...</p>
          </div>
          <AdminSpinner color="success" size="md" />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div>
            <p className="font-medium text-yellow-900">Validating data</p>
            <p className="text-sm text-yellow-700">Checking for anomalies...</p>
          </div>
          <AdminSpinner color="warning" size="md" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Healthcare-specific use case showing different processing states with contextual colors',
      },
    },
  },
}

/**
 * Medical record loading states
 */
export const MedicalRecordStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Patient Dashboard</h4>
        <AdminSpinner 
          center 
          size="lg" 
          showLabel 
          label="Loading patient overview..." 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Lab Results</h4>
        <AdminSpinner 
          center 
          size="lg" 
          color="info" 
          showLabel 
          label="Fetching latest tests..." 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Medications</h4>
        <AdminSpinner 
          center 
          size="lg" 
          color="success" 
          showLabel 
          label="Loading prescriptions..." 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Appointments</h4>
        <AdminSpinner 
          center 
          size="lg" 
          color="warning" 
          showLabel 
          label="Syncing schedule..." 
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Various medical record loading states with contextual labels and colors',
      },
    },
  },
}

/**
 * Interactive spinner with all controls
 */
export const Interactive: Story = {
  args: {
    size: 'lg',
    color: 'primary',
    label: 'Loading...',
    showLabel: false,
    center: false,
    overlay: false,
  },
}

/**
 * Accessibility focused example
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">High Contrast</h4>
        <div className="flex gap-4 items-center">
          <AdminSpinner color="primary" size="lg" />
          <AdminSpinner color="danger" size="lg" />
          <div className="bg-gray-900 p-4 rounded">
            <AdminSpinner color="white" size="lg" />
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">Screen Reader Friendly</h4>
        <AdminSpinner 
          size="lg" 
          label="Processing medical data for patient John Doe, please wait..."
          showLabel
        />
        <p className="mt-2 text-sm text-gray-600">
          Custom labels provide context for screen readers
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including high contrast colors and descriptive labels',
      },
    },
  },
}