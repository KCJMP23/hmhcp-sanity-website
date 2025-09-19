'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodes, $getSelection } from 'lexical'
import { 
  INSERT_IMAGE_COMMAND,
  INSERT_GALLERY_COMMAND,
  INSERT_VIDEO_COMMAND,
  INSERT_DOCUMENT_COMMAND,
  OPEN_MEDIA_BROWSER_COMMAND,
  type ImagePayload,
  type GalleryPayload,
  type VideoPayload,
  type DocumentPayload
} from '../../commands/MediaCommands'
import { $createEnhancedImageNode } from '../../nodes/EnhancedImageNode'
import { $createGalleryNode } from '../../nodes/GalleryNode'
import { DragDropPlugin } from './DragDropPlugin'
import { logger } from '@/lib/logger';

export function MediaPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Register image command
    const removeImageCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: ImagePayload) => {
        editor.update(() => {
          const selection = $getSelection()
          if (selection) {
            const imageNode = $createEnhancedImageNode({
              src: payload.src,
              alt: payload.alt,
              width: payload.width,
              height: payload.height,
              caption: payload.caption,
              alignment: payload.alignment || 'center',
              responsive: payload.responsive !== false,
              srcSet: payload.srcSet,
              sizes: payload.sizes
            })
            $insertNodes([imageNode])
          }
        })
        return true
      },
      1
    )

    // Register gallery command
    const removeGalleryCommand = editor.registerCommand(
      INSERT_GALLERY_COMMAND,
      (payload: GalleryPayload) => {
        editor.update(() => {
          const selection = $getSelection()
          if (selection) {
            const galleryNode = $createGalleryNode({
              images: payload.images,
              layout: payload.layout || 'grid',
              columns: payload.columns || 3
            })
            $insertNodes([galleryNode])
          }
        })
        return true
      },
      1
    )

    // Register video command (placeholder implementation)
    const removeVideoCommand = editor.registerCommand(
      INSERT_VIDEO_COMMAND,
      (payload: VideoPayload) => {
        // Production implementation: Insert as enhanced image with video data
        editor.update(() => {
          const selection = $getSelection()
          if (selection) {
            const videoImageNode = $createEnhancedImageNode({
              src: payload.poster || payload.src,
              alt: 'Video: ' + (payload.caption || 'Video content'),
              caption: payload.caption,
              alignment: 'center'
            })
            $insertNodes([videoImageNode])
          }
        })
        return true
      },
      1
    )

    // Register document command (placeholder implementation)
    const removeDocumentCommand = editor.registerCommand(
      INSERT_DOCUMENT_COMMAND,
      (payload: DocumentPayload) => {
        // For now, just log - would need proper DocumentLinkNode
        logger.info('Insert document:', { action: 'info_logged', metadata: { payload } })
        return true
      },
      1
    )

    // Register media browser command (placeholder)
    const removeMediaBrowserCommand = editor.registerCommand(
      OPEN_MEDIA_BROWSER_COMMAND,
      (payload) => {
        logger.info('Open media browser:', { action: 'info_logged', metadata: { payload } })
        return true
      },
      1
    )

    // Cleanup
    return () => {
      removeImageCommand()
      removeGalleryCommand()
      removeVideoCommand()
      removeDocumentCommand()
      removeMediaBrowserCommand()
    }
  }, [editor])

  return <DragDropPlugin />
}

// Export node types for editor configuration
export { EnhancedImageNode } from '../../nodes/EnhancedImageNode'
export { GalleryNode } from '../../nodes/GalleryNode'

// Export commands
export * from '../../commands/MediaCommands'