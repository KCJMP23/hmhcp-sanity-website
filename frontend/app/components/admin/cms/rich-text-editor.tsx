'use client'

import { useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdating = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isUpdating.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      isUpdating.current = true
      const content = editorRef.current.innerHTML
      onChange(content)
      setTimeout(() => {
        isUpdating.current = false
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold')
          handleInput()
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic')
          handleInput()
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline')
          handleInput()
          break
      }
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border rounded-t-md bg-muted/30">
        <button
          type="button"
          className="px-2 py-1 text-sm font-bold border rounded hover:bg-muted"
          onClick={() => {
            document.execCommand('bold')
            handleInput()
          }}
        >
          B
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm italic border rounded hover:bg-muted"
          onClick={() => {
            document.execCommand('italic')
            handleInput()
          }}
        >
          I
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm underline border rounded hover:bg-muted"
          onClick={() => {
            document.execCommand('underline')
            handleInput()
          }}
        >
          U
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <button
          type="button"
          className="px-2 py-1 text-sm border rounded hover:bg-muted"
          onClick={() => {
            document.execCommand('insertUnorderedList')
            handleInput()
          }}
        >
          • List
        </button>
        <button
          type="button"
          className="px-2 py-1 text-sm border rounded hover:bg-muted"
          onClick={() => {
            document.execCommand('insertOrderedList')
            handleInput()
          }}
        >
          1. List
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <button
          type="button"
          className="px-2 py-1 text-sm border rounded hover:bg-muted"
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) {
              document.execCommand('createLink', false, url)
              handleInput()
            }
          }}
        >
          Link
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[200px] p-3 border rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          outline: none;
        }
        [contenteditable] h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h2 {
          font-size: 1.3em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] p {
          margin: 0.5em 0;
        }
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}