/**
 * @fileoverview Storybook stories for AdminKanbanBoard component
 * @module components/admin/ui/drag-drop/AdminKanbanBoard.stories
 * @since 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState, useCallback } from 'react'
import { AdminKanbanBoard, KanbanColumn, KanbanItem } from './AdminKanbanBoard'

const meta = {
  title: 'Admin/UI/Drag Drop/AdminKanbanBoard',
  component: AdminKanbanBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A comprehensive Kanban board component designed for healthcare admin workflows.
Provides drag-and-drop functionality for task and workflow visualization with healthcare-specific features.

**Healthcare Use Cases:**
- Patient workflow management (intake, treatment, discharge)
- Treatment plan tracking across stages
- Medical equipment maintenance schedules
- Lab result processing workflows
- Staff task assignment and tracking
- Quality assurance processes
- Clinical trial patient progression
- Medication administration tracking

**Key Features:**
- **Drag & Drop**: Smooth item movement between columns
- **WIP Limits**: Work-in-progress limits with visual indicators
- **Locked Columns**: Prevent modifications to specific columns
- **Custom Rendering**: Flexible item and header customization
- **Priority Indicators**: Visual priority levels (low, medium, high, urgent)
- **Assignee Management**: User assignment with avatar support
- **Due Dates**: Timeline tracking for time-sensitive tasks
- **Tags & Metadata**: Flexible categorization and data storage

**Accessibility Features:**
- Full keyboard navigation support
- Screen reader compatible with ARIA attributes
- High contrast visual indicators
- Focus management during drag operations
- Semantic HTML structure
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
            id: 'aria-valid-attr-value',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description: 'Array of Kanban columns with their items',
      table: {
        type: { summary: 'KanbanColumn[]' },
      },
    },
    onItemMove: {
      description: 'Callback when items are moved between columns',
      table: {
        type: { summary: '(itemId: string, fromColumn: string, toColumn: string, newIndex: number) => void' },
      },
    },
    onColumnReorder: {
      description: 'Callback when columns are reordered',
      table: {
        type: { summary: '(columns: KanbanColumn[]) => void' },
      },
    },
    allowColumnReorder: {
      control: 'boolean',
      description: 'Allow column reordering via drag and drop',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showItemCount: {
      control: 'boolean',
      description: 'Show item count badge in column header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showWipLimits: {
      control: 'boolean',
      description: 'Show WIP limits in column header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    height: {
      control: { type: 'text' },
      description: 'Board height (CSS value or number in pixels)',
      table: {
        type: { summary: 'string | number' },
        defaultValue: { summary: '600px' },
      },
    },
    onItemClick: {
      description: 'Handler for item click events',
      table: {
        type: { summary: '(item: KanbanItem) => void' },
      },
    },
    onAddItem: {
      description: 'Handler for adding new items to columns',
      table: {
        type: { summary: '(columnId: string) => void' },
      },
    },
  },
} satisfies Meta<typeof AdminKanbanBoard>

export default meta
type Story = StoryObj<typeof meta>

// Sample healthcare data
const samplePatients: KanbanItem[] = [
  {
    id: 'patient-1',
    title: 'Sarah Johnson - Annual Checkup',
    description: 'Routine annual physical examination and bloodwork',
    priority: 'medium',
    assignee: {
      id: 'dr-smith',
      name: 'Dr. Smith',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=32&h=32&fit=crop&crop=face'
    },
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ['routine', 'bloodwork'],
    metadata: { patientId: 'P001', mrn: '12345' }
  },
  {
    id: 'patient-2',
    title: 'Michael Chen - Diabetes Follow-up',
    description: 'Quarterly diabetes management consultation and A1C check',
    priority: 'high',
    assignee: {
      id: 'dr-williams',
      name: 'Dr. Williams'
    },
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    tags: ['diabetes', 'chronic-care'],
    metadata: { patientId: 'P002', mrn: '23456' }
  },
  {
    id: 'patient-3',
    title: 'Emma Davis - Pediatric Vaccine',
    description: 'MMR vaccination for 12-month-old patient',
    priority: 'urgent',
    assignee: {
      id: 'nurse-jones',
      name: 'Nurse Jones',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=32&h=32&fit=crop&crop=face'
    },
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    tags: ['pediatric', 'vaccination'],
    metadata: { patientId: 'P003', mrn: '34567', age: '12 months' }
  }
]

const defaultColumns: KanbanColumn[] = [
  {
    id: 'scheduled',
    title: 'Scheduled',
    items: [samplePatients[0]],
    color: '#3B82F6'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    items: [samplePatients[1]],
    color: '#F59E0B',
    limit: 3
  },
  {
    id: 'review',
    title: 'Review',
    items: [],
    color: '#8B5CF6',
    limit: 2
  },
  {
    id: 'completed',
    title: 'Completed',
    items: [samplePatients[2]],
    color: '#10B981'
  }
]

/**
 * Default Kanban board for patient workflow management
 */
export const Default: Story = {
  render: () => {
    const [columns, setColumns] = useState(defaultColumns)

    const handleItemMove = useCallback((itemId: string, fromColumn: string, toColumn: string, newIndex: number) => {
      console.log(`Moved item ${itemId} from ${fromColumn} to ${toColumn} at index ${newIndex}`)
      
      setColumns(prevColumns => {
        const newColumns = [...prevColumns]
        const sourceColumn = newColumns.find(col => col.id === fromColumn)
        const targetColumn = newColumns.find(col => col.id === toColumn)
        
        if (sourceColumn && targetColumn) {
          const itemIndex = sourceColumn.items.findIndex(item => item.id === itemId)
          if (itemIndex !== -1) {
            const [movedItem] = sourceColumn.items.splice(itemIndex, 1)
            targetColumn.items.splice(newIndex, 0, movedItem)
          }
        }
        
        return newColumns
      })
    }, [])

    const handleItemClick = useCallback((item: KanbanItem) => {
      console.log('Clicked item:', item.title)
    }, [])

    const handleAddItem = useCallback((columnId: string) => {
      console.log('Add item to column:', columnId)
    }, [])

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Workflow Management</h2>
          <p className="text-gray-600">Track patients through their appointment journey</p>
        </div>
        <AdminKanbanBoard
          columns={columns}
          onItemMove={handleItemMove}
          onItemClick={handleItemClick}
          onAddItem={handleAddItem}
          height="600px"
        />
      </div>
    )
  }
}

/**
 * Treatment protocol workflow with WIP limits
 */
export const TreatmentProtocol: Story = {
  render: () => {
    const treatmentColumns: KanbanColumn[] = [
      {
        id: 'assessment',
        title: 'Initial Assessment',
        items: [
          {
            id: 'treat-1',
            title: 'John Doe - Hypertension Evaluation',
            description: 'New patient presenting with elevated BP readings',
            priority: 'high',
            assignee: { id: 'dr-adams', name: 'Dr. Adams' },
            tags: ['cardiology', 'new-patient']
          }
        ],
        limit: 5
      },
      {
        id: 'diagnostics',
        title: 'Diagnostic Tests',
        items: [
          {
            id: 'treat-2',
            title: 'Lisa Brown - MRI Brain',
            description: 'Follow-up MRI for migraine investigation',
            priority: 'medium',
            assignee: { id: 'tech-wilson', name: 'Tech Wilson' },
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            tags: ['imaging', 'neurology']
          },
          {
            id: 'treat-3',
            title: 'Robert Garcia - Stress Test',
            description: 'Cardiac stress test for chest pain evaluation',
            priority: 'high',
            assignee: { id: 'dr-lee', name: 'Dr. Lee' },
            tags: ['cardiology', 'stress-test']
          }
        ],
        limit: 3,
        color: '#F59E0B'
      },
      {
        id: 'treatment',
        title: 'Active Treatment',
        items: [
          {
            id: 'treat-4',
            title: 'Mary Wilson - Physical Therapy',
            description: 'Post-surgical knee rehabilitation program',
            priority: 'medium',
            assignee: { id: 'pt-johnson', name: 'PT Johnson' },
            tags: ['rehabilitation', 'orthopedic']
          }
        ],
        limit: 4,
        color: '#8B5CF6'
      },
      {
        id: 'monitoring',
        title: 'Monitoring',
        items: [],
        limit: 2,
        color: '#06B6D4'
      },
      {
        id: 'discharge',
        title: 'Discharge Planning',
        items: [
          {
            id: 'treat-5',
            title: 'James Taylor - Home Care Setup',
            description: 'Coordinating home healthcare services post-discharge',
            priority: 'medium',
            assignee: { id: 'coordinator-davis', name: 'Care Coordinator Davis' },
            tags: ['discharge-planning', 'home-care']
          }
        ]
      }
    ]

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Treatment Protocol Workflow</h2>
          <p className="text-gray-600">Manage patient treatment progression with WIP limits</p>
        </div>
        <AdminKanbanBoard
          columns={treatmentColumns}
          showWipLimits={true}
          height="700px"
        />
      </div>
    )
  }
}

/**
 * Lab processing workflow with locked columns
 */
export const LabProcessing: Story = {
  render: () => {
    const labColumns: KanbanColumn[] = [
      {
        id: 'received',
        title: 'Samples Received',
        items: [
          {
            id: 'lab-1',
            title: 'CBC - Patient #1247',
            description: 'Complete blood count for routine screening',
            priority: 'low',
            tags: ['hematology', 'routine']
          },
          {
            id: 'lab-2',
            title: 'Lipid Panel - Patient #1248',
            description: 'Cholesterol and triglycerides assessment',
            priority: 'medium',
            tags: ['chemistry', 'lipids']
          }
        ],
        locked: true, // Historical data - cannot be modified
        color: '#6B7280'
      },
      {
        id: 'processing',
        title: 'In Processing',
        items: [
          {
            id: 'lab-3',
            title: 'Culture - Patient #1249',
            description: 'Blood culture for sepsis investigation',
            priority: 'urgent',
            assignee: { id: 'tech-brown', name: 'Lab Tech Brown' },
            tags: ['microbiology', 'urgent']
          }
        ],
        limit: 5
      },
      {
        id: 'review',
        title: 'Pathologist Review',
        items: [
          {
            id: 'lab-4',
            title: 'Biopsy - Patient #1250',
            description: 'Tissue biopsy requiring pathologist interpretation',
            priority: 'high',
            assignee: { id: 'dr-pathologist', name: 'Dr. Pathologist' },
            tags: ['pathology', 'biopsy']
          }
        ],
        limit: 3
      },
      {
        id: 'results-ready',
        title: 'Results Ready',
        items: [],
        color: '#10B981'
      }
    ]

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Laboratory Processing Workflow</h2>
          <p className="text-gray-600">Track lab samples through processing stages</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              🔒 Locked columns contain historical data and cannot be modified
            </span>
          </div>
        </div>
        <AdminKanbanBoard
          columns={labColumns}
          showWipLimits={true}
          height="600px"
        />
      </div>
    )
  }
}

/**
 * Custom item rendering example
 */
export const CustomRendering: Story = {
  render: () => {
    const customColumns: KanbanColumn[] = [
      {
        id: 'emergency',
        title: 'Emergency Department',
        items: [
          {
            id: 'ed-1',
            title: 'Chest Pain - Bed 3',
            description: 'Male, 55, presenting with chest pain and shortness of breath',
            priority: 'urgent',
            assignee: { id: 'dr-emergency', name: 'Dr. Emergency' },
            dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            tags: ['cardiology', 'stat'],
            metadata: { bed: '3', triage: 'ESI-2', vitals: { bp: '150/95', hr: '110', temp: '98.6' } }
          }
        ],
        color: '#DC2626'
      },
      {
        id: 'imaging',
        title: 'Medical Imaging',
        items: [
          {
            id: 'img-1',
            title: 'CT Scan - Room 2',
            description: 'Emergency CT scan for trauma patient',
            priority: 'urgent',
            assignee: { id: 'tech-imaging', name: 'Imaging Tech' },
            tags: ['trauma', 'ct-scan'],
            metadata: { room: '2', equipment: 'CT-1', estimatedTime: '15 mins' }
          }
        ]
      },
      {
        id: 'surgery',
        title: 'Surgical Suite',
        items: [],
        limit: 2,
        color: '#7C3AED'
      }
    ]

    const renderCustomItem = (item: KanbanItem) => (
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-gray-900 leading-tight">{item.title}</h4>
          {item.priority === 'urgent' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              🚨 STAT
            </span>
          )}
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}
        
        {item.metadata?.vitals && (
          <div className="bg-blue-50 rounded p-2">
            <div className="text-xs font-medium text-blue-700 mb-1">Vital Signs</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>BP: {item.metadata.vitals.bp}</div>
              <div>HR: {item.metadata.vitals.hr}</div>
              <div>T: {item.metadata.vitals.temp}°F</div>
            </div>
          </div>
        )}
        
        {item.metadata?.room && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              🏥 {item.metadata.room}
            </span>
            {item.metadata.estimatedTime && (
              <span>⏱️ {item.metadata.estimatedTime}</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {item.assignee && (
              <div className="flex items-center gap-1">
                <div className="h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                  {item.assignee.name.charAt(0)}
                </div>
                <span className="text-xs text-gray-600">{item.assignee.name}</span>
              </div>
            )}
          </div>
          
          {item.tags && (
            <div className="flex gap-1">
              {item.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )

    const renderCustomHeader = (column: KanbanColumn) => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-bold text-gray-900">{column.title}</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            {column.items.length}
            {column.limit && ` / ${column.limit}`}
          </span>
        </div>
        
        {column.id === 'emergency' && (
          <div className="text-red-500 text-sm font-medium animate-pulse">
            🚨 HIGH PRIORITY
          </div>
        )}
      </div>
    )

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Department Workflow</h2>
          <p className="text-gray-600">Custom rendered cards with vital signs and real-time status</p>
        </div>
        <AdminKanbanBoard
          columns={customColumns}
          renderItem={renderCustomItem}
          renderColumnHeader={renderCustomHeader}
          showWipLimits={true}
          height="650px"
        />
      </div>
    )
  }
}

/**
 * Equipment maintenance workflow
 */
export const EquipmentMaintenance: Story = {
  render: () => {
    const equipmentColumns: KanbanColumn[] = [
      {
        id: 'scheduled',
        title: 'Scheduled Maintenance',
        items: [
          {
            id: 'eq-1',
            title: 'MRI Machine - Quarterly Service',
            description: 'Routine quarterly maintenance and calibration',
            priority: 'medium',
            assignee: { id: 'tech-mri', name: 'MRI Technician' },
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            tags: ['imaging', 'routine', 'mri'],
            metadata: { equipmentId: 'MRI-001', location: 'Radiology Wing B' }
          },
          {
            id: 'eq-2',
            title: 'Ventilator #5 - Filter Replacement',
            description: 'Monthly filter replacement and performance check',
            priority: 'high',
            assignee: { id: 'biomed-smith', name: 'Biomed Smith' },
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            tags: ['respiratory', 'critical', 'icu'],
            metadata: { equipmentId: 'VENT-005', location: 'ICU Room 15' }
          }
        ]
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        items: [
          {
            id: 'eq-3',
            title: 'CT Scanner - Software Update',
            description: 'Installing latest software version and security patches',
            priority: 'medium',
            assignee: { id: 'it-jones', name: 'IT Specialist Jones' },
            tags: ['imaging', 'software', 'ct'],
            metadata: { equipmentId: 'CT-002', estimatedCompletion: '2 hours' }
          }
        ],
        limit: 3
      },
      {
        id: 'parts-needed',
        title: 'Awaiting Parts',
        items: [
          {
            id: 'eq-4',
            title: 'Ultrasound #3 - Probe Repair',
            description: 'Waiting for replacement ultrasound probe delivery',
            priority: 'low',
            assignee: { id: 'vendor-ge', name: 'GE Healthcare' },
            tags: ['ultrasound', 'parts', 'vendor'],
            metadata: { equipmentId: 'US-003', orderNumber: 'PO-2024-0156' }
          }
        ]
      },
      {
        id: 'completed',
        title: 'Completed',
        items: [
          {
            id: 'eq-5',
            title: 'Defibrillator #12 - Battery Check',
            description: 'Monthly battery test and electrode inspection completed',
            priority: 'medium',
            assignee: { id: 'tech-emergency', name: 'Emergency Tech' },
            tags: ['emergency', 'defibrillator', 'battery'],
            metadata: { equipmentId: 'DEFIB-012', completedDate: new Date() }
          }
        ],
        color: '#10B981'
      }
    ]

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Equipment Maintenance</h2>
          <p className="text-gray-600">Track equipment maintenance and repair workflows</p>
        </div>
        <AdminKanbanBoard
          columns={equipmentColumns}
          showWipLimits={true}
          height="600px"
        />
      </div>
    )
  }
}

/**
 * All priority levels demonstration
 */
export const PriorityIndicators: Story = {
  render: () => {
    const priorityColumns: KanbanColumn[] = [
      {
        id: 'tasks',
        title: 'Healthcare Tasks',
        items: [
          {
            id: 'priority-1',
            title: 'Critical Patient Alert',
            description: 'Patient vitals showing concerning trends',
            priority: 'urgent',
            assignee: { id: 'nurse-urgent', name: 'Charge Nurse' },
            tags: ['critical', 'vitals']
          },
          {
            id: 'priority-2',
            title: 'Medication Review',
            description: 'High-risk medication interaction check required',
            priority: 'high',
            assignee: { id: 'pharmacist', name: 'Clinical Pharmacist' },
            tags: ['pharmacy', 'interaction']
          },
          {
            id: 'priority-3',
            title: 'Discharge Planning',
            description: 'Coordinate discharge for tomorrow morning',
            priority: 'medium',
            assignee: { id: 'case-manager', name: 'Case Manager' },
            tags: ['discharge', 'planning']
          },
          {
            id: 'priority-4',
            title: 'Documentation Review',
            description: 'Review and complete patient documentation',
            priority: 'low',
            assignee: { id: 'admin', name: 'Medical Admin' },
            tags: ['documentation', 'admin']
          }
        ]
      }
    ]

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Priority Level Indicators</h2>
          <p className="text-gray-600">Visual priority system with color-coded left borders</p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-l-4 border-l-red-400"></div>
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-l-4 border-l-yellow-400"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-l-4 border-l-blue-400"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 border-l-4 border-l-gray-400"></div>
              <span>Low</span>
            </div>
          </div>
        </div>
        <AdminKanbanBoard
          columns={priorityColumns}
          height="500px"
        />
      </div>
    )
  }
}

/**
 * Interactive Kanban board with all controls
 */
export const Interactive: Story = {
  render: () => {
    const [columns, setColumns] = useState(defaultColumns)

    const handleItemMove = useCallback((itemId: string, fromColumn: string, toColumn: string, newIndex: number) => {
      setColumns(prevColumns => {
        const newColumns = [...prevColumns]
        const sourceColumn = newColumns.find(col => col.id === fromColumn)
        const targetColumn = newColumns.find(col => col.id === toColumn)
        
        if (sourceColumn && targetColumn) {
          const itemIndex = sourceColumn.items.findIndex(item => item.id === itemId)
          if (itemIndex !== -1) {
            const [movedItem] = sourceColumn.items.splice(itemIndex, 1)
            targetColumn.items.splice(newIndex, 0, movedItem)
          }
        }
        
        return newColumns
      })
    }, [])

    const handleItemClick = useCallback((item: KanbanItem) => {
      alert(`Clicked: ${item.title}`)
    }, [])

    const handleAddItem = useCallback((columnId: string) => {
      const newItem: KanbanItem = {
        id: `item-${Date.now()}`,
        title: `New Item ${Date.now()}`,
        description: `Created at ${new Date().toLocaleTimeString()}`,
        priority: 'medium'
      }

      setColumns(prev => prev.map(col => 
        col.id === columnId 
          ? { ...col, items: [...col.items, newItem] }
          : col
      ))
    }, [])

    return (
      <AdminKanbanBoard
        columns={columns}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
        onAddItem={handleAddItem}
        showWipLimits={true}
        height="600px"
      />
    )
  },
  args: {
    showItemCount: true,
    showWipLimits: false,
    allowColumnReorder: false,
    height: '600px',
  },
}