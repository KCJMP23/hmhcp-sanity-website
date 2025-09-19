'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { BlogPost } from '@/lib/supabase-content'
import { mockBlogPosts } from '@/lib/supabase-content'

interface RelatedPostsProps {
  currentPost: BlogPost
  maxPosts?: number
}

export function RelatedPosts({ currentPost, maxPosts = 3 }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    // Filter out current post and find related posts based on tags
    const otherPosts = mockBlogPosts.filter(post => post.slug !== currentPost.slug)
    
    // Score posts based on shared tags
    const scoredPosts = otherPosts.map(post => {
      const currentTags = currentPost.tags || []
      const postTags = post.tags || []
      const sharedTags = currentTags.filter(tag => postTags.includes(tag))
      
      return {
        ...post,
        score: sharedTags.length
      }
    })

    // Sort by score (shared tags) and take the top posts
    const related = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPosts)

    setRelatedPosts(related)
  }, [currentPost, maxPosts])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Recent'
    }
  }

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section>
      <h3 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-8">Related Articles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Card key={post.slug} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              {post.featured_image && (
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Tags overlay */}
              {post.tags && post.tags.length > 0 && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800">
                    {post.tags[0]}
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{post.readTime || 5} min</span>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h4>

              {post.excerpt && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group-hover:gap-3 transition-all"
              >
                Read Article
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-lg hover:shadow-xl"
        >
          View All Articles
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}