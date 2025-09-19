'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SEORecommendation } from '../types'
import { 
  Lightbulb, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Zap,
  Filter
} from 'lucide-react'

interface RecommendationsProps {
  recommendations: SEORecommendation[]
  onApply?: (recommendation: SEORecommendation) => void
}

export function Recommendations({ recommendations, onApply }: RecommendationsProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  
  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true
    return rec.priority === filter
  })
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Lightbulb className="w-4 h-4 text-blue-500" />
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
    }
  }
  
  const getImpactStars = (impact: 'high' | 'medium' | 'low') => {
    const impactMap = {
      high: 5,
      medium: 3,
      low: 1
    }
    const stars = impactMap[impact] || 1
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }
  
  const handleApply = (recommendation: SEORecommendation) => {
    setApplied(prev => new Set(prev).add(recommendation.id))
    if (onApply) {
      onApply(recommendation)
    }
  }
  
  const countByPriority = {
    high: recommendations.filter(r => r.priority === 'high').length,
    medium: recommendations.filter(r => r.priority === 'medium').length,
    low: recommendations.filter(r => r.priority === 'low').length,
  }
  
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            SEO Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            Great job! No SEO improvements needed at this time.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            SEO Recommendations
          </CardTitle>
          <Badge variant="outline">
            {recommendations.length} suggestions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              All ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="high" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              High ({countByPriority.high})
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Med ({countByPriority.medium})
            </TabsTrigger>
            <TabsTrigger value="low" className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Low ({countByPriority.low})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={filter} className="mt-4 space-y-3">
            {filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`border  p-4 transition-all ${
                  applied.has(recommendation.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {applied.has(recommendation.id) ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      getPriorityIcon(recommendation.priority)
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{recommendation.issue}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {recommendation.suggestion}
                        </p>
                      </div>
                      {getPriorityBadge(recommendation.priority)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Category: {recommendation.category}</span>
                        <span className="text-gray-500">
                          Impact: <span className="text-blue-600">{getImpactStars(recommendation.impact)}</span>
                        </span>
                      </div>
                      
                      {!applied.has(recommendation.id) && recommendation.autoFixable && (
                        <Button
                          size="sm"
                          onClick={() => handleApply(recommendation)}
                          className="gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Quick Fix
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
        
        {filteredRecommendations.length === 0 && (
          <p className="text-center py-8 text-gray-500">
            No recommendations in this category.
          </p>
        )}
        
        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-sm font-medium mb-3">Potential Score Improvement</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total possible improvement</span>
              <span className="font-medium text-blue-600">
                +{recommendations.reduce((sum, rec) => {
                  const impactValue = { high: 30, medium: 20, low: 10 }[rec.impact] || 0
                  return sum + impactValue
                }, 0)} points
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Applied improvements</span>
              <span className="font-medium">
                +{recommendations
                  .filter(rec => applied.has(rec.id))
                  .reduce((sum, rec) => {
                    const impactValue = { high: 30, medium: 20, low: 10 }[rec.impact] || 0
                    return sum + impactValue
                  }, 0)} points
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}