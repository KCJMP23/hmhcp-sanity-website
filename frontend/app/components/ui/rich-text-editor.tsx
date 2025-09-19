'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from './button'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading2, 
  Link,
  Code,
  Undo,
  Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value?: string
  content?: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, content, onChange, placeholder }: RichTextEditorProps) {
  const actualContent = value || content || ''
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (editorRef.current && actualContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = actualContent
      setIsEmpty(!actualContent || actualContent === '<p><br></p>' || actualContent === '')
    }
  }, [actualContent])

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      onChange(newContent)
      setIsEmpty(!newContent || newContent === '<p><br></p>' || newContent === '')
    }
    editorRef.current?.focus()
  }

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      onChange(newContent)
      setIsEmpty(!newContent || newContent === '<p><br></p>' || newContent === '')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      handleCommand('insertText', '    ')
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      handleCommand('createLink', url)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold' },
    { icon: Italic, command: 'italic', tooltip: 'Italic' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: 'Heading' },
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
    { icon: Code, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
    { icon: Link, command: 'link', action: insertLink, tooltip: 'Insert Link' },
    { icon: Undo, command: 'undo', tooltip: 'Undo' },
    { icon: Redo, command: 'redo', tooltip: 'Redo' }
  ]

  return (
    <div className="border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 flex gap-1 flex-wrap">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => {
              if (button.action) {
                button.action()
              } else {
                handleCommand(button.command, button.value)
              }
            }}
            title={button.tooltip}
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      
      <div className="relative">
        {isEmpty && placeholder && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            "min-h-[400px] p-4 focus:outline-none",
            "prose prose-sm max-w-none",
            "[&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2",
            "[&>p]:mb-4",
            "[&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4",
            "[&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4",
            "[&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:ml-0 [&>blockquote]:text-gray-600",
            "[&>pre]:bg-gray-100 [&>pre]:p-4 [&>pre]: [&>pre]:overflow-x-hidden [&>pre]:font-mono [&>pre]:text-sm",
            "[&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800"
          )}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        />
      </div>
    </div>
  )
}