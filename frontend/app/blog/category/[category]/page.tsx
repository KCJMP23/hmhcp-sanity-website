import { Typography } from "@/components/ui/apple-typography"
import { FrostedGlassCard } from "@/components/ui/global-styles"
import { FadeIn } from "@/components/animations"
import { fetchPageContent } from "@/lib/dal/unified-content"
import Link from "next/link"
import { Clock, Calendar, ArrowRight, User, Tag } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ category: string }>
}


// Fallback categories
const fallbackCategories: Record<string, any> = {
  "technology": {
    category: {
      title: "Technology",
      slug: { current: "technology" },
      description: "Explore the latest healthcare technology innovations and digital health solutions"
    },
    posts: [
      {
        _id: "1",
        title: "The Future of AI in Healthcare: Transforming Patient Care",
        slug: { current: "ai-healthcare-future" },
        excerpt: "Explore how artificial intelligence is revolutionizing healthcare delivery, from diagnostic accuracy to personalized treatment plans.",
        author: { name: "Dr. Sarah Johnson" },
        categories: [
          { title: "Technology", slug: { current: "technology" } },
          { title: "AI & ML", slug: { current: "ai-ml" } }
        ],
        publishedAt: "2024-03-15T10:00:00Z",
        readingTime: 5
      }
    ],
    totalCount: 1
  },
  "digital-health": {
    category: {
      title: "Digital Health",
      slug: { current: "digital-health" },
      description: "Insights on digital transformation in healthcare and telehealth innovations"
    },
    posts: [
      {
        _id: "3",
        title: "Digital Health Implementation: Lessons from the Field",
        slug: { current: "digital-health-implementation" },
        excerpt: "Real-world insights and best practices for successfully implementing digital health solutions in clinical settings.",
        author: { name: "Dr. Emily Rodriguez" },
        categories: [
          { title: "Digital Health", slug: { current: "digital-health" } },
          { title: "Case Studies", slug: { current: "case-studies" } }
        ],
        publishedAt: "2024-03-05T09:15:00Z",
        readingTime: 6
      }
    ],
    totalCount: 1
  },
  "healthcare-policy": {
    category: {
      title: "Healthcare Policy",
      slug: { current: "healthcare-policy" },
      description: "Analysis of healthcare regulations, policies, and industry trends"
    },
    posts: [
      {
        _id: "2",
        title: "Implementing Value-Based Care: A Practical Guide",
        slug: { current: "value-based-care-guide" },
        excerpt: "Learn the essential steps for transitioning from fee-for-service to value-based care models in your healthcare organization.",
        author: { name: "Michael Chen, MBA" },
        categories: [
          { title: "Healthcare Policy", slug: { current: "healthcare-policy" } },
          { title: "Best Practices", slug: { current: "best-practices" } }
        ],
        publishedAt: "2024-03-10T14:30:00Z",
        readingTime: 8
      }
    ],
    totalCount: 1
  },
  "quality-improvement": {
    category: {
      title: "Quality Improvement",
      slug: { current: "quality-improvement" },
      description: "Best practices and strategies for healthcare quality improvement initiatives"
    },
    posts: [
      {
        _id: "4",
        title: "Quality Improvement Through Data Analytics",
        slug: { current: "quality-improvement-data" },
        excerpt: "Discover how healthcare organizations are leveraging data analytics to drive continuous quality improvement initiatives.",
        author: { name: "James Wilson, RN" },
        categories: [
          { title: "Quality Improvement", slug: { current: "quality-improvement" } },
          { title: "Data Analytics", slug: { current: "data-analytics" } }
        ],
        publishedAt: "2024-02-28T11:45:00Z",
        readingTime: 7
      }
    ],
    totalCount: 1
  }
}

export default async function CategoryBlogPage({ params }: PageProps) {
  const { category } = await params
  
  let pageContent = null
  
  try {
    pageContent = await fetchPageContent(`blog-category-${category}`, 'page')
  } catch (error) {
    console.error('Failed to fetch category posts:', error)
  }

  // Use fallback data if Sanity fetch fails
  if (!pageContent && fallbackCategories[category]) {
    pageContent = fallbackCategories[category]
  }

  // If no content found, show 404
  if (!pageContent?.category) {
    notFound()
  }

  const content = pageContent

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Tag className="w-8 h-8 text-white" />
              </div>
            </div>
            <Typography as="h1" variant="display" className="mb-4 text-white">
              {content.category.title}
            </Typography>
            <Typography as="p" variant="heading3" className="text-white/90 font-light mb-4">
              {content.category.description}
            </Typography>
            <Typography as="p" variant="body" className="text-white/80">
              {content.totalCount} {content.totalCount === 1 ? 'article' : 'articles'} in this category
            </Typography>
          </FadeIn>
        </div>
      </section>

      {/* Breadcrumb */}
      <section className="py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              Blog
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-gray-100">{content.category.title}</span>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          {content.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.posts.map((post: any, index: number) => (
                <FadeIn key={post._id} delay={index * 0.1}>
                  <Link href={`/blog/${post.slug.current}`}>
                    <FrostedGlassCard className="h-full hover:shadow-xl transition-all group cursor-pointer">
                      {/* Image */}
                      {post.mainImage && (
                        <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 -t-lg" />
                      )}
                      
                      <div className="p-8">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.categories?.map((cat: any, idx: number) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium"
                            >
                              {cat.title}
                            </span>
                          ))}
                        </div>

                        {/* Title */}
                        <Typography as="h2" variant="heading3" className="mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </Typography>

                        {/* Excerpt */}
                        <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {post.excerpt}
                        </Typography>

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                          <div className="flex items-center gap-4">
                            {/* Author */}
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{post.author?.name}</span>
                            </div>
                            
                            {/* Reading Time */}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{post.readingTime} min read</span>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Read More */}
                        <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 transition-all">
                          <span>Read Article</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </FrostedGlassCard>
                  </Link>
                </FadeIn>
              ))}
            </div>
          ) : (
            <FadeIn>
              <div className="text-center py-12">
                <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400 mb-6">
                  No articles found in this category yet.
                </Typography>
                <Link href="/blog">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                    View All Articles
                  </button>
                </Link>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <Typography as="h2" variant="heading2" className="mb-8">
              Explore Other Categories
            </Typography>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(fallbackCategories)
                .filter(([key]) => key !== category)
                .map(([key, data]) => (
                  <Link 
                    key={key} 
                    href={`/blog/category/${key}`}
                    className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    {data.category.title}
                  </Link>
                ))}
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}