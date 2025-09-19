'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

interface BlogPostCardProps {
  title: string
  excerpt: string
  author: string
  publishedAt: string
  slug: string
  imageUrl?: string
  className?: string
}

export function BlogPostCard({
  title,
  excerpt,
  author,
  publishedAt,
  slug,
  imageUrl,
  className = ''
}: BlogPostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <article className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${className}`}>
      {imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {author}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(publishedAt)}
          </div>
        </div>
        
        <Link 
          href={`/blog/${slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group-hover:translate-x-1 transition-transform"
        >
          Read more
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
