'use client'

import { useState } from 'react'
import {
  DecoratorNode,
  NodeKey,
  LexicalNode,
  LexicalEditor,
  SerializedLexicalNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
} from 'lexical'
import { Edit, RotateCw, Crop, Download, Trash2, AlignLeft, AlignCenter, AlignRight, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface EnhancedImagePayload {
  src: string
  alt?: string
  width?: number
  height?: number
  caption?: string
  alignment?: 'left' | 'center' | 'right' | 'full'
  responsive?: boolean
  srcSet?: string
  sizes?: string
  uploadId?: string
  key?: NodeKey
}

export interface SerializedEnhancedImageNode extends Spread<EnhancedImagePayload, SerializedLexicalNode> {
  type: 'enhanced-image'
}

export class EnhancedImageNode extends DecoratorNode<React.ReactElement> {
  __src: string
  __alt: string
  __width?: number
  __height?: number
  __caption?: string
  __alignment: 'left' | 'center' | 'right' | 'full'
  __responsive: boolean
  __srcSet?: string
  __sizes?: string
  __uploadId?: string

  static getType(): string {
    return 'enhanced-image'
  }

  static clone(node: EnhancedImageNode): EnhancedImageNode {
    return new EnhancedImageNode({
      src: node.__src,
      alt: node.__alt,
      caption: node.__caption,
      width: node.__width,
      height: node.__height,
      alignment: node.__alignment,
      responsive: node.__responsive,
      uploadId: node.__uploadId
    }, node.__key)
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImgElement,
        priority: 0,
      }),
    }
  }

  constructor(props: EnhancedImagePayload, key?: NodeKey) {
    super(key)
    this.__src = props.src
    this.__alt = props.alt || ''
    this.__caption = props.caption || ''
    this.__width = props.width
    this.__height = props.height
    this.__alignment = props.alignment || 'center'
    this.__responsive = props.responsive !== false
    this.__srcSet = props.srcSet
    this.__sizes = props.sizes
    this.__uploadId = props.uploadId
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'enhanced-image-node'
    return div
  }

  updateDOM(): false {
    return false
  }

  // Getters
  getSrc(): string { return this.__src }
  getAlt(): string { return this.__alt }
  getWidth(): number | undefined { return this.__width }
  getHeight(): number | undefined { return this.__height }
  getCaption(): string | undefined { return this.__caption }
  getAlignment(): 'left' | 'center' | 'right' | 'full' { return this.__alignment }
  getResponsive(): boolean { return this.__responsive }
  getSrcSet(): string | undefined { return this.__srcSet }
  getSizes(): string | undefined { return this.__sizes }
  getUploadId(): string | undefined { return this.__uploadId }

  // Setters
  setSrc(src: string): void {
    const writable = this.getWritable()
    writable.__src = src
  }

  setAlt(alt: string): void {
    const writable = this.getWritable()
    writable.__alt = alt
  }

  setWidth(width: number): void {
    const writable = this.getWritable()
    writable.__width = width
  }

  setHeight(height: number): void {
    const writable = this.getWritable()
    writable.__height = height
  }

  setCaption(caption: string): void {
    const writable = this.getWritable()
    writable.__caption = caption
  }

  setAlignment(alignment: 'left' | 'center' | 'right' | 'full'): void {
    const writable = this.getWritable()
    writable.__alignment = alignment
  }

  setResponsive(responsive: boolean): void {
    const writable = this.getWritable()
    writable.__responsive = responsive
  }

  setSrcSet(srcSet: string): void {
    const writable = this.getWritable()
    writable.__srcSet = srcSet
  }

  setSizes(sizes: string): void {
    const writable = this.getWritable()
    writable.__sizes = sizes
  }

  setUploadId(uploadId: string): void {
    const writable = this.getWritable()
    writable.__uploadId = uploadId
  }

  decorate(): React.ReactElement {
    return (
      <EnhancedImageComponent
        src={this.__src}
        alt={this.__alt}
        width={this.__width}
        height={this.__height}
        caption={this.__caption}
        alignment={this.__alignment}
        responsive={this.__responsive}
        srcSet={this.__srcSet}
        sizes={this.__sizes}
        uploadId={this.__uploadId}
        nodeKey={this.getKey()}
        node={this}
      />
    )
  }

  static importJSON(serializedNode: SerializedEnhancedImageNode): EnhancedImageNode {
    const { 
      src, alt, width, height, caption, alignment, responsive, srcSet, sizes, uploadId 
    } = serializedNode
    return $createEnhancedImageNode({
      src, alt, width, height, caption, alignment, responsive, srcSet, sizes, uploadId
    })
  }

  exportJSON(): SerializedEnhancedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
      caption: this.__caption,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      responsive: this.__responsive,
      uploadId: this.__uploadId,
      type: 'enhanced-image',
      version: 1,
    }
  }
}

interface EnhancedImageComponentProps {
  src: string
  alt: string
  width?: number
  height?: number
  caption?: string
  alignment: 'left' | 'center' | 'right' | 'full'
  responsive: boolean
  srcSet?: string
  sizes?: string
  uploadId?: string
  nodeKey: NodeKey
  node: EnhancedImageNode
}

function EnhancedImageComponent({
  src,
  alt,
  width,
  height,
  caption,
  alignment,
  responsive,
  srcSet,
  sizes,
  uploadId,
  nodeKey,
  node,
}: EnhancedImageComponentProps) {
  const [isSelected, setIsSelected] = useState(false)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editCaption, setEditCaption] = useState(caption || '')
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [editAlt, setEditAlt] = useState(alt || '')

  const getAlignmentClasses = () => {
    switch (alignment) {
      case 'left':
        return 'float-left mr-4 mb-4 max-w-[50%]'
      case 'right':
        return 'float-right ml-4 mb-4 max-w-[50%]'
      case 'full':
        return 'w-full my-6'
      default:
        return 'mx-auto my-4 block'
    }
  }

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right' | 'full') => {
    node.setAlignment(newAlignment)
  }

  const handleCaptionSave = () => {
    node.setCaption(editCaption)
    setIsEditingCaption(false)
  }

  const handleAltSave = () => {
    node.setAlt(editAlt)
    setIsEditingAlt(false)
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const deleteImage = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      node.remove()
    }
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer',
        getAlignmentClasses()
      )}
      onClick={() => setIsSelected(!isSelected)}
      onBlur={() => setIsSelected(false)}
      tabIndex={0}
    >
      {/* Image */}
      <div className={cn(
        'relative overflow-hidden ',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}>
        <img
          src={src}
          alt={alt}
          width={alignment === 'full' ? undefined : width}
          height={alignment === 'full' ? undefined : height}
          srcSet={responsive ? srcSet : undefined}
          sizes={responsive ? sizes : undefined}
          className={cn(
            ' shadow-md transition-all duration-200',
            alignment === 'full' ? 'w-full h-auto' : 'max-w-full h-auto',
            'group-hover:shadow-lg'
          )}
          draggable={false}
        />

        {/* Overlay controls */}
        {isSelected && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 shadow-lg">
              {/* Alignment controls */}
              <Button
                size="sm"
                variant={alignment === 'left' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlignmentChange('left')
                }}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={alignment === 'center' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlignmentChange('center')
                }}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={alignment === 'right' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlignmentChange('right')
                }}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={alignment === 'full' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlignmentChange('full')
                }}
              >
                <Maximize className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300" />

              {/* Action controls */}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingAlt(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadImage()
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteImage()
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      {(caption || isEditingCaption) && (
        <div className="mt-2">
          {isEditingCaption ? (
            <div className="space-y-2">
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Enter caption..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCaptionSave()
                  } else if (e.key === 'Escape') {
                    setIsEditingCaption(false)
                    setEditCaption(caption || '')
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCaptionSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingCaption(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-gray-600 dark:text-gray-400 italic text-center cursor-text"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingCaption(true)
              }}
            >
              {caption}
            </p>
          )}
        </div>
      )}

      {/* Alt text editor */}
      {isEditingAlt && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <h4 className="font-medium mb-2">Edit Alt Text</h4>
          <Input
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
            placeholder="Describe this image for screen readers..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAltSave()
              } else if (e.key === 'Escape') {
                setIsEditingAlt(false)
                setEditAlt(alt || '')
              }
            }}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAltSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditingAlt(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Alt text helps screen readers describe images to visually impaired users.
          </p>
        </div>
      )}

      {/* Add caption button */}
      {!caption && !isEditingCaption && isSelected && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditingCaption(true)
          }}
        >
          Add Caption
        </Button>
      )}
    </div>
  )
}

export function $createEnhancedImageNode({
  src,
  alt,
  width,
  height,
  caption,
  alignment = 'center',
  responsive = true,
  srcSet,
  sizes,
  uploadId,
  key,
}: EnhancedImagePayload): EnhancedImageNode {
  return new EnhancedImageNode(
    { src, alt, width, height, caption, alignment, responsive, srcSet, sizes, uploadId, key }
  )
}

export function $isEnhancedImageNode(
  node: LexicalNode | null | undefined,
): node is EnhancedImageNode {
  return node instanceof EnhancedImageNode
}

function convertImgElement(element: Node): DOMConversionOutput {
  const img = element as HTMLImageElement
  const { src, alt, width, height } = img
  
  return {
    node: $createEnhancedImageNode({
      src: src || '',
      alt: alt || '',
      width: width ? parseInt(width.toString(), 10) : undefined,
      height: height ? parseInt(height.toString(), 10) : undefined,
    }),
  }
}