'use client'

import { useState } from 'react'
import { Mountain, Edit, Trash2, GripVertical, Upload, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface HeroBlockProps {
  id: string
  content: {
    title: string
    subtitle?: string
    description?: string
    backgroundImage?: string
    backgroundVideo?: string
    ctaText?: string
    ctaLink?: string
    ctaStyle: 'primary' | 'secondary' | 'outline' | 'ghost'
  }
  styles: {
    height?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    textAlign?: 'left' | 'center' | 'right'
    overlay?: 'none' | 'light' | 'dark' | 'gradient'
    overlayOpacity?: number
    textColor?: 'white' | 'black' | 'auto'
    padding?: string
    margin?: string
  }
  isSelected: boolean
  isPreview: boolean
  onUpdate: (updates: any) => void
  onDelete: () => void
  onSelect: () => void
}

export function HeroBlock({
  id,
  content,
  styles,
  isSelected,
  isPreview,
  onUpdate,
  onDelete,
  onSelect
}: HeroBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(content.title)
  const [editSubtitle, setEditSubtitle] = useState(content.subtitle || '')
  const [editDescription, setEditDescription] = useState(content.description || '')
  const [editCtaText, setEditCtaText] = useState(content.ctaText || '')
  const [editCtaLink, setEditCtaLink] = useState(content.ctaLink || '')
  const [showMediaBrowser, setShowMediaBrowser] = useState(false)

  const handleSave = () => {
    onUpdate({
      content: {
        ...content,
        title: editTitle,
        subtitle: editSubtitle || undefined,
        description: editDescription || undefined,
        ctaText: editCtaText || undefined,
        ctaLink: editCtaLink || undefined
      }
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(content.title)
    setEditSubtitle(content.subtitle || '')
    setEditDescription(content.description || '')
    setEditCtaText(content.ctaText || '')
    setEditCtaLink(content.ctaLink || '')
    setIsEditing(false)
  }

  const getHeightClass = () => {
    switch (styles.height) {
      case 'sm': return 'h-64'
      case 'md': return 'h-80'
      case 'lg': return 'h-96'
      case 'xl': return 'h-[32rem]'
      case 'full': return 'h-screen'
      default: return 'h-80'
    }
  }

  const getTextAlignClass = () => {
    switch (styles.textAlign) {
      case 'left': return 'text-left items-start'
      case 'right': return 'text-right items-end'
      default: return 'text-center items-center'
    }
  }

  const getOverlayClass = () => {
    const opacity = styles.overlayOpacity || 50
    switch (styles.overlay) {
      case 'light': return `bg-white bg-opacity-${opacity}`
      case 'dark': return `bg-black bg-opacity-${opacity}`
      case 'gradient': return 'bg-gradient-to-r from-black/50 to-transparent'
      default: return ''
    }
  }

  const getTextColorClass = () => {
    if (styles.textColor === 'white') return 'text-white'
    if (styles.textColor === 'black') return 'text-black'
    return content.backgroundImage || content.backgroundVideo ? 'text-white' : 'text-gray-900 dark:text-white'
  }

  const getCtaButtonClass = () => {
    const baseClass = 'px-6 py-3  font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    switch (content.ctaStyle) {
      case 'primary':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
      case 'secondary':
        return `${baseClass} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`
      case 'outline':
        return `${baseClass} border-2 border-current text-current hover:bg-current hover:text-white focus:ring-blue-500`
      case 'ghost':
        return `${baseClass} text-current hover:bg-current hover:bg-opacity-10 focus:ring-blue-500`
      default:
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`
    }
  }

  if (isPreview) {
    return (
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center',
          getHeightClass()
        )}
        style={{
          padding: styles.padding,
          margin: styles.margin
        }}
      >
        {/* Background */}
        {content.backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${content.backgroundImage})` }}
          />
        )}
        
        {content.backgroundVideo && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={content.backgroundVideo} type="video/mp4" />
          </video>
        )}
        
        {/* Overlay */}
        {styles.overlay && styles.overlay !== 'none' && (
          <div className={cn('absolute inset-0', getOverlayClass())} />
        )}
        
        {/* Content */}
        <div className={cn(
          'relative z-10 max-w-4xl mx-auto px-6 flex flex-col',
          getTextAlignClass(),
          getTextColorClass()
        )}>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {content.title}
          </h1>
          
          {content.subtitle && (
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              {content.subtitle}
            </p>
          )}
          
          {content.description && (
            <p className="text-lg md:text-xl mb-8 opacity-80 max-w-2xl">
              {content.description}
            </p>
          )}
          
          {content.ctaText && (
            <div>
              {content.ctaLink ? (
                <a
                  href={content.ctaLink}
                  className={getCtaButtonClass()}
                >
                  {content.ctaText}
                </a>
              ) : (
                <button className={getCtaButtonClass()}>
                  {content.ctaText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative group border-2 border-dashed border-transparent  overflow-hidden',
        isSelected && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
      </div>

      {/* Block controls */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-1 shadow-sm z-20">
          {/* Height controls */}
          <Select
            value={styles.height || 'md'}
            onValueChange={(value: any) => onUpdate({
              styles: { ...styles, height: value }
            })}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">SM</SelectItem>
              <SelectItem value="md">MD</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Alignment controls */}
          <Button
            size="sm"
            variant={styles.textAlign === 'left' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ styles: { ...styles, textAlign: 'left' } })
            }}
          >
            <AlignLeft className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={styles.textAlign === 'center' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ styles: { ...styles, textAlign: 'center' } })
            }}
          >
            <AlignCenter className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={styles.textAlign === 'right' ? 'default' : 'ghost'}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ styles: { ...styles, textAlign: 'right' } })
            }}
          >
            <AlignRight className="w-3 h-3" />
          </Button>

          <div className="w-px h-6 bg-gray-300" />

          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setShowMediaBrowser(true)
            }}
          >
            <Upload className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Hero content */}
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center cursor-pointer',
          getHeightClass()
        )}
        onClick={(e) => {
          if (!isSelected) {
            e.stopPropagation()
            setIsEditing(true)
          }
        }}
      >
        {/* Background */}
        {content.backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${content.backgroundImage})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-600" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        
        {/* Content */}
        <div className={cn(
          'relative z-10 max-w-4xl mx-auto px-6 flex flex-col text-white',
          getTextAlignClass()
        )}>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {content.title || 'Hero Title'}
          </h1>
          
          {content.subtitle && (
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              {content.subtitle}
            </p>
          )}
          
          {content.description && (
            <p className="text-lg md:text-xl mb-8 opacity-80 max-w-2xl">
              {content.description}
            </p>
          )}
          
          {content.ctaText && (
            <div>
              <button className={getCtaButtonClass()}>
                {content.ctaText}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-30 p-6 overflow-y-auto">
          <h4 className="font-medium mb-4">Edit Hero Block</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter hero title..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subtitle (optional)</label>
              <Input
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                placeholder="Enter subtitle..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">CTA Text (optional)</label>
                <Input
                  value={editCtaText}
                  onChange={(e) => setEditCtaText(e.target.value)}
                  placeholder="Call to action..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CTA Link (optional)</label>
                <Input
                  value={editCtaLink}
                  onChange={(e) => setEditCtaLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">CTA Style</label>
              <Select
                value={content.ctaStyle}
                onValueChange={(value: any) => onUpdate({
                  content: { ...content, ctaStyle: value }
                })}
              >
                <SelectTrigger>
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
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block type indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1">
          <Mountain className="w-3 h-3" />
          Hero
        </div>
      </div>
    </div>
  )
}