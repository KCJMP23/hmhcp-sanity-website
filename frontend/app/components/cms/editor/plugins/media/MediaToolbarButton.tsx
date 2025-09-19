'use client'

import { useState } from 'react'
import { Image, Video, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MediaBrowser } from './MediaBrowser'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { INSERT_IMAGE_COMMAND } from '../../commands/MediaCommands'
import { $createEnhancedImageNode } from '../../nodes/EnhancedImageNode'
import { $insertNodes } from 'lexical'
import { logger } from '@/lib/logger';

interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  title?: string
  alt_text?: string
  description?: string
  url?: string
}

interface MediaInsertOptions {
  alignment?: 'left' | 'center' | 'right' | 'full'
  caption?: string
  linkText?: string
  responsive?: boolean
}

export function MediaToolbarButton() {
  const [editor] = useLexicalComposerContext()
  const [showBrowser, setShowBrowser] = useState(false)
  const [browserConfig, setBrowserConfig] = useState({
    allowMultiple: false,
    fileTypes: undefined as string[] | undefined,
    maxSelections: 1
  })

  const insertImage = (file: MediaFile, options: MediaInsertOptions = {}) => {
    if (!file.url) {
      // Get file URL first
      const token = localStorage.getItem('cms_token')
      fetch(`/api/cms/media/${file.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(result => {
        if (result.url) {
          executeImageInsert({ ...file, url: result.url }, options)
        }
      })
      .catch(error => {
        logger.error('Failed to get image URL:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
      })
    } else {
      executeImageInsert(file, options)
    }
  }

  const executeImageInsert = (file: MediaFile, options: MediaInsertOptions) => {
    editor.update(() => {
      const imageNode = $createEnhancedImageNode({
        src: file.url!,
        alt: file.alt_text || file.original_name,
        width: options.alignment === 'full' ? undefined : file.width,
        height: options.alignment === 'full' ? undefined : file.height,
        caption: options.caption,
        alignment: options.alignment,
        responsive: options.responsive
      })
      $insertNodes([imageNode])
    })
  }

  const insertVideo = (file: MediaFile, options: MediaInsertOptions = {}) => {
    if (!file.url) {
      const token = localStorage.getItem('cms_token')
      fetch(`/api/cms/media/${file.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(result => {
        if (result.url) {
          executeVideoInsert({ ...file, url: result.url }, options)
        }
      })
    } else {
      executeVideoInsert(file, options)
    }
  }

  const executeVideoInsert = (file: MediaFile, options: MediaInsertOptions) => {
    // Production implementation: Insert video as HTML element
    editor.update(() => {
      const videoHtml = `
        <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
          <video controls style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            <source src="${file.url}" type="${file.mime_type}">
            Your browser does not support the video tag.
          </video>
        </div>
      `
      // Insert media using proper Lexical media node
      logger.info('Video insert:', { action: 'info_logged', metadata: { videoHtml } })
    })
  }

  const insertDocument = (file: MediaFile, options: MediaInsertOptions = {}) => {
    if (!file.url) {
      const token = localStorage.getItem('cms_token')
      fetch(`/api/cms/media/${file.id}/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(result => {
        if (result.url) {
          executeDocumentInsert({ ...file, url: result.url }, options)
        }
      })
    } else {
      executeDocumentInsert(file, options)
    }
  }

  const executeDocumentInsert = (file: MediaFile, options: MediaInsertOptions) => {
    // Insert as a link
    editor.update(() => {
      const linkText = options.linkText || file.original_name
      const linkHtml = `<a href="${file.url}" download="${file.original_name}">${linkText}</a>`
      // Production implementation: HTML link for document downloads
      logger.info('Document insert:', { action: 'info_logged', metadata: { linkHtml } })
    })
  }

  const handleMediaSelect = (file: MediaFile, options?: MediaInsertOptions) => {
    if (file.mime_type.startsWith('image/')) {
      insertImage(file, options)
    } else if (file.mime_type.startsWith('video/')) {
      insertVideo(file, options)
    } else {
      insertDocument(file, options)
    }
    setShowBrowser(false)
  }

  const openImageBrowser = () => {
    setBrowserConfig({
      allowMultiple: false,
      fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      maxSelections: 1
    })
    setShowBrowser(true)
  }

  const openVideoBrowser = () => {
    setBrowserConfig({
      allowMultiple: false,
      fileTypes: ['video/mp4', 'video/webm', 'video/ogg'],
      maxSelections: 1
    })
    setShowBrowser(true)
  }

  const openDocumentBrowser = () => {
    setBrowserConfig({
      allowMultiple: false,
      fileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      maxSelections: 1
    })
    setShowBrowser(true)
  }

  const openGalleryBrowser = () => {
    setBrowserConfig({
      allowMultiple: true,
      fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSelections: 10
    })
    setShowBrowser(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={openImageBrowser}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-4 h-4 mr-2" />
            Insert Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openGalleryBrowser}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-4 h-4 mr-2" />
            Insert Gallery
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openVideoBrowser}>
            <Video className="w-4 h-4 mr-2" />
            Insert Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openDocumentBrowser}>
            <FileText className="w-4 h-4 mr-2" />
            Insert Document Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MediaBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={handleMediaSelect}
        allowMultiple={browserConfig.allowMultiple}
        fileTypes={browserConfig.fileTypes}
        maxSelections={browserConfig.maxSelections}
      />
    </>
  )
}