'use client'

import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  Eye, 
  Edit3, 
  Smartphone, 
  Tablet, 
  Monitor,
  Save,
  Undo,
  Redo,
  Plus,
  Type,
  Heading,
  Image,
  MousePointer,
  Columns,
  Mountain,
  Minus
} from 'lucide-react'

// Import extracted components
import { BlockRenderer } from './BlockRenderer'
import { BlockPropertiesPanel } from './BlockPropertiesPanel'

interface Block {
  id: string
  type: string
  content: any
  styles: Record<string, any>
  children?: Block[]
}

interface PageBuilderProps {
  initialContent?: Block[]
  onSave?: (content: Block[]) => void
}

export function PageBuilder({ initialContent = [], onSave }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialContent)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [history, setHistory] = useState<Block[][]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const { toast } = useToast()

  const addToHistory = (newBlocks: Block[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newBlocks])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const addBlock = (type: string, afterIndex?: number) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    }

    const newBlocks = [...blocks]
    if (afterIndex !== undefined) {
      newBlocks.splice(afterIndex + 1, 0, newBlock)
    } else {
      newBlocks.push(newBlock)
    }

    setBlocks(newBlocks)
    addToHistory(newBlocks)
    setSelectedBlock(newBlock.id)
  }

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    )
    setBlocks(newBlocks)
    addToHistory(newBlocks)
  }

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id)
    setBlocks(newBlocks)
    addToHistory(newBlocks)
    if (selectedBlock === id) {
      setSelectedBlock(null)
    }
  }

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id)
    if (!blockToDuplicate) return

    const duplicatedBlock: Block = {
      ...blockToDuplicate,
      id: crypto.randomUUID()
    }

    const blockIndex = blocks.findIndex(block => block.id === id)
    const newBlocks = [...blocks]
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock)

    setBlocks(newBlocks)
    addToHistory(newBlocks)
    setSelectedBlock(duplicatedBlock.id)
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)
    setBlocks(newBlocks)
    addToHistory(newBlocks)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setBlocks(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setBlocks(history[historyIndex + 1])
    }
  }

  const handleSave = async () => {
    try {
      await onSave?.(blocks)
      toast({
        title: 'Success',
        description: 'Page saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save page',
        variant: 'destructive'
      })
    }
  }

  const getDeviceWidth = () => {
    switch (devicePreview) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      default: return '100%'
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode ? "outline" : "default"}
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <Edit3 className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>

              {previewMode && (
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant={devicePreview === 'mobile' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDevicePreview('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={devicePreview === 'tablet' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDevicePreview('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={devicePreview === 'desktop' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDevicePreview('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex === 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Block Library Sidebar */}
          {!previewMode && (
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold mb-4">Add Blocks</h3>
              <div className="space-y-2">
                {BLOCK_TYPES.map(blockType => (
                  <Button
                    key={blockType.type}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock(blockType.type)}
                  >
                    <span className="mr-2">{blockType.icon}</span>
                    {blockType.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Main Canvas */}
          <div className="flex-1 p-4">
            <div 
              className="mx-auto bg-white dark:bg-gray-800 min-h-[600px] shadow-lg"
              style={{ width: getDeviceWidth() }}
            >
              {blocks.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add your first block to get started</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {blocks.map((block, index) => (
                    <BlockRenderer
                      key={block.id}
                      block={block}
                      isSelected={selectedBlock === block.id}
                      isPreview={previewMode}
                      onSelect={() => setSelectedBlock(block.id)}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onMove={(fromIndex, toIndex) => moveBlock(fromIndex, toIndex)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {!previewMode && selectedBlock && (
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
              <BlockPropertiesPanel
                block={blocks.find(b => b.id === selectedBlock)!}
                onUpdate={(updates) => updateBlock(selectedBlock, updates)}
              />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

// Block type definitions
const BLOCK_TYPES = [
  { type: 'text', name: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'heading', name: 'Heading', icon: <Heading className="w-4 h-4" /> },
  { type: 'image', name: 'Image', icon: <Image className="w-4 h-4" /> },
  { type: 'button', name: 'Button', icon: <MousePointer className="w-4 h-4" /> },
  { type: 'columns', name: 'Columns', icon: <Columns className="w-4 h-4" /> },
  { type: 'hero', name: 'Hero Section', icon: <Mountain className="w-4 h-4" /> },
  { type: 'spacer', name: 'Spacer', icon: <Minus className="w-4 h-4" /> }
]


// Default content generators
function getDefaultContent(type: string) {
  switch (type) {
    case 'text':
      return { text: 'Enter your text here...', format: 'paragraph' }
    case 'heading':
      return { text: 'Your heading', level: 2 }
    case 'image':
      return { src: '', alt: '', caption: '' }
    case 'button':
      return { text: 'Click me', link: '', style: 'primary', size: 'default', openInNewTab: false }
    case 'columns':
      return {
        columns: [
          { id: `col-${Date.now()}-1`, blocks: [], width: 50 },
          { id: `col-${Date.now()}-2`, blocks: [], width: 50 }
        ],
        gap: 'md'
      }
    case 'hero':
      return {
        title: 'Hero Title',
        subtitle: 'Hero subtitle',
        description: '',
        backgroundImage: '',
        backgroundVideo: '',
        ctaText: '',
        ctaLink: '',
        ctaStyle: 'primary'
      }
    case 'spacer':
      return { height: 'md', showDivider: false, dividerStyle: 'solid', dividerColor: '#e5e7eb' }
    default:
      return {}
  }
}

function getDefaultStyles(type: string) {
  switch (type) {
    case 'text':
      return { textAlign: 'left', padding: '8px', margin: '0px' }
    case 'heading':
      return { textAlign: 'left', padding: '8px', margin: '0px' }
    case 'image':
      return { alignment: 'center', padding: '8px', margin: '0px' }
    case 'button':
      return { alignment: 'center', padding: '8px', margin: '0px' }
    case 'columns':
      return { padding: '16px', margin: '0px' }
    case 'hero':
      return { height: 'md', textAlign: 'center', overlay: 'dark', overlayOpacity: 50, textColor: 'auto' }
    case 'spacer':
      return { margin: '0px' }
    default:
      return { padding: '8px', margin: '0px' }
  }
}

