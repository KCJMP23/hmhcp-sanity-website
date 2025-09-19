'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { Clock, User, ArrowRight, Search } from "lucide-react"
import { getBlogPosts, getBlogCategories } from "@/lib/static-blog-data"

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  const posts = getBlogPosts()
  const categories = ["All", ...getBlogCategories()]
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || 
                           post.categories.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 py-20 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-white">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            Clinical Research Innovation Hub
          </h1>
          <p className="mt-6 text-xl leading-8 text-blue-100 max-w-3xl mx-auto">
            Discover breakthrough insights, cutting-edge strategies, and transformative 
            technologies shaping the future of healthcare delivery and clinical excellence
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="px-4 py-12 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.id}>
                  <Card className="h-full hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
                    {/* Featured Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-t-lg" />
                    
                    <CardHeader>
                      {/* Categories */}
                      <div className="flex gap-2 mb-2">
                        {post.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {post.excerpt}
                      </CardDescription>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.reading_time} min
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700">
            <CardContent className="p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Stay Informed with Healthcare Insights
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Subscribe to our newsletter for the latest research, innovations, and industry updates.
              </p>
              <Link href="/newsletter">
                <LiquidGlassButton variant="white" className="px-8 py-3">
                  Subscribe Now
                </LiquidGlassButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}