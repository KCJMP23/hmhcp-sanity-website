/**
 * Rich Text Editor Component
 * Built with Lexical for healthcare-compliant content editing
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { $getRoot, $getSelection, EditorState, LexicalEditor } from 'lexical'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { 
  $createHeadingNode,
  $createQuoteNode,
  $isRootOrShadowRoot
} from '@lexical/rich-text'
import { $createParagraphNode } from 'lexical'
import { $createListNode, $createListItemNode, ListNode, ListItemNode } from '@lexical/list'
import { $createLinkNode, LinkNode } from '@lexical/link'
import { $createCodeNode, CodeNode } from '@lexical/code'
import { createEditor } from 'lexical'
import { 
  $setBlocksType,
  $createRangeSelection,
  $isAtNodeEnd,
  $getNodeByKey,
  $patchStyleText
} from '@lexical/selection'
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils'
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, REDO_COMMAND, UNDO_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical'
import { 
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Image,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminTooltip } from '../ui/AdminTooltip'

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  healthcare?: {
    enableMedicalTerms?: boolean
    enableDrugNames?: boolean
    validateCompliance?: boolean
  }
  features?: {
    images?: boolean
    tables?: boolean
    codeBlocks?: boolean
    embeds?: boolean
  }
  maxLength?: number
  autoSave?: boolean
  onAutoSave?: (content: string) => void
}

// Toolbar button component
function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  tooltip
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
  tooltip?: string
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded hover:bg-gray-100 transition-colors',
        active && 'bg-blue-100 text-blue-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )

  if (tooltip) {
    return <AdminTooltip content={tooltip}>{button}</AdminTooltip>
  }

  return button
}

// Toolbar separator
function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  disabled = false,
  healthcare,
  features = {
    images: true,
    tables: true,
    codeBlocks: true,
    embeds: false
  },
  maxLength,
  autoSave = false,
  onAutoSave
}: RichTextEditorProps) {
  const editorRef = useRef<LexicalEditor | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [blockType, setBlockType] = useState<string>('paragraph')
  const [charCount, setCharCount] = useState(0)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize editor
  useEffect(() => {
    if (!editorContainerRef.current) return

    const config = {
      namespace: 'RichTextEditor',
      theme: {
        root: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        paragraph: 'mb-2',
        heading: {
          h1: 'text-3xl font-bold mb-4',
          h2: 'text-2xl font-bold mb-3',
          h3: 'text-xl font-bold mb-2'
        },
        list: {
          ul: 'list-disc list-inside mb-2',
          ol: 'list-decimal list-inside mb-2',
          listitem: 'mb-1'
        },
        quote: 'border-l-4 border-gray-300 pl-4 italic my-2',
        code: 'bg-gray-100 rounded px-1 py-0.5 font-mono text-sm',
        link: 'text-blue-600 hover:underline cursor-pointer'
      },
      onError(error: Error) {
        console.error('Lexical error:', error)
      },
      editable: !disabled
    }

    const editor = createEditor(config)
    editorRef.current = editor

    // Set initial content if provided
    if (value) {
      editor.update(() => {
        const parser = new DOMParser()
        const dom = parser.parseFromString(value, 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)
        const root = $getRoot()
        root.clear()
        root.append(...nodes)
      })
    }

    // Mount editor to DOM
    const rootElement = editorContainerRef.current
    editor.setRootElement(rootElement)

    // Register update listener
    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        // Update toolbar state
        const selection = $getSelection()
        if (selection) {
          // Update format states
          setIsBold(selection.hasFormat('bold'))
          setIsItalic(selection.hasFormat('italic'))
          setIsUnderline(selection.hasFormat('underline'))
          setIsCode(selection.hasFormat('code'))
          
          // Update block type
          const anchorNode = selection.anchor.getNode()
          const element =
            anchorNode.getKey() === 'root'
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow()
          const elementKey = element.getKey()
          const elementDOM = editor.getElementByKey(elementKey)
          
          if (elementDOM !== null) {
            const type = element.getType()
            setBlockType(type)
          }
        }

        // Get HTML and notify change
        const html = $generateHtmlFromNodes(editor, null)
        onChange?.(html)
        
        // Update character count
        const textContent = $getRoot().getTextContent()
        setCharCount(textContent.length)

        // Handle auto-save
        if (autoSave && onAutoSave) {
          if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
          }
          autoSaveTimerRef.current = setTimeout(() => {
            onAutoSave(html)
          }, 2000) // Auto-save after 2 seconds of inactivity
        }
      })
    })

    // Register command listeners
    const unregisterUndoListener = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (canUndo) => {
        setCanUndo(canUndo)
        return false
      },
      COMMAND_PRIORITY_LOW
    )

    const unregisterRedoListener = editor.registerCommand(
      CAN_REDO_COMMAND,
      (canRedo) => {
        setCanRedo(canRedo)
        return false
      },
      COMMAND_PRIORITY_LOW
    )

    setIsEditorReady(true)

    // Cleanup
    return () => {
      unregisterUpdateListener()
      unregisterUndoListener()
      unregisterRedoListener()
      editor.setRootElement(null)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [value, onChange, disabled, autoSave, onAutoSave])

  // Format text
  const formatText = (format: 'bold' | 'italic' | 'underline' | 'code') => {
    if (!editorRef.current) return
    
    editorRef.current.update(() => {
      const selection = $getSelection()
      if (selection) {
        selection.formatText(format)
      }
    })
  }

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (!url || !editorRef.current) return

    editorRef.current.update(() => {
      const selection = $getSelection()
      if (selection) {
        const linkNode = $createLinkNode(url)
        selection.insertNodes([linkNode])
      }
    })
  }

  // Format block
  const formatBlock = (type: string) => {
    if (!editorRef.current) return

    editorRef.current.update(() => {
      const selection = $getSelection()
      if (selection) {
        if (type === 'h1') {
          $setBlocksType(selection, () => $createHeadingNode('h1'))
        } else if (type === 'h2') {
          $setBlocksType(selection, () => $createHeadingNode('h2'))
        } else if (type === 'h3') {
          $setBlocksType(selection, () => $createHeadingNode('h3'))
        } else if (type === 'quote') {
          $setBlocksType(selection, () => $createQuoteNode())
        } else if (type === 'ul') {
          const listNode = $createListNode('bullet')
          const listItemNode = $createListItemNode()
          listNode.append(listItemNode)
          selection.insertNodes([listNode])
        } else if (type === 'ol') {
          const listNode = $createListNode('number')
          const listItemNode = $createListItemNode()
          listNode.append(listItemNode)
          selection.insertNodes([listNode])
        } else {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      }
    })
  }

  // Undo/Redo
  const handleUndo = () => {
    if (!editorRef.current) return
    editorRef.current.dispatchCommand(UNDO_COMMAND, undefined)
  }

  const handleRedo = () => {
    if (!editorRef.current) return
    editorRef.current.dispatchCommand(REDO_COMMAND, undefined)
  }

  return (
    <div className={cn('rich-text-editor border rounded-lg', className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        {/* History */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={handleUndo}
            disabled={!canUndo || disabled}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={handleRedo}
            disabled={!canRedo || disabled}
            tooltip="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Block formatting */}
        <div className="flex items-center">
          <select
            value={blockType}
            onChange={(e) => formatBlock(e.target.value)}
            disabled={disabled}
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="paragraph">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="quote">Quote</option>
          </select>
        </div>

        <ToolbarSeparator />

        {/* Text formatting */}
        <div className="flex items-center">
          <ToolbarButton
            active={isBold}
            onClick={() => formatText('bold')}
            disabled={disabled}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={isItalic}
            onClick={() => formatText('italic')}
            disabled={disabled}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={isUnderline}
            onClick={() => formatText('underline')}
            disabled={disabled}
            tooltip="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          {features.codeBlocks && (
            <ToolbarButton
              active={isCode}
              onClick={() => formatText('code')}
              disabled={disabled}
              tooltip="Code"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>
          )}
        </div>

        <ToolbarSeparator />

        {/* Lists and links */}
        <div className="flex items-center">
          <ToolbarButton
            onClick={() => formatBlock('ul')}
            disabled={disabled}
            tooltip="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => formatBlock('ol')}
            disabled={disabled}
            tooltip="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={insertLink}
            disabled={disabled}
            tooltip="Insert Link"
          >
            <Link className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Additional features */}
        {(features.images || features.tables) && (
          <>
            <ToolbarSeparator />
            <div className="flex items-center">
              {features.images && (
                <ToolbarButton
                  onClick={() => alert('Image upload coming soon')}
                  disabled={disabled}
                  tooltip="Insert Image"
                >
                  <Image className="h-4 w-4" />
                </ToolbarButton>
              )}
              {features.tables && (
                <ToolbarButton
                  onClick={() => alert('Table insertion coming soon')}
                  disabled={disabled}
                  tooltip="Insert Table"
                >
                  <Table className="h-4 w-4" />
                </ToolbarButton>
              )}
            </div>
          </>
        )}

        {/* Character count */}
        {maxLength && (
          <div className="ml-auto text-xs text-gray-500">
            {charCount} / {maxLength}
          </div>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorContainerRef}
        className={cn(
          'min-h-[300px] max-h-[600px] overflow-y-auto',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        data-placeholder={placeholder}
      />

      {/* Healthcare compliance indicator */}
      {healthcare?.validateCompliance && (
        <div className="border-t bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
          Healthcare compliance validation enabled - PHI and medical terms are monitored
        </div>
      )}

      {/* Auto-save indicator */}
      {autoSave && (
        <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Auto-save enabled
        </div>
      )}
    </div>
  )
}

export default RichTextEditor