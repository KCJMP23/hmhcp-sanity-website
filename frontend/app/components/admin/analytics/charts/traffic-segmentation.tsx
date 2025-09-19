'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  AcademicCapIcon,
  HeartIcon,
  UserIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ClockIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'
import { TrafficSegmentationData, MedicalTerminologyStats } from '@/types/blog-analytics'

interface TrafficSegmentationProps {
  segmentationData: TrafficSegmentationData
  terminologyStats: MedicalTerminologyStats[]
  className?: string
}

export function TrafficSegmentation({ 
  segmentationData, 
  terminologyStats, 
  className = '' 
}: TrafficSegmentationProps) {
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'healthcare_professionals' | 'patients'>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Calculate segmentation insights
  const totalClassified = segmentationData.healthcare_professionals.percentage + 
                         segmentationData.patients.percentage
  const classificationAccuracy = segmentationData.classification_accuracy

  // Get trending specializations based on professional engagement
  const trendingSpecializations = Object.entries(segmentationData.healthcare_professionals.specializations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([specialty, count]) => ({
      specialty: specialty.charAt(0).toUpperCase() + specialty.slice(1),
      count,
      trend: Math.random() > 0.5 ? 'up' : 'down', // This would come from real data comparison
      growth: Math.floor(Math.random() * 20) + 5, // Percentage growth
    }))

  // Top medical terms by engagement
  const topTermsBySegment = terminologyStats
    .filter(term => selectedSegment === 'all' || 
      (selectedSegment === 'healthcare_professionals' && term.professional_engagement > term.patient_engagement) ||
      (selectedSegment === 'patients' && term.patient_engagement > term.professional_engagement)
    )
    .sort((a, b) => b.total_interactions - a.total_interactions)
    .slice(0, 8)

  const segmentColors = {
    healthcare_professionals: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    patients: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    all: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Segment Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Healthcare Traffic Segmentation</h2>
        <div className="flex gap-2">
          <Button
            variant={selectedSegment === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSegment('all')}
            className="flex items-center gap-2"
          >
            <ChartBarIcon className="h-4 w-4" />
            All Visitors
          </Button>
          <Button
            variant={selectedSegment === 'healthcare_professionals' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSegment('healthcare_professionals')}
            className="flex items-center gap-2"
          >
            <AcademicCapIcon className="h-4 w-4" />
            Professionals
          </Button>
          <Button
            variant={selectedSegment === 'patients' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSegment('patients')}
            className="flex items-center gap-2"
          >
            <HeartIcon className="h-4 w-4" />
            Patients
          </Button>
        </div>
      </div>

      {/* Segmentation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {segmentationData.healthcare_professionals.percentage}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Healthcare Professionals</p>
                <div className="flex items-center gap-1 mt-1">
                  {segmentationData.healthcare_professionals.trend === 'up' ? 
                    <TrendingUpIcon className="h-3 w-3 text-green-500" /> :
                    <TrendingDownIcon className="h-3 w-3 text-red-500" />
                  }
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <HeartIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {segmentationData.patients.percentage}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Patients & General Public</p>
                <div className="flex items-center gap-1 mt-1">
                  {segmentationData.patients.trend === 'up' ? 
                    <TrendingUpIcon className="h-3 w-3 text-green-500" /> :
                    <TrendingDownIcon className="h-3 w-3 text-red-500" />
                  }
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(classificationAccuracy)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Classification Accuracy</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalClassified}% classified visitors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Segmentation & Medical Specializations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BeakerIcon className="h-5 w-5" />
              Trending Medical Specializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendingSpecializations.map((spec, index) => (
                <div key={spec.specialty} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {spec.specialty}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {spec.count} healthcare professionals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {spec.trend === 'up' ? 
                        <TrendingUpIcon className="h-4 w-4 text-green-500" /> :
                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      }
                      <span className={`text-sm font-medium ${
                        spec.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {spec.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Interest Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5" />
              Patient Common Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segmentationData.patients.common_interests.map((interest, index) => (
                <div key={interest} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      High patient engagement topic
                    </p>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Trending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Terminology Engagement by Segment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5" />
            Medical Terminology Engagement
            <Badge variant="outline" className="ml-2">
              {selectedSegment === 'all' ? 'All Visitors' : 
               selectedSegment === 'healthcare_professionals' ? 'Healthcare Professionals' : 
               'Patients & General Public'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topTermsBySegment.map((term, index) => (
              <div key={`${term.term}-${index}`} className={`p-4 rounded-lg border ${segmentColors[selectedSegment]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {term.term}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {term.category}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Interactions</span>
                    <span className="font-medium">{term.total_interactions.toLocaleString()}</span>
                  </div>

                  {selectedSegment === 'all' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 dark:text-blue-400">Professional Engagement</span>
                        <span className="font-medium">{term.professional_engagement}</span>
                      </div>
                      <Progress 
                        value={(term.professional_engagement / term.total_interactions) * 100} 
                        className="h-2 mb-1" 
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600 dark:text-red-400">Patient Engagement</span>
                        <span className="font-medium">{term.patient_engagement}</span>
                      </div>
                      <Progress 
                        value={(term.patient_engagement / term.total_interactions) * 100} 
                        className="h-2" 
                      />
                    </>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 dark:text-gray-400">Unique Visitors</span>
                    <span className="font-medium">{term.unique_visitors}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segmentation Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {segmentationData.healthcare_professionals.percentage}%
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Professional Readership
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Healthcare professionals make up the majority of engaged readers with higher time-on-page metrics
              </p>
            </div>

            <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                {segmentationData.patients.percentage}%
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Patient Interest
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Patients and general public show strong engagement with preventive care and wellness content
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Math.round(classificationAccuracy)}%
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                AI Classification Accuracy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our healthcare visitor classification system maintains high accuracy through behavioral analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}