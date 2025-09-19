'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  content: string
  activeHeading?: string
}

export function TableOfContents({ content, activeHeading }: TableOfContentsProps) {
  // Directly parse content without state management to avoid hydration issues
  const tocItems = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return []
    }

    // Clean content first - remove TOC sections like the blog detail component does
    let cleanContent = content
      .replace(/## Table of Contents[\s\S]*?(?=\n## |\n# |$)/g, '')
      .replace(/^\s*\n/gm, '')
    
    // Extract headings from cleaned content using a more robust approach
    const items: TocItem[] = []
    
    // Split content into lines for easier processing
    const lines = cleanContent.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for markdown headings (# ## ### etc.)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2].trim()
        
        // Only include major sections (level 1 and 2 headings)
        if (level <= 2) {
          // Generate ID using the same logic as the blog-post-detail component
          const id = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '')

          if (title && id) {
            items.push({ id, title, level })
          }
        }
      }
    }

    return items
  }, [content])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementTop = element.offsetTop - offset
      window.scrollTo({ top: elementTop, behavior: 'smooth' })
    }
  }

  if (tocItems.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No sections found
      </div>
    )
  }

  return (
    <nav className="space-y-2">
      {tocItems.map((item, index) => (
        <button
          key={index}
          onClick={() => scrollToHeading(item.id)}
          className={cn(
            "block w-full text-left text-sm transition-colors hover:text-blue-600",
            item.level === 1 && "font-medium",
            item.level === 2 && "pl-4 text-sm",
            activeHeading === item.id 
              ? "text-blue-600 font-medium" 
              : "text-gray-600"
          )}
        >
          {item.title}
        </button>
      ))}
    </nav>
  )
}