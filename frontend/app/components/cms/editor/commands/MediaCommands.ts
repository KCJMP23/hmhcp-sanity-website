import { createCommand, LexicalCommand } from 'lexical'

export interface ImagePayload {
  src: string
  alt?: string
  width?: number
  height?: number
  caption?: string
  alignment?: 'left' | 'center' | 'right' | 'full'
  responsive?: boolean
  uploadId?: string
  srcSet?: string
  sizes?: string
}

export interface GalleryPayload {
  images: Array<{
    id: string
    src: string
    alt: string
    caption?: string
    width: number
    height: number
  }>
  layout?: 'grid' | 'carousel' | 'masonry'
  columns?: number
}

export interface VideoPayload {
  src: string
  poster?: string
  width?: number
  height?: number
  caption?: string
  autoplay?: boolean
  controls?: boolean
}

export interface DocumentPayload {
  src: string
  filename: string
  linkText?: string
  size?: number
  mimeType?: string
}

// Image commands
export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand('INSERT_IMAGE_COMMAND')
export const UPDATE_IMAGE_COMMAND: LexicalCommand<{ nodeKey: string } & Partial<ImagePayload>> = createCommand('UPDATE_IMAGE_COMMAND')
export const REMOVE_IMAGE_COMMAND: LexicalCommand<string> = createCommand('REMOVE_IMAGE_COMMAND')

// Gallery commands
export const INSERT_GALLERY_COMMAND: LexicalCommand<GalleryPayload> = createCommand('INSERT_GALLERY_COMMAND')
export const UPDATE_GALLERY_COMMAND: LexicalCommand<{ nodeKey: string } & Partial<GalleryPayload>> = createCommand('UPDATE_GALLERY_COMMAND')
export const ADD_TO_GALLERY_COMMAND: LexicalCommand<{ nodeKey: string; images: GalleryPayload['images'] }> = createCommand('ADD_TO_GALLERY_COMMAND')
export const REMOVE_FROM_GALLERY_COMMAND: LexicalCommand<{ nodeKey: string; imageIds: string[] }> = createCommand('REMOVE_FROM_GALLERY_COMMAND')

// Video commands
export const INSERT_VIDEO_COMMAND: LexicalCommand<VideoPayload> = createCommand('INSERT_VIDEO_COMMAND')
export const UPDATE_VIDEO_COMMAND: LexicalCommand<{ nodeKey: string } & Partial<VideoPayload>> = createCommand('UPDATE_VIDEO_COMMAND')

// Document commands
export const INSERT_DOCUMENT_COMMAND: LexicalCommand<DocumentPayload> = createCommand('INSERT_DOCUMENT_COMMAND')
export const UPDATE_DOCUMENT_COMMAND: LexicalCommand<{ nodeKey: string } & Partial<DocumentPayload>> = createCommand('UPDATE_DOCUMENT_COMMAND')

// Generic media commands
export const OPEN_MEDIA_BROWSER_COMMAND: LexicalCommand<{
  type?: 'image' | 'video' | 'document' | 'gallery'
  allowMultiple?: boolean
  fileTypes?: string[]
}> = createCommand('OPEN_MEDIA_BROWSER_COMMAND')

export const REPLACE_MEDIA_COMMAND: LexicalCommand<{
  nodeKey: string
  newSrc: string
  preserveSettings?: boolean
}> = createCommand('REPLACE_MEDIA_COMMAND')

// Drag and drop commands
export const HANDLE_FILE_DROP_COMMAND: LexicalCommand<{
  files: File[]
  position?: { x: number; y: number }
}> = createCommand('HANDLE_FILE_DROP_COMMAND')

// Media editing commands
export const EDIT_IMAGE_COMMAND: LexicalCommand<{
  nodeKey: string
  editorType?: 'crop' | 'resize' | 'rotate' | 'alt'
}> = createCommand('EDIT_IMAGE_COMMAND')

export const CROP_IMAGE_COMMAND: LexicalCommand<{
  nodeKey: string
  cropData: {
    x: number
    y: number
    width: number
    height: number
    aspectRatio?: number
  }
}> = createCommand('CROP_IMAGE_COMMAND')

export const RESIZE_IMAGE_COMMAND: LexicalCommand<{
  nodeKey: string
  width: number
  height?: number
  maintainAspectRatio?: boolean
}> = createCommand('RESIZE_IMAGE_COMMAND')

export const ROTATE_IMAGE_COMMAND: LexicalCommand<{
  nodeKey: string
  degrees: 90 | 180 | 270
}> = createCommand('ROTATE_IMAGE_COMMAND')

export const UPDATE_ALT_TEXT_COMMAND: LexicalCommand<{
  nodeKey: string
  altText: string
}> = createCommand('UPDATE_ALT_TEXT_COMMAND')

// Accessibility commands
export const VALIDATE_MEDIA_ACCESSIBILITY_COMMAND: LexicalCommand<string> = createCommand('VALIDATE_MEDIA_ACCESSIBILITY_COMMAND')
export const GENERATE_ALT_TEXT_COMMAND: LexicalCommand<string> = createCommand('GENERATE_ALT_TEXT_COMMAND')

// Responsive commands
export const GENERATE_SRCSET_COMMAND: LexicalCommand<{
  nodeKey: string
  originalSrc: string
  sizes?: string
}> = createCommand('GENERATE_SRCSET_COMMAND')

export const UPDATE_RESPONSIVE_SETTINGS_COMMAND: LexicalCommand<{
  nodeKey: string
  settings: {
    srcSet?: string
    sizes?: string
    breakpoints?: Array<{ width: number; src: string }>
  }
}> = createCommand('UPDATE_RESPONSIVE_SETTINGS_COMMAND')