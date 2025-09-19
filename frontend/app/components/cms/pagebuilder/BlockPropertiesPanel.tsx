'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Type,
  Heading,
  Image,
  MousePointer,
  Columns,
  Mountain,
  Minus,
  Plus
} from 'lucide-react'

interface BlockPropertiesPanelProps {
  block: any
  onUpdate: (updates: any) => void
}

export function BlockPropertiesPanel({ block, onUpdate }: BlockPropertiesPanelProps) {
  const handleStyleUpdate = (styleKey: string, value: any) => {
    onUpdate({
      styles: {
        ...block.styles,
        [styleKey]: value
      }
    })
  }
  
  const handleContentUpdate = (contentKey: string, value: any) => {
    onUpdate({
      content: {
        ...block.content,
        [contentKey]: value
      }
    })
  }

  const getBlockIcon = (type: string) => {
    const icons = {
      text: <Type className="w-4 h-4" />,
      heading: <Heading className="w-4 h-4" />,
      image: <Image className="w-4 h-4" />,
      button: <MousePointer className="w-4 h-4" />,
      columns: <Columns className="w-4 h-4" />,
      hero: <Mountain className="w-4 h-4" />,
      spacer: <Minus className="w-4 h-4" />,
    }
    return icons[type as keyof typeof icons] || <Plus className="w-4 h-4" />
  }

  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        {getBlockIcon(block.type)}
        {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Properties
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label>Padding</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input
              type="number"
              placeholder="Top/Bottom"
              value={block.styles?.paddingY || 16}
              onChange={(e) => handleStyleUpdate('paddingY', parseInt(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Left/Right"
              value={block.styles?.paddingX || 16}
              onChange={(e) => handleStyleUpdate('paddingX', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div>
          <Label>Background Color</Label>
          <Input
            type="color"
            value={block.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
            className="mt-1 h-10"
          />
        </div>

        <div>
          <Label>Text Alignment</Label>
          <Select
            value={block.styles?.textAlign || 'left'}
            onValueChange={(value) => handleStyleUpdate('textAlign', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {block.type === 'text' && (
          <>
            <div>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={block.styles?.fontSize || 16}
                onChange={(e) => handleStyleUpdate('fontSize', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Text Color</Label>
              <Input
                type="color"
                value={block.styles?.color || '#000000'}
                onChange={(e) => handleStyleUpdate('color', e.target.value)}
                className="mt-1 h-10"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Block-specific properties */}
      {renderBlockSpecificProperties(block, handleContentUpdate, handleStyleUpdate)}
    </div>
  )
}

// Helper function to render block-specific properties
function renderBlockSpecificProperties(block: any, handleContentUpdate: any, handleStyleUpdate: any) {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Text Properties</h4>
          <div>
            <Label htmlFor="format" className="text-sm">Format</Label>
            <Select
              value={block.content.format || 'paragraph'}
              onValueChange={(value) => handleContentUpdate('format', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
      
    case 'heading':
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Heading Properties</h4>
          <div>
            <Label htmlFor="level" className="text-sm">Heading Level</Label>
            <Select
              value={block.content.level?.toString() || '2'}
              onValueChange={(value) => handleContentUpdate('level', parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
      
    case 'button':
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Button Properties</h4>
          <div>
            <Label htmlFor="buttonStyle" className="text-sm">Style</Label>
            <Select
              value={block.content.style || 'primary'}
              onValueChange={(value) => handleContentUpdate('style', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="buttonSize" className="text-sm">Size</Label>
            <Select
              value={block.content.size || 'default'}
              onValueChange={(value) => handleContentUpdate('size', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
      
    case 'hero':
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Hero Properties</h4>
          <div>
            <Label htmlFor="heroHeight" className="text-sm">Height</Label>
            <Select
              value={block.styles.height || 'md'}
              onValueChange={(value) => handleStyleUpdate('height', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="full">Full Screen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="overlay" className="text-sm">Overlay</Label>
            <Select
              value={block.styles.overlay || 'dark'}
              onValueChange={(value) => handleStyleUpdate('overlay', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
      
    case 'spacer':
      return (
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Spacer Properties</h4>
          <div>
            <Label htmlFor="spacerHeight" className="text-sm">Height</Label>
            <Select
              value={block.content.height || 'md'}
              onValueChange={(value) => handleContentUpdate('height', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xs">Extra Small</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
      
    default:
      return null
  }
}