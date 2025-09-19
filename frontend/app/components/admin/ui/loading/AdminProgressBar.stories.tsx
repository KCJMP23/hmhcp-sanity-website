/**
 * @fileoverview Storybook stories for AdminProgressBar component
 * @module components/admin/ui/loading/AdminProgressBar.stories
 * @since 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState, useEffect } from 'react'
import { AdminProgressBar, AdminProgressSteps } from './AdminProgressBar'

const meta = {
  title: 'Admin/UI/Loading/AdminProgressBar',
  component: AdminProgressBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible progress bar component for healthcare admin interfaces.
Supports determinate, indeterminate, and buffered progress states with multiple size, color, and label positioning options.

**Healthcare Use Cases:**
- Medical data processing progress
- File upload/download tracking
- Report generation status
- Patient data synchronization
- Multi-step form wizards
- System backup/restore operations

**Progress States:**
- **Determinate**: Shows specific progress value (0-100)
- **Indeterminate**: Animated loading without specific progress
- **Buffered**: Shows both progress and buffer values (like video loading)

**Accessibility Features:**
- ARIA progressbar role with value attributes
- Descriptive labels for screen readers
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
            id: 'aria-progressbar-name',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Current progress value (0-100)',
      table: {
        type: { summary: 'number' },
      },
    },
    max: {
      control: { type: 'number', min: 1, max: 1000 },
      description: 'Maximum progress value',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size variant of the progress bar',
      table: {
        type: { summary: 'xs | sm | md | lg | xl' },
        defaultValue: { summary: 'md' },
      },
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
      description: 'Color theme of the progress bar',
      table: {
        type: { summary: 'primary | secondary | success | warning | danger | info' },
        defaultValue: { summary: 'primary' },
      },
    },
    variant: {
      control: 'select',
      options: ['default', 'striped', 'animated'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'default | striped | animated' },
        defaultValue: { summary: 'default' },
      },
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    labelPosition: {
      control: 'select',
      options: ['inside', 'outside', 'top', 'bottom'],
      description: 'Label position relative to progress bar',
      table: {
        type: { summary: 'inside | outside | top | bottom' },
        defaultValue: { summary: 'outside' },
      },
    },
    label: {
      control: 'text',
      description: 'Custom label text (overrides percentage)',
      table: {
        type: { summary: 'string' },
      },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (animated without specific value)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    bufferValue: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Buffer value for buffered progress',
      table: {
        type: { summary: 'number' },
      },
    },
  },
} satisfies Meta<typeof AdminProgressBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default progress bar at 50% completion
 */
export const Default: Story = {
  args: {
    value: 50,
  },
}

/**
 * All size variants comparison
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Extra Small (xs)</h4>
        <AdminProgressBar value={75} size="xs" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Small (sm)</h4>
        <AdminProgressBar value={60} size="sm" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Medium (md) - Default</h4>
        <AdminProgressBar value={45} size="md" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Large (lg)</h4>
        <AdminProgressBar value={80} size="lg" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Extra Large (xl)</h4>
        <AdminProgressBar value={35} size="xl" showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available size variants from extra small to extra large',
      },
    },
  },
}

/**
 * All color variants with healthcare theming
 */
export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Primary (Default)</h4>
        <AdminProgressBar value={65} color="primary" showLabel />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Secondary</h4>
        <AdminProgressBar value={50} color="secondary" showLabel />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Success (Health Goals)</h4>
        <AdminProgressBar value={85} color="success" showLabel />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Warning (Attention Needed)</h4>
        <AdminProgressBar value={30} color="warning" showLabel />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Danger (Critical)</h4>
        <AdminProgressBar value={15} color="danger" showLabel />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Info (Data Processing)</h4>
        <AdminProgressBar value={70} color="info" showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Color variants designed for healthcare contexts with semantic meanings',
      },
    },
  },
}

/**
 * Visual style variants
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Default</h4>
        <AdminProgressBar value={65} variant="default" size="lg" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Striped</h4>
        <AdminProgressBar value={65} variant="striped" size="lg" showLabel />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Animated Striped</h4>
        <AdminProgressBar value={65} variant="animated" size="lg" showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual style variants including striped and animated options',
      },
    },
  },
}

/**
 * Label positioning options
 */
export const LabelPositions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Top Label</h4>
        <AdminProgressBar value={60} showLabel labelPosition="top" />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Bottom Label</h4>
        <AdminProgressBar value={75} showLabel labelPosition="bottom" />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Outside Label (Default)</h4>
        <AdminProgressBar value={45} showLabel labelPosition="outside" />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Inside Label</h4>
        <AdminProgressBar value={80} showLabel labelPosition="inside" size="xl" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different label positioning options for various layout needs',
      },
    },
  },
}

/**
 * Custom labels for healthcare contexts
 */
export const CustomLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <AdminProgressBar 
        value={25} 
        showLabel 
        label="Processing lab results..." 
        color="info" 
      />
      <AdminProgressBar 
        value={60} 
        showLabel 
        label="Generating patient report" 
        color="primary" 
      />
      <AdminProgressBar 
        value={90} 
        showLabel 
        label="Backup completed" 
        color="success" 
      />
      <AdminProgressBar 
        value={15} 
        showLabel 
        label="Storage space remaining" 
        color="warning" 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom labels providing context for healthcare operations',
      },
    },
  },
}

/**
 * Indeterminate progress for unknown duration tasks
 */
export const Indeterminate: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Basic Indeterminate</h4>
        <AdminProgressBar indeterminate />
      </div>
      <div>
        <h4 className="font-semibold mb-2">With Label</h4>
        <AdminProgressBar 
          indeterminate 
          showLabel 
          label="Analyzing patient data..." 
          size="lg" 
        />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Different Colors</h4>
        <div className="space-y-3">
          <AdminProgressBar indeterminate color="primary" showLabel label="Processing..." />
          <AdminProgressBar indeterminate color="success" showLabel label="Syncing..." />
          <AdminProgressBar indeterminate color="info" showLabel label="Loading..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Indeterminate progress bars for tasks with unknown duration',
      },
    },
  },
}

/**
 * Buffered progress (like video loading)
 */
export const BufferedProgress: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Video/Media Loading</h4>
        <AdminProgressBar 
          value={35} 
          bufferValue={65} 
          showLabel 
          label="Loaded 35%" 
          size="lg" 
        />
      </div>
      <div>
        <h4 className="font-semibold mb-2">Data Download</h4>
        <AdminProgressBar 
          value={20} 
          bufferValue={45} 
          showLabel 
          label="Downloaded 20%" 
          color="info" 
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buffered progress showing both current progress and buffered amount',
      },
    },
  },
}

/**
 * Animated progress demonstration
 */
export const AnimatedProgress: Story = {
  render: function AnimatedProgressDemo() {
    const [progress, setProgress] = useState(0)
    
    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1
          return newProgress > 100 ? 0 : newProgress
        })
      }, 100)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Auto-updating Progress</h4>
          <AdminProgressBar value={progress} showLabel size="lg" />
        </div>
        <div>
          <h4 className="font-semibold mb-2">With Custom Label</h4>
          <AdminProgressBar 
            value={progress} 
            showLabel 
            label={`Processing: ${progress}/100 items`}
            color="success" 
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Animated progress bar demonstrating real-time updates',
      },
    },
  },
}

/**
 * Healthcare workflow progress
 */
export const HealthcareWorkflow: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Patient Data Processing</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Lab Results Analysis</span>
              <span className="text-sm text-gray-500">85%</span>
            </div>
            <AdminProgressBar value={85} color="success" size="sm" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Medical Imaging Review</span>
              <span className="text-sm text-gray-500">60%</span>
            </div>
            <AdminProgressBar value={60} color="primary" size="sm" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Report Generation</span>
              <span className="text-sm text-gray-500">25%</span>
            </div>
            <AdminProgressBar value={25} color="warning" size="sm" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Quality Assurance</span>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <AdminProgressBar value={0} color="secondary" size="sm" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Healthcare workflow with multiple progress indicators for different stages',
      },
    },
  },
}

/**
 * Progress steps component
 */
export const ProgressSteps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-semibold mb-4">Patient Intake Process</h4>
        <AdminProgressSteps 
          currentStep={2} 
          steps={['Registration', 'Insurance', 'Medical History', 'Review', 'Complete']} 
        />
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">Treatment Plan (No Labels)</h4>
        <AdminProgressSteps 
          currentStep={1} 
          steps={4} 
          color="success" 
          showLabels={false} 
          size="lg"
        />
      </div>
      
      <div>
        <h4 className="font-semibold mb-4">Diagnostic Workflow</h4>
        <AdminProgressSteps 
          currentStep={3} 
          steps={['Symptoms', 'Tests', 'Analysis', 'Diagnosis', 'Treatment']} 
          color="info"
          size="sm"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Step-by-step progress indicators for multi-stage healthcare processes',
      },
    },
  },
}

/**
 * Medical device data sync
 */
export const DeviceDataSync: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h4 className="font-semibold">Blood Pressure Monitor</h4>
        </div>
        <AdminProgressBar 
          value={100} 
          color="success" 
          showLabel 
          label="Sync complete"
          size="sm" 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h4 className="font-semibold">Glucose Meter</h4>
        </div>
        <AdminProgressBar 
          value={65} 
          color="primary" 
          showLabel 
          size="sm" 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <h4 className="font-semibold">Heart Rate Monitor</h4>
        </div>
        <AdminProgressBar 
          indeterminate 
          color="warning" 
          showLabel 
          label="Connecting..."
          size="sm" 
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <h4 className="font-semibold">Thermometer</h4>
        </div>
        <AdminProgressBar 
          value={0} 
          color="danger" 
          showLabel 
          label="Connection failed"
          size="sm" 
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Medical device synchronization status with various states',
      },
    },
  },
}

/**
 * Interactive progress bar with all controls
 */
export const Interactive: Story = {
  args: {
    value: 65,
    max: 100,
    size: 'md',
    color: 'primary',
    variant: 'default',
    showLabel: true,
    labelPosition: 'outside',
    label: '',
    indeterminate: false,
    bufferValue: undefined,
  },
}