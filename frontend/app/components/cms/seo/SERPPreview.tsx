'use client'

import { Globe } from 'lucide-react'

interface SERPPreviewProps {
  title: string
  description: string
  url: string
  favicon?: string
  breadcrumbs?: string[]
}

export function SERPPreview({ 
  title, 
  description, 
  url, 
  favicon,
  breadcrumbs = ['hmhealthcarepartners.com']
}: SERPPreviewProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com'
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
  
  // Truncate title and description like Google does
  const truncatedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title
  const truncatedDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 font-sans">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
        <Globe className="w-4 h-4" />
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">›</span>}
            <span>{crumb}</span>
          </span>
        ))}
      </div>
      
      {/* Title */}
      <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl leading-tight mb-1 hover:underline cursor-pointer">
        {truncatedTitle || 'Page Title'}
      </h3>
      
      {/* URL */}
      <div className="text-[#006621] dark:text-[#93c47d] text-sm mb-2 truncate">
        {fullUrl}
      </div>
      
      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {truncatedDescription || 'Page description will appear here. Write a compelling meta description to improve click-through rates.'}
      </p>
      
      {/* Rich Snippets Preview (optional) */}
      {breadcrumbs.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Rating: ★★★★★</span>
            <span>·</span>
            <span>5.0</span>
            <span>·</span>
            <span>100 reviews</span>
          </div>
        </div>
      )}
    </div>
  )
}