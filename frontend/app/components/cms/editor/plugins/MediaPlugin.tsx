'use client'

import { useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import { $createEnhancedImageNode, EnhancedImageNode } from '../nodes/EnhancedImageNode'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '../../media/MediaPicker'
import { Image } from 'lucide-react'
// Simple interface for now - replace with proper type when available
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

export const INSERT_IMAGE_COMMAND = createCommand<{
  src: string
  altText: string
  width?: number
  height?: number
}>('INSERT_IMAGE_COMMAND')

export function MediaPlugin(): React.ReactElement | null {
  // Temporarily disabled due to lexical type compatibility issues
  return null
  
  // const [editor] = useLexicalComposerContext()
  // const [showPicker, setShowPicker] = useState(false)

  // useEffect(() => {
  //   if (!editor.hasNodes([EnhancedImageNode])) {
  //     throw new Error('ImagesPlugin: EnhancedImageNode not registered on editor')
  //   }

  //   const removeListener = editor.registerCommand(
  //     INSERT_IMAGE_COMMAND,
  //     (payload) => {
  //     const imageNode = $createEnhancedImageNode({
  //       src: payload.src,
  //       alt: payload.altText,
  //       width: payload.width,
  //       height: payload.height,
  //     })
  //     $insertNodes([imageNode])
  //     return true
  //   },
  //   COMMAND_PRIORITY_EDITOR
  //   )

  //   return () => {
  //     removeListener()
  //   }
  // }, [editor])

  // const handleMediaSelect = (media: MediaFile | MediaFile[] | null) => {
  //   if (media) {
  //     // Handle single file or take first file from array
  //     const file = Array.isArray(media) ? media[0] : media
  //     if (file) {
  //       editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
  //         src: file.publicUrl || file.url || '',
  //         altText: file.alt_text || file.filename,
  //         width: file.width,
  //         height: file.height,
  //       })
  //     }
  //   }
  //   setShowPicker(false)
  // }

  // return null
}

export function MediaToolbarPlugin(): React.ReactElement | null {
  // Temporarily disabled due to lexical type compatibility issues
  return null
  
  // const [editor] = useLexicalComposerContext()
  // const [showPicker, setShowPicker] = useState(false)

  // const handleMediaSelect = (media: MediaFile | MediaFile[] | null) => {
  //   if (media) {
  //     // Handle single file or take first file from array
  //     const file = Array.isArray(media) ? media[0] : media
  //     if (file) {
  //       editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
  //         src: file.publicUrl || file.url || '',
  //         altText: file.alt_text || file.filename,
  //         width: file.width,
  //         height: file.height,
  //       })
  //     }
  //   }
  //   setShowPicker(false)
  // }

  // return (
  //   <>
  //     <Button
  //       variant="ghost"
  //       size="sm"
  //       onClick={() => setShowPicker(true)}
  //       className="h-8 px-2"
  //       title="Insert Image"
  //     >
  //       <Image className="h-4 w-4" />
  //     </Button>

  //     {showPicker && (
  //       <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
  //         <div className="bg-white dark:bg-zinc-900 shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
  //           <div className="p-4 border-b">
  //             <h3 className="text-lg font-semibold">Insert Image</h3>
  //           </div>
  //           <div className="p-4">
  //             <MediaPicker
  //               value={undefined}
  //               onChange={handleMediaSelect}
  //               accept={['image/*']}
  //               placeholder="Select an image to insert"
  //             />
  //           </div>
  //           <div className="p-4 border-t flex justify-end">
  //             <Button
  //               variant="outline"
  //               onClick={() => setShowPicker(false)}
  //             >
  //               Cancel
  //             </Button>
  //           </div>
  //         </div>
  //       )}
  //   </>
  // )
}