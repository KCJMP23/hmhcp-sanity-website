/**
 * @fileoverview Storybook stories for AdminSkeleton component
 * @module components/admin/ui/loading/AdminSkeleton.stories
 * @since 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react'
import { AdminSkeleton, AdminSkeletonCard, AdminSkeletonTable, AdminSkeletonForm } from './AdminSkeleton'

const meta = {
  title: 'Admin/UI/Loading/AdminSkeleton',
  component: AdminSkeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A versatile skeleton loader component for healthcare admin interfaces.
Provides placeholder animations while content is loading with multiple variants for different content types.

**Healthcare Use Cases:**
- Patient list loading placeholders
- Medical record form loading
- Dashboard widget placeholders
- Table data loading states
- Image/document preview loading

**Animation Types:**
- **Pulse**: Gentle fade in/out animation (default)
- **Wave**: Shimmer effect across content
- **None**: Static placeholder without animation

**Accessibility Features:**
- Maintains content structure during loading
- Preserves layout dimensions
- Screen reader friendly with proper ARIA attributes
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
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'title', 'paragraph', 'avatar', 'thumbnail', 'card', 'button', 'input', 'badge'],
      description: 'Skeleton variant for different content types',
      table: {
        type: { summary: 'text | title | paragraph | avatar | thumbnail | card | button | input | badge' },
        defaultValue: { summary: 'text' },
      },
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
      description: 'Animation style',
      table: {
        type: { summary: 'pulse | wave | none' },
        defaultValue: { summary: 'pulse' },
      },
    },
    lines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of skeleton lines (for text variant)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    width: {
      control: 'text',
      description: 'Custom width (CSS value or number)',
      table: {
        type: { summary: 'string | number' },
      },
    },
    height: {
      control: 'text',
      description: 'Custom height (CSS value or number)',
      table: {
        type: { summary: 'string | number' },
      },
    },
    bordered: {
      control: 'boolean',
      description: 'Show container border',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof AdminSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default text skeleton
 */
export const Default: Story = {
  args: {},
}

/**
 * All skeleton variants displayed together
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Text Elements</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Text Line</p>
              <AdminSkeleton variant="text" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Title</p>
              <AdminSkeleton variant="title" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Paragraph</p>
              <AdminSkeleton variant="paragraph" />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Interactive Elements</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Button</p>
              <AdminSkeleton variant="button" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Input Field</p>
              <AdminSkeleton variant="input" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Badge</p>
              <AdminSkeleton variant="badge" />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Media Elements</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avatar</p>
              <AdminSkeleton variant="avatar" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Thumbnail</p>
              <AdminSkeleton variant="thumbnail" />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Layout Elements</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Card</p>
              <AdminSkeleton variant="card" width="200px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available skeleton variants for different content types',
      },
    },
  },
}

/**
 * Multiple text lines with different lengths
 */
export const TextLines: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Single Line</h4>
        <AdminSkeleton variant="text" />
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Multiple Lines (3)</h4>
        <AdminSkeleton variant="text" lines={3} />
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Paragraph Block</h4>
        <AdminSkeleton variant="text" lines={5} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Text skeletons with different line counts. Last line is automatically shorter.',
      },
    },
  },
}

/**
 * Animation variants comparison
 */
export const Animations: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="text-center">
        <h4 className="font-semibold mb-3">Pulse (Default)</h4>
        <div className="space-y-2">
          <AdminSkeleton variant="title" animation="pulse" />
          <AdminSkeleton variant="text" lines={3} animation="pulse" />
          <AdminSkeleton variant="button" animation="pulse" />
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">Wave</h4>
        <div className="space-y-2">
          <AdminSkeleton variant="title" animation="wave" />
          <AdminSkeleton variant="text" lines={3} animation="wave" />
          <AdminSkeleton variant="button" animation="wave" />
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-semibold mb-3">None</h4>
        <div className="space-y-2">
          <AdminSkeleton variant="title" animation="none" />
          <AdminSkeleton variant="text" lines={3} animation="none" />
          <AdminSkeleton variant="button" animation="none" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different animation styles: pulse, wave, and none',
      },
    },
  },
}

/**
 * Custom dimensions and borders
 */
export const CustomDimensions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Custom Widths</h4>
        <div className="space-y-2">
          <AdminSkeleton variant="text" width="25%" />
          <AdminSkeleton variant="text" width="50%" />
          <AdminSkeleton variant="text" width="75%" />
          <AdminSkeleton variant="text" width="100%" />
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Custom Heights</h4>
        <div className="flex items-end gap-4">
          <AdminSkeleton variant="card" width="100px" height="60px" />
          <AdminSkeleton variant="card" width="100px" height="80px" />
          <AdminSkeleton variant="card" width="100px" height="120px" />
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">With Borders</h4>
        <AdminSkeleton variant="text" lines={4} bordered />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom dimensions and styling options including borders',
      },
    },
  },
}

/**
 * Composite skeleton card component
 */
export const SkeletonCard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AdminSkeletonCard />
      <AdminSkeletonCard showAvatar={false} />
      <AdminSkeletonCard showActions={false} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-composed skeleton card with avatar, content, and action areas',
      },
    },
  },
}

/**
 * Skeleton table component
 */
export const SkeletonTable: Story = {
  render: () => (
    <div className="space-y-6">
      <AdminSkeletonTable />
      <AdminSkeletonTable rows={3} columns={6} />
      <AdminSkeletonTable rows={8} columns={3} showHeader={false} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-composed skeleton table with configurable rows and columns',
      },
    },
  },
}

/**
 * Skeleton form component
 */
export const SkeletonForm: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-4">With Labels</h4>
        <AdminSkeletonForm fields={5} />
      </div>
      <div>
        <h4 className="font-semibold mb-4">Without Labels</h4>
        <AdminSkeletonForm fields={5} showLabels={false} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-composed skeleton form with configurable fields and labels',
      },
    },
  },
}

/**
 * Healthcare dashboard skeleton
 */
export const HealthcareDashboard: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AdminSkeleton variant="avatar" />
          <div>
            <AdminSkeleton variant="title" width="200px" />
            <AdminSkeleton variant="text" width="150px" />
          </div>
        </div>
        <AdminSkeleton variant="button" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <AdminSkeleton variant="text" width="80px" />
            <AdminSkeleton variant="title" width="60px" />
            <AdminSkeleton variant="text" width="120px" />
          </div>
        ))}
      </div>
      
      {/* Patient List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <AdminSkeleton variant="title" width="200px" />
        </div>
        <AdminSkeletonTable rows={6} columns={5} showHeader />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete healthcare dashboard loading state with header, stats, and patient list',
      },
    },
  },
}

/**
 * Patient record skeleton
 */
export const PatientRecord: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Patient Info */}
      <div className="lg:col-span-1">
        <div className="border rounded-lg p-6">
          <div className="text-center mb-4">
            <AdminSkeleton variant="avatar" width="80px" height="80px" className="mx-auto" />
            <AdminSkeleton variant="title" width="150px" className="mt-3 mx-auto" />
            <AdminSkeleton variant="text" width="100px" className="mx-auto" />
          </div>
          <div className="space-y-3">
            <div>
              <AdminSkeleton variant="text" width="60px" height="16px" />
              <AdminSkeleton variant="text" width="120px" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="80px" height="16px" />
              <AdminSkeleton variant="text" width="140px" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="70px" height="16px" />
              <AdminSkeleton variant="text" width="100px" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Medical History */}
      <div className="lg:col-span-2">
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <AdminSkeleton variant="title" width="180px" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <AdminSkeleton variant="text" width="200px" />
                  <AdminSkeleton variant="badge" />
                </div>
                <AdminSkeleton variant="text" lines={2} />
                <div className="flex gap-2 mt-3">
                  <AdminSkeleton variant="button" width="80px" />
                  <AdminSkeleton variant="button" width="60px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Patient record loading state with personal info and medical history sections',
      },
    },
  },
}

/**
 * Medical form skeleton
 */
export const MedicalFormSkeleton: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto">
      <div className="border rounded-lg p-6">
        <AdminSkeleton variant="title" width="250px" className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <AdminSkeleton variant="text" width="120px" height="16px" />
              <AdminSkeleton variant="input" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="80px" height="16px" />
              <AdminSkeleton variant="input" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="100px" height="16px" />
              <AdminSkeleton variant="input" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <AdminSkeleton variant="text" width="90px" height="16px" />
              <AdminSkeleton variant="input" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="110px" height="16px" />
              <AdminSkeleton variant="input" />
            </div>
            <div>
              <AdminSkeleton variant="text" width="140px" height="16px" />
              <AdminSkeleton variant="paragraph" height="80px" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <AdminSkeleton variant="button" width="100px" />
          <AdminSkeleton variant="button" width="80px" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Medical form loading state with various input types and layout',
      },
    },
  },
}

/**
 * Interactive skeleton with all controls
 */
export const Interactive: Story = {
  args: {
    variant: 'text',
    animation: 'pulse',
    lines: 1,
    width: '',
    height: '',
    bordered: false,
  },
}