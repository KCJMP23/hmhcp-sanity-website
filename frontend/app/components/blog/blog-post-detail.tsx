'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clock, User, ArrowLeft, Share2, BookOpen, Mail, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BlogPost } from '@/lib/supabase-content'
import { EmailSignupForm } from '@/components/email-signup-form'
import { SocialShareButtons } from '@/components/social-share-buttons'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { KeyTakeaways } from '@/components/blog/key-takeaways'
import { RelatedPosts } from '@/components/blog/related-posts'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { sanitizeHTML } from '@/lib/sanitization/dompurify'

interface BlogPostDetailProps {
  post: BlogPost
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeHeading, setActiveHeading] = useState('')
  const [showSidebarSignup, setShowSidebarSignup] = useState(true)
  
  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
      
      // Update active heading for TOC
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const scrollPos = window.scrollY + 100
      
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement
        if (heading.offsetTop <= scrollPos) {
          setActiveHeading(heading.id || '')
          break
        }
      }
      
      // Hide sidebar signup when approaching main CTA section
      const ctaSection = document.querySelector('.newsletter-signup-cta')
      if (ctaSection) {
        const ctaRect = ctaSection.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        // Hide sidebar signup when CTA is within 200px of viewport
        const shouldHideSidebarSignup = ctaRect.top < viewportHeight + 200
        setShowSidebarSignup(!shouldHideSidebarSignup)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Format dates
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Recently Published'
    }
  }

  // Extract key takeaways from content
  const extractKeyTakeaways = (content: string) => {
    const takeaways = []
    
    // Look for common patterns in the content
    if (content.includes('Key Components')) {
      takeaways.push('Comprehensive framework with multiple integrated components')
    }
    if (content.includes('AI') || content.includes('artificial intelligence')) {
      takeaways.push('AI-powered analytics enhance decision-making capabilities')
    }
    if (content.includes('patient')) {
      takeaways.push('Patient-centric approach improves outcomes and satisfaction')
    }
    if (content.includes('regulatory') || content.includes('FDA')) {
      takeaways.push('Regulatory compliance is essential for market success')
    }
    if (content.includes('real-time') || content.includes('monitoring')) {
      takeaways.push('Real-time monitoring provides actionable insights')
    }
    
    return takeaways.length > 0 ? takeaways : [
      'Innovative healthcare technology solutions',
      'Evidence-based implementation strategies', 
      'Improved patient outcomes and efficiency',
      'Regulatory compliance and quality assurance'
    ]
  }

  // Parse content to create proper HTML structure
  const parseContent = (content: string) => {
    if (!content) return ''
    
    // Remove duplicate Table of Contents section from content
    let cleanContent = content
      .replace(/## Table of Contents[\s\S]*?(?=\n## |\n# |$)/g, '') // Remove TOC section
      .replace(/^\s*\n/gm, '') // Remove empty lines
    
    // Special handling for References section - convert to proper APA format
    cleanContent = cleanContent.replace(
      /(## References[\s\S]*?)(?=\n## |\n# |$)/g,
      (match, referencesSection) => {
        // Extract the references content after the "## References" heading
        const referencesContent = referencesSection.replace(/^## References\s*\n+/gm, '')
        
        // Split into individual references and filter out empty ones
        const references = referencesContent
          .split(/\n\s*\n/)
          .filter(ref => ref.trim().length > 0)
          .map(ref => ref.trim())
        
        // Create properly formatted APA reference list
        const referencesList = references
          .map(ref => `<li class="mb-3 pl-6 -indent-6">${ref}</li>`)
          .join('\n')
        
        return `## References\n\n<div class="references-section"><ol class="list-none space-y-3 text-sm text-gray-700 leading-relaxed">\n${referencesList}\n</ol></div>`
      }
    )

    // Convert markdown-style content to HTML
    let htmlContent = cleanContent
      .replace(/^# (.+)$/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return `<h1 id="${id}" class="scroll-mt-20 text-4xl font-light text-gray-900 dark:text-gray-100 mb-6 mt-12">${title}</h1>`
      })
      .replace(/^## (.+)$/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return `<h2 id="${id}" class="scroll-mt-20 text-3xl font-light text-gray-900 dark:text-gray-100 mb-4 mt-10">${title}</h2>`
      })
      .replace(/^### (.+)$/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return `<h3 id="${id}" class="scroll-mt-20 text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 mt-8">${title}</h3>`
      })
      .replace(/^#### (.+)$/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return `<h4 id="${id}" class="scroll-mt-20 text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 mt-6">${title}</h4>`
      })
      .replace(/^\- (.+)$/gm, '<li class="mb-2">$1</li>')
      .replace(/^(\d+\. .+)$/gm, '<li class="mb-2">$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="my-8 rounded-lg overflow-hidden shadow-lg"><img src="$2" alt="$1" class="w-full h-auto" /></div>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')

    // Wrap in paragraphs
    if (!htmlContent.startsWith('<h1') && !htmlContent.startsWith('<h2')) {
      htmlContent = '<p class="mb-4 text-gray-700 leading-relaxed">' + htmlContent + '</p>'
    }

    // Sanitize the HTML content to prevent XSS attacks
    return sanitizeHTML(htmlContent)
  }

  const keyTakeaways = extractKeyTakeaways(post.content?.toString() || '')
  const publishedDate = formatDate(post.published_at || post.created_at)
  const readTime = post.readTime || Math.ceil((post.content?.toString() || '').split(' ').length / 200)

  return (
    <article className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <header className="relative">
        {/* Featured Image */}
        {(post.featured_image || post.featuredImage) && (
          <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
            <Image
              src={post.featured_image || post.featuredImage}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-600/40 to-blue-400/20" />
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-tight">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="text-xl text-gray-200 max-w-3xl leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* If no featured image, create a gradient hero */}
        {!(post.featured_image || post.featuredImage) && (
          <div className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-blue-600/30 to-blue-400/10" />
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-tight">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="text-xl text-gray-200 max-w-3xl leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation - After hero section */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <Link 
                href="/blog" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium rounded-lg px-3 py-2 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Blog</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <SocialShareButtons 
                  url={`/blog/${post.slug}`}
                  title={post.title}
                  description={post.excerpt || ''}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* Article Meta */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author || 'HMHCP Innovation Team'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{publishedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Clinical Research</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Table of Contents
                  </h3>
                  
                  <TableOfContents 
                    content={post.content?.toString() || ''} 
                    activeHeading={activeHeading}
                  />
                  
                  {/* Compact Email Signup - Hidden when approaching main CTA */}
                  {showSidebarSignup && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <Mail className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">Stay Informed</h4>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                          Get healthcare insights delivered to your inbox
                        </p>
                        <EmailSignupForm compact />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Article Content */}
          <main className="lg:col-span-3">
            {/* Key Takeaways - moved to top of content */}
            <div className="mb-8">
              <KeyTakeaways takeaways={keyTakeaways} />
            </div>

            <div className="prose prose-lg max-w-none">
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ 
                  __html: parseContent(post.content?.toString() || '') 
                }}
              />
            </div>

            {/* Newsletter Signup CTA */}
            <div className="newsletter-signup-cta mt-16 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white">
              <div className="text-center">
                <Mail className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-light mb-4">Stay Updated on Healthcare Innovation</h3>
                <p className="text-white mb-6 max-w-2xl mx-auto">
                  Get the latest insights in healthcare innovation, clinical research breakthroughs, and industry best practices delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="px-4 py-3 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 w-full sm:flex-1 max-w-xs"
                  />
                  <LiquidGlassButton 
                    variant="secondary" 
                    size="md"
                    className="shrink-0"
                  >
                    Subscribe
                  </LiquidGlassButton>
                </div>
                <p className="text-white text-xs mt-4 opacity-80">
                  Get the latest insights in healthcare innovation. Unsubscribe anytime.
                </p>
              </div>
            </div>

            {/* Author Bio */}
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About the Author</h4>
              <p className="text-gray-600">
                The HMHCP Innovation Team consists of leading experts in clinical research, 
                healthcare technology, and regulatory affairs, dedicated to advancing the future 
                of medical innovation and patient care.
              </p>
            </div>

            {/* Related Posts */}
            <div className="mt-12">
              <RelatedPosts currentPost={post} />
            </div>
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-0"
          size="icon"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      )}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt || post.seo_description,
            image: post.featured_image,
            author: {
              '@type': 'Organization',
              name: 'HMHCP Innovation Team'
            },
            publisher: {
              '@type': 'Organization',
              name: 'HM Healthcare Partners',
              logo: {
                '@type': 'ImageObject',
                url: '/logo.png'
              }
            },
            datePublished: post.published_at || post.created_at,
            dateModified: post.updated_at,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `/blog/${post.slug}`
            }
          })
        }}
      />
    </article>
  )
}