'use client'

import { useState } from 'react'
import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
  DOMConversionMap,
} from 'lexical'
import { Grid, List, Columns, Plus, Trash2, Edit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger';

export interface GalleryImage {
  id: string
  src: string
  alt: string
  caption?: string
  width: number
  height: number
}

export interface GalleryPayload {
  images: GalleryImage[]
  layout?: 'grid' | 'carousel' | 'masonry'
  columns?: number
  spacing?: 'tight' | 'normal' | 'loose'
  showCaptions?: boolean
  key?: NodeKey
}

export interface SerializedGalleryNode extends Spread<GalleryPayload, SerializedLexicalNode> {
  type: 'gallery'
}

export class GalleryNode extends DecoratorNode<React.ReactElement> {
  __images: GalleryImage[]
  __layout: 'grid' | 'carousel' | 'masonry'
  __columns: number
  __spacing: 'tight' | 'normal' | 'loose'
  __showCaptions: boolean

  static getType(): string {
    return 'gallery'
  }

  static clone(node: GalleryNode): GalleryNode {
    return new GalleryNode(
      node.__images,
      node.__layout,
      node.__columns,
      node.__spacing,
      node.__showCaptions,
      node.__key
    )
  }

  static importDOM(): DOMConversionMap | null {
    return null // Gallery nodes don't have a direct DOM equivalent
  }

  constructor(
    images: GalleryImage[],
    layout: 'grid' | 'carousel' | 'masonry' = 'grid',
    columns: number = 3,
    spacing: 'tight' | 'normal' | 'loose' = 'normal',
    showCaptions: boolean = true,
    key?: NodeKey
  ) {
    super(key)
    this.__images = images
    this.__layout = layout
    this.__columns = columns
    this.__spacing = spacing
    this.__showCaptions = showCaptions
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'gallery-node'
    return div
  }

  updateDOM(): false {
    return false
  }

  // Getters
  getImages(): GalleryImage[] { return this.__images }
  getLayout(): 'grid' | 'carousel' | 'masonry' { return this.__layout }
  getColumns(): number { return this.__columns }
  getSpacing(): 'tight' | 'normal' | 'loose' { return this.__spacing }
  getShowCaptions(): boolean { return this.__showCaptions }

  // Setters
  setImages(images: GalleryImage[]): void {
    const writable = this.getWritable()
    writable.__images = images
  }

  setLayout(layout: 'grid' | 'carousel' | 'masonry'): void {
    const writable = this.getWritable()
    writable.__layout = layout
  }

  setColumns(columns: number): void {
    const writable = this.getWritable()
    writable.__columns = columns
  }

  setSpacing(spacing: 'tight' | 'normal' | 'loose'): void {
    const writable = this.getWritable()
    writable.__spacing = spacing
  }

  setShowCaptions(showCaptions: boolean): void {
    const writable = this.getWritable()
    writable.__showCaptions = showCaptions
  }

  addImage(image: GalleryImage): void {
    const writable = this.getWritable()
    writable.__images = [...this.__images, image]
  }

  removeImage(imageId: string): void {
    const writable = this.getWritable()
    writable.__images = this.__images.filter(img => img.id !== imageId)
  }

  updateImage(imageId: string, updates: Partial<GalleryImage>): void {
    const writable = this.getWritable()
    writable.__images = this.__images.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    )
  }

  decorate(): React.ReactElement {
    return (
      <GalleryComponent
        images={this.__images}
        layout={this.__layout}
        columns={this.__columns}
        spacing={this.__spacing}
        showCaptions={this.__showCaptions}
        nodeKey={this.getKey()}
        node={this}
      />
    )
  }

  static importJSON(serializedNode: SerializedGalleryNode): GalleryNode {
    const { images, layout, columns, spacing, showCaptions } = serializedNode
    return $createGalleryNode({
      images, layout, columns, spacing, showCaptions
    })
  }

  exportJSON(): SerializedGalleryNode {
    return {
      images: this.getImages(),
      layout: this.getLayout(),
      columns: this.getColumns(),
      spacing: this.getSpacing(),
      showCaptions: this.getShowCaptions(),
      type: 'gallery',
      version: 1,
    }
  }
}

interface GalleryComponentProps {
  images: GalleryImage[]
  layout: 'grid' | 'carousel' | 'masonry'
  columns: number
  spacing: 'tight' | 'normal' | 'loose'
  showCaptions: boolean
  nodeKey: NodeKey
  node: GalleryNode
}

function GalleryComponent({
  images,
  layout,
  columns,
  spacing,
  showCaptions,
  nodeKey,
  node,
}: GalleryComponentProps) {
  const [isSelected, setIsSelected] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [tempCaption, setTempCaption] = useState('')

  const getSpacingClass = () => {
    switch (spacing) {
      case 'tight': return 'gap-1'
      case 'loose': return 'gap-6'
      default: return 'gap-4'
    }
  }

  const getGridClass = () => {
    const baseClass = `grid ${getSpacingClass()}`
    switch (columns) {
      case 1: return `${baseClass} grid-cols-1`
      case 2: return `${baseClass} grid-cols-1 md:grid-cols-2`
      case 3: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
      case 4: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
      default: return `${baseClass} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
    }
  }

  const openLightbox = (image: GalleryImage) => {
    setLightboxImage(image)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const removeImage = (imageId: string) => {
    if (confirm('Remove this image from the gallery?')) {
      node.removeImage(imageId)
    }
  }

  const startEditCaption = (imageId: string, currentCaption: string) => {
    setEditingCaption(imageId)
    setTempCaption(currentCaption || '')
  }

  const saveCaption = (imageId: string) => {
    node.updateImage(imageId, { caption: tempCaption })
    setEditingCaption(null)
    setTempCaption('')
  }

  const cancelEditCaption = () => {
    setEditingCaption(null)
    setTempCaption('')
  }

  const addMoreImages = () => {
    // This would open the media browser to add more images
    logger.info('Open media browser for gallery', { action: 'info_logged' })
  }

  if (images.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 p-8 text-center my-4">
        <Grid className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Empty Gallery
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add images to create a gallery
        </p>
        <Button onClick={addMoreImages}>
          <Plus className="w-4 h-4 mr-2" />
          Add Images
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative my-6 group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 '
      )}
      onClick={() => setIsSelected(!isSelected)}
      tabIndex={0}
    >
      {/* Gallery controls */}
      {isSelected && (
        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 shadow-lg z-10">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setShowSettings(!showSettings)
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                addMoreImages()
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Images
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Delete this gallery?')) {
                node.remove()
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Gallery Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Layout</label>
              <Select
                value={layout}
                onValueChange={(value: 'grid' | 'carousel' | 'masonry') =>
                  node.setLayout(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Columns</label>
              <Select
                value={columns.toString()}
                onValueChange={(value) => node.setColumns(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Spacing</label>
              <Select
                value={spacing}
                onValueChange={(value: 'tight' | 'normal' | 'loose') =>
                  node.setSpacing(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="loose">Loose</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCaptions}
                  onChange={(e) => node.setShowCaptions(e.target.checked)}
                />
                <span className="text-sm font-medium">Show Captions</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Gallery content */}
      <div className={getGridClass()}>
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <div
              className="relative overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                openLightbox(image)
              }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-auto object-cover transition-transform duration-200 group-hover:scale-105"
              />
              
              {/* Image overlay controls */}
              {isSelected && (
                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        openLightbox(image)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditCaption(image.id, image.caption || '')
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(image.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Caption */}
            {showCaptions && (
              <div className="mt-2">
                {editingCaption === image.id ? (
                  <div className="space-y-2">
                    <Input
                      value={tempCaption}
                      onChange={(e) => setTempCaption(e.target.value)}
                      placeholder="Enter caption..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveCaption(image.id)
                        } else if (e.key === 'Escape') {
                          cancelEditCaption()
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveCaption(image.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditCaption}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {image.caption || image.alt}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4"
              onClick={closeLightbox}
            >
              ×
            </Button>
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4">
                {lightboxImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function $createGalleryNode({
  images,
  layout = 'grid',
  columns = 3,
  spacing = 'normal',
  showCaptions = true,
  key,
}: GalleryPayload): GalleryNode {
  return new GalleryNode(images, layout, columns, spacing, showCaptions, key)
}

export function $isGalleryNode(
  node: LexicalNode | null | undefined,
): node is GalleryNode {
  return node instanceof GalleryNode
}