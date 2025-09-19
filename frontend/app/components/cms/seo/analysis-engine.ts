import type { SEOAnalysisResult, SEOIssue, SEORecommendation, SEOMetrics, SEOContent } from './types'

// Helper functions for advanced SEO analysis
function calculateInternalLinks(content: string): number {
  if (!content) return 0
  
  // Match links that are relative or point to the same domain
  const linkMatches = content.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g) || []
  
  return linkMatches.filter(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/)
    if (!hrefMatch) return false
    
    const href = hrefMatch[1]
    // Internal links: relative paths, hash links, or same domain
    return href.startsWith('/') || href.startsWith('#') || 
           (!href.startsWith('http') && !href.startsWith('mailto:'))
  }).length
}

function calculateExternalLinks(content: string): number {
  if (!content) return 0
  
  const linkMatches = content.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g) || []
  
  return linkMatches.filter(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/)
    if (!hrefMatch) return false
    
    const href = hrefMatch[1]
    // External links: start with http/https and not same domain
    return href.startsWith('http') && !href.includes(window?.location?.hostname || 'localhost')
  }).length
}

function calculateReadabilityScore(content: string): number {
  if (!content) return 0
  
  // Remove HTML tags for text analysis
  const text = content.replace(/<[^>]*>/g, ' ').trim()
  if (!text) return 0
  
  // Split into sentences and words
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  if (sentences.length === 0 || words.length === 0) return 0
  
  // Calculate average words per sentence
  const avgWordsPerSentence = words.length / sentences.length
  
  // Calculate average syllables per word (simplified)
  const avgSyllablesPerWord = words.reduce((sum, word) => {
    return sum + countSyllables(word)
  }, 0) / words.length
  
  // Flesch Reading Ease Score
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  
  // Convert to 0-100 scale and ensure bounds
  return Math.max(0, Math.min(100, Math.round(fleschScore)))
}

function countSyllables(word: string): number {
  // Simple syllable counting algorithm
  word = word.toLowerCase()
  if (word.length <= 3) return 1
  
  const vowels = 'aeiouy'
  let syllableCount = 0
  let previousChar = ''
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i]
    if (vowels.includes(char) && !vowels.includes(previousChar)) {
      syllableCount++
    }
    previousChar = char
  }
  
  // Handle silent 'e'
  if (word.endsWith('e')) {
    syllableCount--
  }
  
  return Math.max(1, syllableCount)
}

export function performSEOAnalysis(content: SEOContent): SEOAnalysisResult {
  const issues: SEOIssue[] = []
  const recommendations: SEORecommendation[] = []
  let score = 100

  // Analyze title
  if (!content.title) {
    issues.push({
      id: 'missing-title',
      type: 'error',
      category: 'Title',
      title: 'Missing page title',
      description: 'Every page should have a unique, descriptive title.',
      impact: 'high',
      fixable: true
    })
    score -= 20
  } else if (content.title.length < 30) {
    issues.push({
      id: 'short-title',
      type: 'warning',
      category: 'Title',
      title: 'Title too short',
      description: 'Title should be at least 30 characters for better SEO.',
      impact: 'medium',
      fixable: true
    })
    score -= 10
  } else if (content.title.length > 60) {
    issues.push({
      id: 'long-title',
      type: 'warning',
      category: 'Title',
      title: 'Title too long',
      description: 'Title may be truncated in search results. Keep it under 60 characters.',
      impact: 'medium',
      fixable: true
    })
    score -= 5
  }

  // Analyze meta description
  if (!content.description) {
    issues.push({
      id: 'missing-description',
      type: 'error',
      category: 'Meta Description',
      title: 'Missing meta description',
      description: 'Meta description helps search engines understand your content.',
      impact: 'high',
      fixable: true
    })
    score -= 15
  } else if (content.description.length < 120) {
    recommendations.push({
      id: 'expand-description',
      title: 'Expand meta description',
      description: 'Consider expanding your meta description to 120-160 characters for better visibility.',
      priority: 'medium',
      effort: 'easy',
      impact: 'medium'
    })
  } else if (content.description.length > 160) {
    issues.push({
      id: 'long-description',
      type: 'warning',
      category: 'Meta Description',
      title: 'Meta description too long',
      description: 'Description may be truncated in search results. Keep it under 160 characters.',
      impact: 'medium',
      fixable: true
    })
    score -= 5
  }

  // Analyze content
  if (content.content) {
    const wordCount = content.content.split(/\s+/).length
    if (wordCount < 300) {
      recommendations.push({
        id: 'increase-content',
        title: 'Increase content length',
        description: 'Pages with 300+ words typically perform better in search results.',
        priority: 'medium',
        effort: 'medium',
        impact: 'high'
      })
    }
  }

  // Analyze slug
  if (content.slug && content.slug.length > 5) {
    const slugWords = content.slug.split('-').length
    if (slugWords > 5) {
      recommendations.push({
        id: 'shorten-slug',
        title: 'Shorten URL slug',
        description: 'Shorter URLs are more user-friendly and easier to share.',
        priority: 'low',
        effort: 'easy',
        impact: 'low'
      })
    }
  }

  // Calculate metrics
  const metrics: SEOMetrics = {
    titleLength: content.title?.length || 0,
    descriptionLength: content.description?.length || 0,
    headingStructure: {
      h1Count: (content.content?.match(/<h1/g) || []).length,
      h2Count: (content.content?.match(/<h2/g) || []).length,
      h3Count: (content.content?.match(/<h3/g) || []).length,
    },
    imageCount: (content.content?.match(/<img/g) || []).length,
    imagesWithAlt: (content.content?.match(/<img[^>]+alt=/g) || []).length,
    linkCount: (content.content?.match(/<a/g) || []).length,
    internalLinks: calculateInternalLinks(content.content || ''),
    externalLinks: calculateExternalLinks(content.content || ''),
    wordCount: content.content?.split(/\s+/).length || 0,
    readabilityScore: calculateReadabilityScore(content.content || '')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
    metrics
  }
}