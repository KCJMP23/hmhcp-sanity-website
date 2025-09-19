'use client'

import React from 'react'
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger';
import { getSupabaseImageUrl } from '@/lib/supabase-content'

// Dynamically import the Lexical renderer to avoid SSR issues
const LexicalRenderer = dynamic(
  () => import('@/components/cms/content/LexicalRenderer').then(mod => mod.LexicalRenderer),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 w-full mb-2"></div>
        <div className="h-4 bg-gray-200 w-5/6"></div>
      </div>
    )
  }
)

interface CMSPage {
  id: string
  title: string
  slug: string
  content: any // Lexical editor JSON content
  excerpt?: string
  featured_image?: string
  template?: string
  status: string
  published_at?: string
  created_at: string
  updated_at: string
  author?: {
    name: string
    avatar?: string
  }
}

interface CMSPageRendererProps {
  page: CMSPage
}

export function CMSPageRenderer({ page }: CMSPageRendererProps) {
  // Parse the content if it's a string
  const content = useMemo(() => {
    if (typeof page.content === 'string') {
      try {
        return JSON.parse(page.content)
      } catch (error) {
        logger.error('Error parsing page content:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
        return null
      }
    }
    return page.content
  }, [page.content])

  // Render based on template type
  const renderContent = () => {
    switch (page.template) {
      case 'full-width':
        return (
          <div className="w-full">
            {page.featured_image && (
              <div className="relative h-96 w-full mb-8 -mt-8">
                <img
                  src={getSupabaseImageUrl(page.featured_image)}
                  alt={page.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <h1 className="absolute bottom-8 left-8 text-4xl md:text-5xl font-bold text-white">
                  {page.title}
                </h1>
              </div>
            )}
            {!page.featured_image && (
              <h1 className="text-4xl md:text-5xl font-bold mb-8">{page.title}</h1>
            )}
            <div className="prose prose-lg max-w-none">
              {content && <LexicalRenderer content={content} />}
            </div>
          </div>
        )

      case 'sidebar':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">{page.title}</h1>
              {page.featured_image && (
                <img
                  src={getSupabaseImageUrl(page.featured_image)}
                  alt={page.title}
                  className="w-full h-64 object-cover mb-8"
                />
              )}
              <div className="prose prose-lg max-w-none">
                {content && <LexicalRenderer content={content} />}
              </div>
            </div>
            <aside className="lg:col-span-1">
              {/* Sidebar content can be added here */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Page Information</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600 dark:text-gray-400">Published</dt>
                    <dd>{new Date(page.published_at || page.created_at).toLocaleDateString()}</dd>
                  </div>
                  {page.author && (
                    <div>
                      <dt className="font-medium text-gray-600 dark:text-gray-400">Author</dt>
                      <dd>{page.author.name}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        )

      default: // 'standard' template or no template
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">{page.title}</h1>
            {page.featured_image && (
              <img
                src={getSupabaseImageUrl(page.featured_image)}
                alt={page.title}
                className="w-full h-64 md:h-96 object-cover mb-8"
              />
            )}
            <div className="prose prose-lg max-w-none">
              {content && <LexicalRenderer content={content} />}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {renderContent()}
      </div>
    </div>
  )
}