'use client'

import { Button } from '@/components/ui/button'
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Mail } from 'lucide-react'
import { useState } from 'react'

interface SocialShareButtonsProps {
  url: string
  title: string
  description?: string
  compact?: boolean
}

export function SocialShareButtons({ url, title, description, compact = false }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedDescription = encodeURIComponent(description || '')

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const openShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title, url: fullUrl, text: description })
            } else {
              // Fallback to copy URL
              copyToClipboard()
            }
          }}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Copied!' : 'Share'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Share:</span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openShare('twitter')}
        className="text-gray-600 hover:text-blue-500"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openShare('facebook')}
        className="text-gray-600 hover:text-blue-600"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openShare('linkedin')}
        className="text-gray-600 hover:text-blue-700"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openShare('email')}
        className="text-gray-600 hover:text-gray-800"
        aria-label="Share via email"
      >
        <Mail className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="text-gray-600 hover:text-gray-800"
        aria-label="Copy link"
      >
        <LinkIcon className="w-4 h-4" />
        {copied && <span className="ml-1 text-xs text-green-600">Copied!</span>}
      </Button>
    </div>
  )
}