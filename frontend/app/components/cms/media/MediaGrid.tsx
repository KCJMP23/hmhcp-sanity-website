'use client'

import { useEffect, useRef, useState } from 'react'
import { MediaCard } from './MediaCard'
import { cn } from '@/lib/utils'
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
  publicUrl?: string
  created_at?: string
}

interface MediaGridProps {
  media?: MediaFile[]
  loading?: boolean
  onMediaClick?: (media: MediaFile) => void
  onFileSelect?: (file: MediaFile) => void
  selectionMode?: 'single' | 'multiple' | 'none'
  selectedMedia?: MediaFile[]
  selectedFiles?: MediaFile[]
  virtualScroll?: boolean
  folderId?: string | null
  searchQuery?: string
  fileTypes?: string[]
  allowMultiple?: boolean
  gridCols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function MediaGrid({
  media = [],
  loading = false,
  onMediaClick,
  onFileSelect,
  selectionMode = 'none',
  selectedMedia = [],
  selectedFiles = [],
  virtualScroll = true,
  folderId,
  searchQuery,
  fileTypes,
  allowMultiple,
  gridCols = {
    default: 2,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6
  }
}: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })

  useEffect(() => {
    if (!virtualScroll || !containerRef.current) return

    const container = containerRef.current
    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const itemHeight = 200 // Approximate height of each item
      const buffer = 10 // Number of items to render outside viewport

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
      const end = Math.min(
        media.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      )

      setVisibleRange({ start, end })
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll)
  }, [media.length, virtualScroll])

  const visibleMedia = virtualScroll
    ? media.slice(visibleRange.start, visibleRange.end)
    : media

  const gridClass = cn(
    'grid gap-4',
    `grid-cols-${gridCols.default}`,
    gridCols.sm && `sm:grid-cols-${gridCols.sm}`,
    gridCols.md && `md:grid-cols-${gridCols.md}`,
    gridCols.lg && `lg:grid-cols-${gridCols.lg}`,
    gridCols.xl && `xl:grid-cols-${gridCols.xl}`
  )

  if (media.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-16 h-16 text-muted-foreground mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium mb-1">No media files</h3>
        <p className="text-sm text-muted-foreground">
          Upload some files to get started
        </p>
      </div>
    )
  }

  const content = (
    <>
      {virtualScroll && visibleRange.start > 0 && (
        <div style={{ height: `${visibleRange.start * 200}px` }} />
      )}
      {visibleMedia.map((file) => {
        const isSelected = selectedMedia.some(m => m.id === file.id)
        return (
          <MediaCard
            key={file.id}
            media={file}
            onClick={() => onMediaClick?.(file)}
            selected={isSelected}
            selectable={selectionMode !== 'none'}
          />
        )
      })}
      {virtualScroll && visibleRange.end < media.length && (
        <div style={{ height: `${(media.length - visibleRange.end) * 200}px` }} />
      )}
    </>
  )

  return virtualScroll && media.length > 100 ? (
    <div
      ref={containerRef}
      className="overflow-y-auto max-h-[600px] pr-2"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className={gridClass}>
        {content}
      </div>
    </div>
  ) : (
    <div className={gridClass}>
      {content}
    </div>
  )
}