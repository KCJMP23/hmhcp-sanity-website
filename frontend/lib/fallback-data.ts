/**
 * Dynamic fallback data loader
 * Loads fallback data that was generated from Sanity CMS at build time
 */

import fs from 'fs'
import path from 'path'

// Static fallback data (used if dynamic data unavailable)
const STATIC_FALLBACK = {
  homepage: {
    _id: 'fallback-homepage',
    _type: 'homepage',
    hero: {
      title: 'Transforming Healthcare Through Innovation',
      subtitle: 'Where cutting-edge technology meets compassionate care',
      primaryCTA: { text: 'Explore Our Solutions', href: '/platforms' },
      secondaryCTA: { text: 'Learn More', href: '/about' }
    },
    sections: [
      {
        _type: 'visionSection',
        _key: 'vision',
        title: 'Healthcare. Reimagined.',
        subtitle: 'We believe in a future where technology enhances every aspect of patient care',
        items: [
          {
            _key: '1',
            title: 'Clinical Excellence',
            description: 'Advanced tools for better patient outcomes',
            icon: 'Stethoscope'
          },
          {
            _key: '2', 
            title: 'Innovation-Driven',
            description: 'Cutting-edge solutions for modern healthcare',
            icon: 'Lightbulb'
          },
          {
            _key: '3',
            title: 'Global Impact',
            description: 'Transforming healthcare delivery worldwide',
            icon: 'Globe'
          }
        ]
      }
    ]
  },

  blogPage: {
    _id: 'fallback-blog',
    _type: 'blogPage',
    hero: {
      title: 'Healthcare Insights & News',
      subtitle: 'Latest updates in healthcare technology and innovation from our expert team',
      primaryCTA: { text: 'Subscribe to Updates', href: '#subscribe' }
    },
    featuredPosts: [
      {
        _key: '1',
        title: 'The Future of Digital Health Records',
        excerpt: 'Exploring how advanced EDC systems are revolutionizing clinical data management and improving patient outcomes.',
        image: '/blog-digital-health.jpg',
        author: 'Dr. Sarah Johnson',
        date: 'January 10, 2025',
        category: 'Digital Health',
        slug: 'future-of-digital-health-records'
      },
      {
        _key: '2',
        title: 'Quality Improvement in Healthcare',
        excerpt: 'Best practices and methodologies for implementing effective QA/QI programs in healthcare organizations.',
        image: '/blog-quality-improvement.jpg',
        author: 'Dr. Michael Chen',
        date: 'January 8, 2025',
        category: 'Quality Assurance',
        slug: 'quality-improvement-healthcare'
      },
      {
        _key: '3',
        title: 'Clinical Research Innovation',
        excerpt: 'How modern research platforms are accelerating medical discoveries and improving trial efficiency.',
        image: '/blog-clinical-research.jpg',
        author: 'Dr. Emily Rodriguez',
        date: 'January 5, 2025',
        category: 'Clinical Research',
        slug: 'clinical-research-innovation'
      }
    ],
    recentPosts: [
      {
        _key: '1',
        title: 'Telehealth Adoption: Overcoming Barriers to Implementation',
        excerpt: 'Strategies for healthcare organizations looking to expand their telehealth capabilities.',
        image: '/telehealth-consultation.png',
        author: 'James Wilson',
        date: 'December 22, 2024',
        category: 'Telehealth',
        slug: 'telehealth-adoption-barriers'
      }
    ],
    categories: [
      'Digital Health', 'Artificial Intelligence', 'User Experience', 'Telehealth',
      'Health IT', 'Healthcare Strategy', 'Research', 'Quality Improvement'
    ],
    newsletter: {
      title: 'Stay Updated',
      subtitle: 'Get the latest healthcare insights delivered to your inbox',
      placeholder: 'Your email address',
      buttonText: 'Subscribe'
    }
  }
}

/**
 * Load dynamic fallback data (generated from CMS) or static fallback
 */
export function loadFallbackData(pageType: string) {
  try {
    // Try to load dynamic fallback data first
    if (typeof window === 'undefined') { // Server-side only
      const fallbackPath = path.join(process.cwd(), 'lib/fallback-data.json')
      
      if (fs.existsSync(fallbackPath)) {
        const dynamicFallback = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        
        if (dynamicFallback[pageType]) {
          console.log(`✅ Using dynamic fallback data for ${pageType}`)
          return dynamicFallback[pageType]
        }
      }
    }
    
    // Fall back to static data
    console.log(`📋 Using static fallback data for ${pageType}`)
    return STATIC_FALLBACK[pageType as keyof typeof STATIC_FALLBACK]
    
  } catch (error) {
    console.warn(`⚠️  Error loading fallback data for ${pageType}:`, error)
    return STATIC_FALLBACK[pageType as keyof typeof STATIC_FALLBACK]
  }
}

/**
 * Get the latest blog posts for fallback (can be used for fresh content)
 */
export async function getLatestBlogPosts(limit = 6) {
  try {
    // This could fetch from an external API, RSS feed, or other source
    // For now, return current date-adjusted posts
    const now = new Date()
    const posts = STATIC_FALLBACK.blogPage.featuredPosts.map((post, index) => ({
      ...post,
      date: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      })
    }))
    
    return posts.slice(0, limit)
  } catch (error) {
    console.warn('⚠️  Error fetching latest blog posts:', error)
    return STATIC_FALLBACK.blogPage.featuredPosts
  }
}