'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { SEOMetaData, SEOMetaTagsProps, SEOHooksReturn, SEOAnalysisResult, SEOContent, TabType } from './types'
import { performSEOAnalysis } from './analysis-engine'

export function useSEOManagement({ data, onChange }: Pick<SEOMetaTagsProps, 'data' | 'onChange'>): SEOHooksReturn {
  const [activeTab, setActiveTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [keywordInput, setKeywordInput] = useState('')

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    onChange({
      ...data,
      [parent]: {
        ...(data[parent as keyof SEOMetaData] as any),
        [field]: value
      }
    })
  }

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const keywords = data.keywords || []
      updateField('keywords', [...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    const keywords = data.keywords || []
    updateField('keywords', keywords.filter((_, i) => i !== index))
  }

  const addCustomMeta = () => {
    const customMeta = data.customMeta || []
    updateField('customMeta', [...customMeta, { name: '', content: '' }])
  }

  const updateCustomMeta = (index: number, field: string, value: string) => {
    const customMeta = data.customMeta || []
    const updated = [...customMeta]
    updated[index] = { ...updated[index], [field]: value }
    updateField('customMeta', updated)
  }

  const removeCustomMeta = (index: number) => {
    const customMeta = data.customMeta || []
    updateField('customMeta', customMeta.filter((_, i) => i !== index))
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      logger.error('Failed to copy:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } })
    }
  }

  const generateMetaTags = () => {
    const tags: string[] = []
    
    // Basic meta tags
    if (data.title) tags.push(`<title>${data.title}</title>`)
    if (data.description) tags.push(`<meta name="description" content="${data.description}" />`)
    if (data.keywords?.length) tags.push(`<meta name="keywords" content="${data.keywords.join(', ')}" />`)
    if (data.canonicalUrl) tags.push(`<link rel="canonical" href="${data.canonicalUrl}" />`)
    
    // Robots
    if (data.robots) {
      const robotsContent = [
        data.robots.index ? 'index' : 'noindex',
        data.robots.follow ? 'follow' : 'nofollow',
        data.robots.archive ? 'archive' : 'noarchive',
        data.robots.snippet ? 'snippet' : 'nosnippet'
      ].join(', ')
      tags.push(`<meta name="robots" content="${robotsContent}" />`)
    }
    
    // Open Graph
    if (data.ogTitle) tags.push(`<meta property="og:title" content="${data.ogTitle}" />`)
    if (data.ogDescription) tags.push(`<meta property="og:description" content="${data.ogDescription}" />`)
    if (data.ogImage) tags.push(`<meta property="og:image" content="${data.ogImage}" />`)
    if (data.ogType) tags.push(`<meta property="og:type" content="${data.ogType}" />`)
    if (data.ogUrl) tags.push(`<meta property="og:url" content="${data.ogUrl}" />`)
    if (data.ogSiteName) tags.push(`<meta property="og:site_name" content="${data.ogSiteName}" />`)
    
    // Twitter Cards
    if (data.twitterCard) tags.push(`<meta name="twitter:card" content="${data.twitterCard}" />`)
    if (data.twitterTitle) tags.push(`<meta name="twitter:title" content="${data.twitterTitle}" />`)
    if (data.twitterDescription) tags.push(`<meta name="twitter:description" content="${data.twitterDescription}" />`)
    if (data.twitterImage) tags.push(`<meta name="twitter:image" content="${data.twitterImage}" />`)
    if (data.twitterSite) tags.push(`<meta name="twitter:site" content="${data.twitterSite}" />`)
    if (data.twitterCreator) tags.push(`<meta name="twitter:creator" content="${data.twitterCreator}" />`)
    
    // Custom meta tags
    data.customMeta?.forEach(meta => {
      if (meta.name && meta.content) {
        const attr = meta.property ? 'property' : 'name'
        const value = meta.property || meta.name
        tags.push(`<meta ${attr}="${value}" content="${meta.content}" />`)
      }
    })
    
    return tags.join('\n')
  }

  return {
    activeTab,
    setActiveTab,
    showPreview,
    setShowPreview,
    copiedField,
    setCopiedField,
    keywordInput,
    setKeywordInput,
    updateField,
    updateNestedField,
    addKeyword,
    removeKeyword,
    addCustomMeta,
    updateCustomMeta,
    removeCustomMeta,
    copyToClipboard,
    generateMetaTags,
  }
}

export function useSEOAnalyzer(content: SEOContent) {
  const [analysis, setAnalysis] = useState<SEOAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    if (content) {
      analyzeContent()
    }
  }, [content])

  const analyzeContent = async () => {
    setIsAnalyzing(true)
    
    try {
      // Perform real-time SEO analysis
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = performSEOAnalysis(content)
      setAnalysis(result)
    } catch (error) {
      logger.error('Error analyzing SEO:', { 
        error: error instanceof Error ? error : new Error(String(error)), 
        action: 'error_logged', 
        metadata: { error } 
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return {
    analysis,
    isAnalyzing,
    activeTab,
    setActiveTab,
    analyzeContent
  }
}