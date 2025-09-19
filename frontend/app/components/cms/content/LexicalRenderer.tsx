'use client'

import React from 'react'
// import { $generateHtmlFromNodes } from '@lexical/html'
// import { $getRoot, createEditor } from 'lexical'
// import { HeadingNode, QuoteNode } from '@lexical/rich-text'
// import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
// import { ListItemNode, ListNode } from '@lexical/list'
// import { CodeHighlightNode, CodeNode } from '@lexical/code'
// import { AutoLinkNode, LinkNode } from '@lexical/link'
// import { DecoratorNode } from 'lexical'
import { logger } from '@/lib/logger';

interface LexicalRendererProps {
  content: any
}

// Custom image node for Lexical - commented out for now
// class CustomImageNode extends DecoratorNode<React.ReactElement> {
//   // ... implementation commented out
// }

export function LexicalRenderer({ content }: LexicalRendererProps) {
  // Simple fallback renderer for now
  if (!content) {
    return <div className="text-gray-500">No content to render</div>
  }

  // If content is a string, display it directly
  if (typeof content === 'string') {
    return (
      <div className="prose prose-lg max-w-none">
        <p>{content}</p>
      </div>
    )
  }

  // If content has a root property, try to extract text
  if (content.root && content.root.children) {
    const textContent = JSON.stringify(content.root.children)
    return (
      <div className="prose prose-lg max-w-none">
        <p>Content: {textContent}</p>
      </div>
    )
  }

  // Fallback for any other content type
  return (
    <div className="prose prose-lg max-w-none">
      <p>Content loaded (Lexical rendering temporarily disabled)</p>
    </div>
  )
}