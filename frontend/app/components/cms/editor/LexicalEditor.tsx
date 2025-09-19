'use client'

import * as React from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $getSelection } from 'lexical'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { cn } from '@/lib/utils'
import { EnhancedImageNode } from './nodes/EnhancedImageNode'
import { GalleryNode } from './nodes/GalleryNode'
import { DragDropPlugin } from './plugins/media/DragDropPlugin'

// Register custom nodes
const nodes = [EnhancedImageNode, GalleryNode]

interface LexicalEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

function OnChangePluginWrapper({ onChange }: { onChange?: (value: string) => void }) {
  const [editor] = useLexicalComposerContext()
  
  React.useEffect(() => {
    if (!onChange) return
    
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const selection = $getSelection()
        // Convert to JSON for onChange callback
        const json = editorState.toJSON()
        onChange(JSON.stringify(json))
      })
    })
  }, [editor, onChange])
  
  return null
}

export function LexicalEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  readOnly = false
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'HMHCPEditor',
    theme: {
      root: 'outline-none',
      link: 'text-blue-600 underline',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        underlineStrikethrough: 'underline line-through',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error)
    },
    nodes: nodes as any, // Type assertion to bypass strict typing
    editable: !readOnly,
  }

  return (
    <div className={cn('relative border rounded-md', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="min-h-[300px] p-4 outline-none resize-none" 
              />
            }
            placeholder={() => (
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            )}
            ErrorBoundary={({ children }: { children: React.ReactNode }) => (
              <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded">
                <h3 className="font-semibold mb-2">Editor Error</h3>
                <p className="text-sm">Something went wrong with the editor. Please refresh the page.</p>
                {children}
              </div>
            )}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin />
          <OnChangePluginWrapper onChange={onChange} />
          <DragDropPlugin />
        </div>
      </LexicalComposer>
      {readOnly && (
        <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 pointer-events-none" />
      )}
    </div>
  )
}

export default LexicalEditor