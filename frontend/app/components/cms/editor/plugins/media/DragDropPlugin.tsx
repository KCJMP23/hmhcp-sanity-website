'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createEnhancedImageNode } from '../../nodes/EnhancedImageNode'
import { $insertNodes, $getSelection } from 'lexical'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function DragDropPlugin() {
  const [editor] = useLexicalComposerContext()
  const { toast } = useToast()

  useEffect(() => {
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    // Inject styles when component mounts
    injectDragOverStyles()

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
      
      // Add visual feedback
      editorElement.classList.add('drag-over')
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      
      // Remove visual feedback if leaving the editor area
      if (!editorElement.contains(event.relatedTarget as Node)) {
        editorElement.classList.remove('drag-over')
      }
    }

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
      editorElement.classList.remove('drag-over')

      const files = Array.from(event.dataTransfer?.files || [])
      if (files.length === 0) return

      // Filter and validate files
      const imageFiles = files.filter(file => ACCEPTED_IMAGE_TYPES.includes(file.type))
      
      if (imageFiles.length === 0) {
        toast({
          title: 'Invalid File Type',
          description: 'Only image files (JPEG, PNG, GIF, WebP) are supported for drag and drop.',
          variant: 'destructive'
        })
        return
      }

      // Check file sizes
      const oversizedFiles = imageFiles.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        toast({
          title: 'File Too Large',
          description: `Some files exceed the 10MB limit and were skipped.`,
          variant: 'destructive'
        })
      }

      const validFiles = imageFiles.filter(file => file.size <= MAX_FILE_SIZE)
      
      if (validFiles.length === 0) return

      // Upload files and insert into editor
      for (const file of validFiles) {
        try {
          // Show upload progress
          const uploadId = `upload-${Date.now()}-${Math.random()}`
          
          // Insert placeholder first
          const placeholderSrc = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzI4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg==`
          
          let placeholderNode: any = null
          
          editor.update(() => {
            const selection = $getSelection()
            if (selection) {
              placeholderNode = $createEnhancedImageNode({
                src: placeholderSrc,
                alt: `Uploading ${file.name}...`,
                caption: `Uploading ${file.name}...`,
                width: 800,
                height: 600,
                alignment: 'center',
                responsive: true,
                uploadId
              })
              $insertNodes([placeholderNode])
            }
          })

          // Upload file to API
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/cms/media', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Upload failed')
          }

          const result = await response.json()
          const uploadedFile = result.data

          // Get the URL for the uploaded file
          const urlResponse = await fetch(`/api/cms/media/${uploadedFile.id}/url`)
          const urlResult = await urlResponse.json()

          // Replace placeholder with actual image
          editor.update(() => {
            if (placeholderNode) {
              const actualImageNode = $createEnhancedImageNode({
                src: urlResult.url,
                alt: uploadedFile.alt_text || uploadedFile.original_name,
                caption: uploadedFile.description || `File: ${file.name}`,
                width: uploadedFile.width || 800,
                height: uploadedFile.height || 600,
                alignment: 'center',
                responsive: true
              })
              
              // Find and replace the placeholder node
              const root = editor.getEditorState()._nodeMap
              for (const [, node] of root) {
                if (node.__type === 'enhanced-image' && (node as any).__uploadId === uploadId) {
                  (node as any).replace(actualImageNode)
                  break
                }
              }
            }
          })

          toast({
            title: 'Upload Complete',
            description: `${file.name} uploaded successfully`
          })
        } catch (error) {
          logger.error('Failed to upload file:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
          toast({
            title: 'Upload Failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive'
          })
        }
      }
    }

    // Add event listeners
    editorElement.addEventListener('dragover', handleDragOver)
    editorElement.addEventListener('dragleave', handleDragLeave)
    editorElement.addEventListener('drop', handleDrop)

    // Cleanup
    return () => {
      editorElement.removeEventListener('dragover', handleDragOver)
      editorElement.removeEventListener('dragleave', handleDragLeave)
      editorElement.removeEventListener('drop', handleDrop)
      editorElement.classList.remove('drag-over')
      
      // Remove injected styles when component unmounts
      removeDragOverStyles()
    }
  }, [editor, toast])

  return null
}

// Add CSS for drag-over state with proper cleanup
let dragOverStyleElement: HTMLStyleElement | null = null

function injectDragOverStyles() {
  if (typeof document === 'undefined' || dragOverStyleElement) return
  
  dragOverStyleElement = document.createElement('style')
  dragOverStyleElement.setAttribute('data-drag-drop-plugin', 'true')
  dragOverStyleElement.textContent = `
    .drag-over {
      background-color: #f0f9ff !important;
      border: 2px dashed #3b82f6 !important;
      border-radius: 8px !important;
    }
    
    .dark .drag-over {
      background-color: #1e3a8a !important;
      border-color: #60a5fa !important;
    }
  `
  document.head.appendChild(dragOverStyleElement)
}

function removeDragOverStyles() {
  if (dragOverStyleElement) {
    document.head.removeChild(dragOverStyleElement)
    dragOverStyleElement = null
  }
}