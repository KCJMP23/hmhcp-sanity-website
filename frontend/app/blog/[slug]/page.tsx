'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { ArrowLeft, Clock, User, Share2, Calendar } from "lucide-react"
import { getBlogPost, getBlogPosts } from "@/lib/static-blog-data"

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const post = getBlogPost(slug)
  const relatedPosts = getBlogPosts(3).filter(p => p.slug !== slug)
  
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog">
            <LiquidGlassButton>Back to Blog</LiquidGlassButton>
          </Link>
        </div>
      </div>
    )
  }
  
  // Simple markdown-like rendering without dependencies
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    const elements = []
    let currentList: string[] = []
    let listType: 'ul' | 'ol' | null = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Handle lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (listType !== 'ul') {
          if (currentList.length > 0) {
            elements.push(
              <ol key={`ol-${i}`} className="list-decimal pl-6 mb-4 text-gray-700">
                {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
              </ol>
            )
            currentList = []
          }
          listType = 'ul'
        }
        currentList.push(line.substring(2))
      } else if (line.match(/^\d+\./)) {
        if (listType !== 'ol') {
          if (currentList.length > 0) {
            elements.push(
              <ul key={`ul-${i}`} className="list-disc pl-6 mb-4 text-gray-700">
                {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
              </ul>
            )
            currentList = []
          }
          listType = 'ol'
        }
        currentList.push(line.replace(/^\d+\.\s*/, ''))
      } else {
        // Flush any current list
        if (currentList.length > 0) {
          if (listType === 'ul') {
            elements.push(
              <ul key={`ul-${i}`} className="list-disc pl-6 mb-4 text-gray-700">
                {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
              </ul>
            )
          } else if (listType === 'ol') {
            elements.push(
              <ol key={`ol-${i}`} className="list-decimal pl-6 mb-4 text-gray-700">
                {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
              </ol>
            )
          }
          currentList = []
          listType = null
        }
        
        // Handle headers and paragraphs
        if (line.startsWith('# ')) {
          elements.push(
            <h1 key={i} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
              {line.substring(2)}
            </h1>
          )
        } else if (line.startsWith('## ')) {
          elements.push(
            <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              {line.substring(3)}
            </h2>
          )
        } else if (line.startsWith('### ')) {
          elements.push(
            <h3 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">
              {line.substring(4)}
            </h3>
          )
        } else if (line.length > 0) {
          elements.push(
            <p key={i} className="text-gray-700 mb-4 leading-relaxed">
              {line}
            </p>
          )
        }
      }
    }
    
    // Flush any remaining list
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key="ul-final" className="list-disc pl-6 mb-4 text-gray-700">
            {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
          </ul>
        )
      } else if (listType === 'ol') {
        elements.push(
          <ol key="ol-final" className="list-decimal pl-6 mb-4 text-gray-700">
            {currentList.map((item, idx) => <li key={idx} className="mb-2">{item}</li>)}
          </ol>
        )
      }
    }
    
    return elements
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <Link 
            href="/blog" 
            className="inline-flex items-center text-white/80 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          {/* Categories */}
          <div className="flex gap-2 mb-4">
            {post.categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 text-sm font-semibold text-white/90 bg-white/20 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.reading_time} min read
            </span>
          </div>
        </div>
      </section>
      
      {/* Content Section */}
      <section className="px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                {renderContent(post.content)}
              </div>
            </CardContent>
          </Card>
          
          {/* Author Card */}
          <Card className="mt-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{post.author.name}</h3>
                  <p className="text-gray-600">{post.author.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Share Section */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="text-gray-600">Share this article:</span>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Related Posts */}
      <section className="px-4 py-12 md:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link href={`/blog/${relatedPost.slug}`} key={relatedPost.id}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-lg" />
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}