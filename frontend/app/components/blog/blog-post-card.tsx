'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar as CalendarIcon, User as UserIcon, Eye as EyeIcon, Heart as HeartIcon, Share as ShareIcon } from 'lucide-react'
import { BlogPost } from '@/types/blog'
import { ButtonStandard } from '@/components/ui/button-standard'

interface BlogPostCardProps {
  post: BlogPost
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Recent'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Recent'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Recent'
    }
  }

  const getAuthorName = () => {
    if (post.author && typeof post.author === 'object') {
      const author = post.author as any
      return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'HMHCP Team'
    }
    return 'HMHCP Team'
  }

  const getFeaturedImage = () => {
    if (post.featuredImage) {
      return post.featuredImage
    }
    
    // Generate topic-specific hero images based on post title/content
    const title = post.title.toLowerCase()
    
    if (title.includes('telemedicine') || title.includes('telehealth')) {
      return '/hero-technology.jpg'
    } else if (title.includes('cybersecurity') || title.includes('security') || title.includes('data protection')) {
      return '/hero-consultation.jpg'
    } else if (title.includes('ai') || title.includes('artificial intelligence') || title.includes('machine learning')) {
      return '/hero-technology.jpg'
    } else if (title.includes('management') || title.includes('leadership')) {
      return '/hero-consultation.jpg'
    } else if (title.includes('workflow') || title.includes('optimization') || title.includes('efficiency')) {
      return '/hero-research.jpg'
    } else if (title.includes('patient') || title.includes('quality') || title.includes('safety')) {
      return '/hero-research.jpg'
    } else if (title.includes('digital health') || title.includes('transformation')) {
      return '/hero-technology.jpg'
    } else if (title.includes('compliance') || title.includes('regulatory')) {
      return '/hero-consultation.jpg'
    } else if (title.includes('remote') || title.includes('monitoring')) {
      return '/hero-technology.jpg'
    } else if (title.includes('value-based') || title.includes('economics')) {
      return '/hero-consultation.jpg'
    }
    
    // Default fallback to research image
    return '/hero-research.jpg'
  }

  return (
    <article className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 overflow-hidden hover:-translate-y-2 hover:scale-[1.02] h-full flex flex-col">
      {/* Featured Image with Apple-style overlay */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={getFeaturedImage()}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        

        {/* Floating action button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-10 h-10 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-600/30 rounded-full flex items-center justify-center hover:bg-white/30 dark:hover:bg-gray-800/40 transition-colors">
            <ShareIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Content with premium spacing */}
      <div className="p-8 flex flex-col flex-grow">
        {/* Meta Information with SF Pro */}
        <div className="flex items-center font-sf-text text-sm text-gray-500 mb-4 space-x-6">
          <div className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
            <span>{formatDate(post.publishedAt || post.published_at || post.created_at)}</span>
          </div>
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-blue-500" />
            <span>{getAuthorName()}</span>
          </div>
        </div>

        {/* Title with Apple typography */}
        <h3 className="font-sf-display text-xl lg:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
          <Link href={`/blog/${post.slug}`} className="hover:underline decoration-blue-500/30 underline-offset-4">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt with refined typography */}
        <p className="font-sf-text text-gray-600 mb-6 line-clamp-3 leading-relaxed">
          {post.excerpt || 'Discover innovative insights and breakthrough research findings in healthcare technology and clinical excellence.'}
        </p>

        {/* Tags with Apple-style design */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 hover:from-blue-100 hover:to-blue-150 transition-colors duration-200"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Engagement Stats and CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 font-sf-text text-sm text-gray-500">
            {post.views && (
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                <span>{post.views}</span>
              </div>
            )}
            {post.likes && (
              <div className="flex items-center">
                <HeartIcon className="w-4 h-4 mr-1.5 text-blue-500" />
                <span>{post.likes}</span>
              </div>
            )}
          </div>
          
          {/* White background with blue text button */}
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium rounded-full border border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Read More
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 to-blue-600/5" />
      </div>
    </article>
  )
}
