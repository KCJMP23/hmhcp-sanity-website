"use client"

import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import Link from "next/link"
import { EnhancedHero } from "@/components/enhanced-hero"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations-simple"
import { Typography } from "@/components/ui/apple-typography"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import { 
  Calendar, 
  User, 
  ArrowRight,
  Tag,
  Clock,
  TrendingUp,
  BookOpen,
  Users
} from "lucide-react"
import { motion } from "framer-motion"

interface BlogPost {
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  category: string
  image: string
  slug: string
}

interface Category {
  name: string
  count: number
  color: string
}

interface Author {
  name: string
  posts: number
  avatar: string
}

interface BlogPageClientProps {
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  featuredPost: BlogPost
  recentPosts: BlogPost[]
  categories: Category[]
  topAuthors: Author[]
}

export function BlogPageClient({
  heroTitle,
  heroSubtitle,
  heroImage,
  featuredPost,
  recentPosts,
  categories,
  topAuthors
}: BlogPageClientProps) {
  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <EnhancedHero
        title={heroTitle}
        subtitle={heroSubtitle}
        imageSrc={heroImage}
        buttons={{
          primary: {
            text: "Read Latest Posts",
            href: "#recent-posts",
          },
          secondary: {
            text: "Subscribe to Newsletter",
            href: "/newsletter",
          },
        }}
      />

      {/* Featured Post */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-12">
            <Typography as="h2" variant="heading2" className="text-center mb-4">
              Featured Article
            </Typography>
          </FadeIn>

          <FadeIn>
            <GlassmorphismCard className="overflow-hidden" hoverEffect>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="relative h-64 lg:h-auto">
                  <ImageWithFallback
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <Typography as="h3" variant="heading2" className="mb-4">
                    {featuredPost.title}
                  </Typography>
                  <Typography as="p" variant="body" className="mb-6">
                    {featuredPost.excerpt}
                  </Typography>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>{featuredPost.author}</span>
                      <span className="text-gray-400">•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{featuredPost.date}</span>
                    </div>
                    <Link 
                      href={`/blog/${featuredPost.slug}`}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>
          </FadeIn>
        </div>
      </section>

      {/* Recent Posts */}
      <section id="recent-posts" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <Typography as="h2" variant="heading2" className="mb-4">
              Recent Articles
            </Typography>
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              Stay up to date with our latest insights and research
            </Typography>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post, index) => (
              <StaggerItem key={post.slug}>
                <GlassmorphismCard className="h-full overflow-hidden group" hoverEffect>
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <Typography as="h3" variant="heading3" className="mb-3 line-clamp-2">
                        {post.title}
                      </Typography>
                      <Typography as="p" variant="body" className="mb-4 line-clamp-3">
                        {post.excerpt}
                      </Typography>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {post.date}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-2 flex items-center transition-all">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </GlassmorphismCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn className="text-center mt-12">
            <Link href="/blog/all">
              <LiquidGlassButton variant="primary" size="lg">
                View All Articles
              </LiquidGlassButton>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Sidebar Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Categories */}
          <div>
            <FadeIn>
              <Typography as="h3" variant="heading3" className="mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Categories
              </Typography>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link 
                      href={`/blog/category/${category.name.toLowerCase().replace(/ /g, '-')}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className={`px-2 py-1 bg-${category.color}-100 dark:bg-${category.color}-900/30 text-${category.color}-600 dark:text-${category.color}-400 text-xs `}>
                        {category.count}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Top Authors */}
          <div>
            <FadeIn>
              <Typography as="h3" variant="heading3" className="mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Top Contributors
              </Typography>
              <div className="space-y-4">
                {topAuthors.map((author, index) => (
                  <motion.div
                    key={author.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link 
                      href={`/blog/author/${author.name.toLowerCase().replace(/ /g, '-')}`}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="relative w-12 h-12 overflow-hidden">
                        <ImageWithFallback
                          src={author.avatar}
                          alt={author.name}
                          fill
                          className="object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{author.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {author.posts} articles
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Newsletter Signup */}
          <div>
            <FadeIn>
              <GlassmorphismCard className="p-6">
                <Typography as="h3" variant="heading3" className="mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Stay Updated
                </Typography>
                <Typography as="p" variant="body" className="mb-6">
                  Subscribe to our newsletter for the latest healthcare insights and innovations.
                </Typography>
                <form className="space-y-4">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <LiquidGlassButton
                    variant="primary"
                    size="md"
                    onClick={() => {}}
                  >
                    Subscribe
                  </LiquidGlassButton>
                </form>
              </GlassmorphismCard>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}