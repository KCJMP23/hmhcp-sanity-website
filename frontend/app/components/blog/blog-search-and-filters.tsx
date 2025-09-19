'use client'

import { useState } from 'react'
import { Search as MagnifyingGlassIcon, Filter as FunnelIcon, X as XMarkIcon } from 'lucide-react'

export default function BlogSearchAndFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'ai', label: 'Artificial Intelligence' },
    { value: 'digital-health', label: 'Digital Health' },
    { value: 'quality-improvement', label: 'Quality Improvement' },
    { value: 'healthcare-it', label: 'Healthcare IT' },
    { value: 'innovation', label: 'Innovation' }
  ]

  const popularTags = [
    { value: 'all', label: 'All Tags' },
    { value: 'AI', label: 'AI' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Innovation', label: 'Innovation' },
    { value: 'Digital Health', label: 'Digital Health' },
    { value: 'Quality Improvement', label: 'Quality Improvement' },
    { value: 'Implementation', label: 'Implementation' },
    { value: 'Strategy', label: 'Strategy' },
    { value: 'Data Analytics', label: 'Data Analytics' }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchTerm)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    // TODO: Implement category filtering
    console.log('Selected category:', category)
  }

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    // TODO: Implement tag filtering
    console.log('Selected tag:', tag)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedTag('all')
  }

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedTag !== 'all'

  return (
    <div className="space-y-8">
      {/* Search Bar with Apple-style design */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Search breakthrough insights and innovations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-32 py-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 focus:bg-white/80 dark:focus:bg-gray-800/80 transition-all duration-300 font-sf-text text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg hover:shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-700 text-white px-6 py-2.5 rounded-full hover:bg-blue-800 transition-all duration-300 hover:scale-105 font-sf-text font-medium border border-blue-500/30 shadow-[0_12px_40px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm"
            style={{ 
              backdropFilter: 'blur(4px) saturate(130%)',
              boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters with Apple-style design */}
      <div className="space-y-8">
        {/* Categories */}
        <div className="space-y-4">
          <label className="flex items-center font-sf-display text-lg font-medium text-gray-800">
            <FunnelIcon className="w-5 h-5 mr-3 text-blue-600" />
            Research Categories
          </label>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`px-5 py-2.5 rounded-full font-sf-text font-medium transition-all duration-300 hover:scale-105 border ${
                  selectedCategory === category.value
                    ? 'bg-blue-700 text-white border-blue-500/30 shadow-[0_12px_40px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm hover:bg-blue-800'
                    : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border-gray-200/50 hover:border-blue-300/50'
                }`}
                style={selectedCategory === category.value ? { 
                  backdropFilter: 'blur(4px) saturate(130%)',
                  boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                } : {}}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <label className="block font-sf-display text-lg font-medium text-gray-800">
            Innovation Topics
          </label>
          <div className="flex flex-wrap gap-3">
            {popularTags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagChange(tag.value)}
                className={`px-4 py-2 rounded-full font-sf-text font-medium transition-all duration-300 hover:scale-105 border ${
                  selectedTag === tag.value
                    ? 'bg-blue-700 text-white border-blue-500/30 shadow-[0_12px_40px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm hover:bg-blue-800'
                    : 'bg-blue-50/80 backdrop-blur-sm text-blue-700 hover:bg-blue-100/80 border-blue-200/50'
                }`}
                style={selectedTag === tag.value ? { 
                  backdropFilter: 'blur(4px) saturate(130%)',
                  boxShadow: '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                } : {}}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-2">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 font-sf-text font-medium text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-105 bg-gray-100/60 backdrop-blur-sm rounded-full hover:bg-gray-200/60 border border-gray-200/50"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display with Apple-style badges */}
      {hasActiveFilters && (
        <div className="pt-6 border-t border-white/30">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-sf-text font-medium text-gray-700">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-4 py-2 rounded-full font-sf-text font-medium bg-gradient-to-r from-blue-100 to-blue-150 text-blue-800 border border-blue-200/50 backdrop-blur-sm">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:bg-blue-200/60 rounded-full p-1 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full font-sf-text font-medium bg-gradient-to-r from-blue-100 to-blue-150 text-blue-800 border border-blue-200/50 backdrop-blur-sm">
                Category: {categories.find(c => c.value === selectedCategory)?.label}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 hover:bg-blue-200/60 rounded-full p-1 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedTag !== 'all' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full font-sf-text font-medium bg-gradient-to-r from-blue-100 to-blue-150 text-blue-800 border border-blue-200/50 backdrop-blur-sm">
                Topic: {popularTags.find(t => t.value === selectedTag)?.label}
                <button
                  onClick={() => setSelectedTag('all')}
                  className="ml-2 hover:bg-blue-200/60 rounded-full p-1 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
