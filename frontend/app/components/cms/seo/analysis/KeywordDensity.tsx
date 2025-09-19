'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Hash, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KeywordDensityProps {
  keywords: string[]
  density: Record<string, number>
  content: string
}

export function KeywordDensity({ keywords, density, content }: KeywordDensityProps) {
  const getOptimalRange = () => ({ min: 0.5, max: 2.5 })
  
  const getDensityStatus = (value: number) => {
    const { min, max } = getOptimalRange()
    if (value < min) return { status: 'low', color: 'text-blue-600', icon: TrendingDown }
    if (value > max) return { status: 'high', color: 'text-red-600', icon: TrendingUp }
    return { status: 'optimal', color: 'text-blue-600', icon: Minus }
  }
  
  const getDensityBadge = (value: number) => {
    const { status } = getDensityStatus(value)
    if (status === 'low') return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
    if (status === 'high') return <Badge className="bg-red-100 text-red-800">High</Badge>
    return <Badge className="bg-blue-100 text-blue-600">Optimal</Badge>
  }
  
  const calculateSuggestions = (keyword: string, currentDensity: number) => {
    const { min, max } = getOptimalRange()
    const wordCount = content.split(/\s+/).length
    const currentOccurrences = Math.round((currentDensity / 100) * wordCount)
    
    if (currentDensity < min) {
      const targetOccurrences = Math.ceil((min / 100) * wordCount)
      const needed = targetOccurrences - currentOccurrences
      return {
        type: 'add',
        count: needed,
        message: `Add ${needed} more occurrence${needed > 1 ? 's' : ''} of "${keyword}"`
      }
    }
    
    if (currentDensity > max) {
      const targetOccurrences = Math.floor((max / 100) * wordCount)
      const excess = currentOccurrences - targetOccurrences
      return {
        type: 'remove',
        count: excess,
        message: `Remove ${excess} occurrence${excess > 1 ? 's' : ''} of "${keyword}"`
      }
    }
    
    return null
  }
  
  if (keywords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Keyword Density
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            No keywords defined. Add target keywords in the Basic SEO tab.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="w-5 h-5" />
          Keyword Density Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Optimal keyword density range: <span className="font-medium">0.5% - 2.5%</span>
          </p>
        </div>
        
        {keywords.map((keyword) => {
          const currentDensity = density[keyword] || 0
          const { status, color, icon: Icon } = getDensityStatus(currentDensity)
          const suggestion = calculateSuggestions(keyword, currentDensity)
          
          return (
            <div key={keyword} className="space-y-2 p-4 border">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{keyword}</h4>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  {getDensityBadge(currentDensity)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current Density</span>
                  <span className={`font-medium ${color}`}>{currentDensity.toFixed(2)}%</span>
                </div>
                
                <Progress 
                  value={Math.min(currentDensity * 20, 100)} 
                  className="h-2"
                />
              </div>
              
              {suggestion && (
                <div className={`text-sm p-2  ${
                  suggestion.type === 'add' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'bg-red-50 text-red-700 dark:bg-blue-900/20 dark:text-blue-300'
                }`}>
                  {suggestion.message}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Keyword Density Tips
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Use keywords naturally in your content</li>
            <li>• Include variations and synonyms</li>
            <li>• Place keywords in headings and early paragraphs</li>
            <li>• Avoid keyword stuffing (over-optimization)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}