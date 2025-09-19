/**
 * @fileoverview Storybook stories for AdminLoadingOverlay component
 * @module components/admin/ui/loading/AdminLoadingOverlay.stories
 * @since 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState, useEffect } from 'react'
import { AdminLoadingOverlay, AdminLoadingState } from './AdminLoadingOverlay'

const meta = {
  title: 'Admin/UI/Loading/AdminLoadingOverlay',
  component: AdminLoadingOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A full-featured loading overlay for healthcare admin interfaces.
Provides visual feedback during async operations with optional progress tracking and supports minimum display time to prevent jarring quick flashes.

**Healthcare Use Cases:**
- Patient data saving/loading
- Medical report generation
- File uploads (documents, images, lab results)
- Database synchronization
- System backups and maintenance
- Multi-step form processing

**Features:**
- **Full-screen or container overlay**: Flexible positioning
- **Progress tracking**: Optional progress bar with percentage
- **Cancel functionality**: User can interrupt long operations
- **Minimum display time**: Prevents flash for quick operations
- **Customizable appearance**: Size, color, opacity, blur effects
- **Accessibility**: ARIA labels and keyboard navigation

**Loading States:**
- **Simple**: Basic spinner with text
- **Progress**: With progress bar and percentage
- **Cancellable**: With cancel button for user control
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
            id: 'focus-order-semantics',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Show/hide the overlay',
      table: {
        type: { summary: 'boolean' },
      },
    },
    text: {
      control: 'text',
      description: 'Main loading text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Loading...' },
      },
    },
    subText: {
      control: 'text',
      description: 'Additional context text',
      table: {
        type: { summary: 'string' },
      },
    },
    showProgress: {
      control: 'boolean',
      description: 'Show progress bar',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress value (0-100)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    blur: {
      control: 'boolean',
      description: 'Blur background',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    opacity: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Background opacity (0-100)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '50' },
      },
    },
    spinnerSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Spinner size',
      table: {
        type: { summary: 'xs | sm | md | lg | xl' },
        defaultValue: { summary: 'lg' },
      },
    },
    spinnerColor: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'white'],
      description: 'Spinner color',
      table: {
        type: { summary: 'primary | secondary | success | warning | danger | info | white' },
        defaultValue: { summary: 'white' },
      },
    },
    fullScreen: {
      control: 'boolean',
      description: 'Full screen mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showCancel: {
      control: 'boolean',
      description: 'Show cancel button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Provide a container for non-fullscreen overlays
      if (context.args.fullScreen === false) {
        return (
          <div className="relative h-96 w-full bg-gray-100 rounded-lg p-4">
            <div className="h-full bg-white rounded border shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Dashboard</h3>
              <p className="text-gray-600 mb-4">This is sample content behind the overlay.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded">Chart data</div>
                <div className="p-4 bg-green-50 rounded">Lab results</div>
              </div>
              <Story />
            </div>
          </div>
        )
      }
      return <Story />
    },
  ],
} satisfies Meta<typeof AdminLoadingOverlay>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic loading overlay
 */
export const Default: Story = {
  args: {
    isLoading: true,
  },
}

/**
 * With custom text and subtext
 */
export const WithCustomText: Story = {
  args: {
    isLoading: true,
    text: 'Processing patient data...',
    subText: 'This may take a few moments',
  },
}

/**
 * With progress bar
 */
export const WithProgress: Story = {
  args: {
    isLoading: true,
    text: 'Uploading medical records',
    subText: 'Please do not close this window',
    showProgress: true,
    progress: 65,
  },
}

/**
 * With cancel button
 */
export const WithCancel: Story = {
  args: {
    isLoading: true,
    text: 'Generating comprehensive report',
    subText: 'This process may take up to 5 minutes',
    showCancel: true,
    onCancel: () => console.log('Operation cancelled'),
  },
}

/**
 * Different spinner sizes and colors
 */
export const SpinnerVariations: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="relative h-48 bg-gray-100 rounded">
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          text="Small spinner"
          spinnerSize="sm"
          spinnerColor="primary"
        />
      </div>
      <div className="relative h-48 bg-gray-100 rounded">
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          text="Large spinner"
          spinnerSize="xl"
          spinnerColor="success"
        />
      </div>
      <div className="relative h-48 bg-gray-100 rounded">
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          text="Warning state"
          spinnerSize="lg"
          spinnerColor="warning"
        />
      </div>
      <div className="relative h-48 bg-gray-100 rounded">
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          text="Info processing"
          spinnerSize="lg"
          spinnerColor="info"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Different spinner sizes and colors for various contexts',
      },
    },
  },
}

/**
 * Container overlay (not full screen)
 */
export const ContainerOverlay: Story = {
  args: {
    isLoading: true,
    fullScreen: false,
    text: 'Loading chart data...',
  },
}

/**
 * Background opacity and blur variations
 */
export const BackgroundVariations: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded p-4 text-white">
        <h4 className="font-semibold mb-2">High Opacity, No Blur</h4>
        <p>Sample content behind overlay</p>
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          opacity={80}
          blur={false}
          text="High opacity"
          spinnerColor="white"
        />
      </div>
      <div className="relative h-48 bg-gradient-to-br from-green-400 to-teal-500 rounded p-4 text-white">
        <h4 className="font-semibold mb-2">Low Opacity, With Blur</h4>
        <p>Sample content behind overlay</p>
        <AdminLoadingOverlay 
          isLoading={true} 
          fullScreen={false}
          opacity={30}
          blur={true}
          text="Low opacity"
          spinnerColor="white"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Different background opacity and blur effects',
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
    const [isLoading, setIsLoading] = useState(true)
    
    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2
          if (newProgress >= 100) {
            setIsLoading(false)
            return 100
          }
          return newProgress
        })
      }, 150)
      
      return () => clearInterval(interval)
    }, [])
    
    const handleRestart = () => {
      setProgress(0)
      setIsLoading(true)
    }
    
    return (
      <div className="p-8">
        <button 
          onClick={handleRestart}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Restart Animation
        </button>
        <div className="relative h-64 bg-gray-100 rounded border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Medical Report Generation</h3>
            <p className="text-gray-600">Content being processed...</p>
          </div>
          <AdminLoadingOverlay
            isLoading={isLoading}
            fullScreen={false}
            text="Generating report..."
            subText={`Processing patient data: ${Math.round(progress)}% complete`}
            showProgress={true}
            progress={progress}
          />
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Animated progress bar showing real-time updates with restart functionality',
      },
    },
  },
}

/**
 * Healthcare workflow overlays
 */
export const HealthcareWorkflows: Story = {
  render: function HealthcareWorkflowsDemo() {
    const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
    
    const workflows = [
      {
        id: 'patient-save',
        text: 'Saving patient record',
        subText: 'Encrypting sensitive medical data',
        color: 'success' as const,
      },
      {
        id: 'lab-processing',
        text: 'Processing lab results',
        subText: 'Analyzing 24 test parameters',
        color: 'primary' as const,
        showProgress: true,
        progress: 75,
      },
      {
        id: 'backup-system',
        text: 'System backup in progress',
        subText: 'Do not power off the system',
        color: 'warning' as const,
        showCancel: false,
      },
      {
        id: 'upload-images',
        text: 'Uploading medical images',
        subText: 'Uploading to secure HIPAA-compliant storage',
        color: 'info' as const,
        showProgress: true,
        progress: 45,
        showCancel: true,
      },
    ]
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Healthcare Workflow Examples</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              onClick={() => setActiveOverlay(workflow.id)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-semibold">{workflow.text}</h4>
              <p className="text-sm text-gray-600">{workflow.subText}</p>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setActiveOverlay(null)}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Hide Overlay
        </button>
        
        <div className="relative h-64 bg-gray-100 rounded border">
          <div className="p-6">
            <h4 className="font-semibold mb-2">Patient Dashboard</h4>
            <p className="text-gray-600">Click buttons above to simulate different loading states.</p>
          </div>
          
          {workflows.map((workflow) => (
            <AdminLoadingOverlay
              key={workflow.id}
              isLoading={activeOverlay === workflow.id}
              fullScreen={false}
              text={workflow.text}
              subText={workflow.subText}
              spinnerColor={workflow.color}
              showProgress={workflow.showProgress}
              progress={workflow.progress}
              showCancel={workflow.showCancel}
              onCancel={() => setActiveOverlay(null)}
            />
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Interactive healthcare workflow examples with different loading states',
      },
    },
  },
}

/**
 * AdminLoadingState component wrapper
 */
export const LoadingStateWrapper: Story = {
  render: function LoadingStateWrapperDemo() {
    const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading')
    
    const mockData = state === 'success' ? ['Patient 1', 'Patient 2', 'Patient 3'] : []
    const mockError = state === 'error' ? new Error('Failed to fetch patient data') : null
    
    return (
      <div className="p-6">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setState('loading')}
            className={`px-3 py-2 rounded ${state === 'loading' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Loading
          </button>
          <button
            onClick={() => setState('error')}
            className={`px-3 py-2 rounded ${state === 'error' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Error
          </button>
          <button
            onClick={() => setState('empty')}
            className={`px-3 py-2 rounded ${state === 'empty' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
          >
            Empty
          </button>
          <button
            onClick={() => setState('success')}
            className={`px-3 py-2 rounded ${state === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Success
          </button>
        </div>
        
        <div className="border rounded-lg">
          <AdminLoadingState
            isLoading={state === 'loading'}
            error={mockError}
            isEmpty={state === 'empty'}
            onRetry={() => setState('loading')}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Patient List</h3>
              <ul className="space-y-2">
                {mockData.map((patient, index) => (
                  <li key={index} className="p-3 bg-gray-50 rounded">
                    {patient}
                  </li>
                ))}
              </ul>
            </div>
          </AdminLoadingState>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'AdminLoadingState component managing different states (loading, error, empty, success)',
      },
    },
  },
}

/**
 * Medical device sync overlays
 */
export const MedicalDeviceSync: Story = {
  render: function MedicalDeviceSyncDemo() {
    const [syncingDevices, setSyncingDevices] = useState<string[]>([])
    
    const devices = [
      { id: 'bp-monitor', name: 'Blood Pressure Monitor', icon: '🩺' },
      { id: 'glucose-meter', name: 'Glucose Meter', icon: '💉' },
      { id: 'heart-monitor', name: 'Heart Rate Monitor', icon: '❤️' },
      { id: 'thermometer', name: 'Digital Thermometer', icon: '🌡️' },
    ]
    
    const startSync = (deviceId: string) => {
      setSyncingDevices(prev => [...prev, deviceId])
      
      // Simulate sync completion after 3 seconds
      setTimeout(() => {
        setSyncingDevices(prev => prev.filter(id => id !== deviceId))
      }, 3000)
    }
    
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Medical Device Synchronization</h3>
        <div className="grid grid-cols-2 gap-4">
          {devices.map((device) => {
            const isSyncing = syncingDevices.includes(device.id)
            
            return (
              <div key={device.id} className="relative border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{device.icon}</span>
                  <div>
                    <h4 className="font-semibold">{device.name}</h4>
                    <p className="text-sm text-gray-600">
                      {isSyncing ? 'Syncing...' : 'Ready to sync'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => startSync(device.id)}
                  disabled={isSyncing}
                  className={`w-full py-2 rounded text-sm font-medium ${
                    isSyncing 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSyncing ? 'Syncing...' : 'Start Sync'}
                </button>
                
                <AdminLoadingOverlay
                  isLoading={isSyncing}
                  fullScreen={false}
                  text="Syncing device data..."
                  subText="Reading patient measurements"
                  spinnerSize="md"
                  opacity={60}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Medical device synchronization with individual loading overlays',
      },
    },
  },
}

/**
 * Interactive overlay with all controls
 */
export const Interactive: Story = {
  args: {
    isLoading: true,
    text: 'Loading...',
    subText: '',
    showProgress: false,
    progress: 0,
    blur: true,
    opacity: 50,
    spinnerSize: 'lg',
    spinnerColor: 'white',
    fullScreen: true,
    showCancel: false,
  },
}