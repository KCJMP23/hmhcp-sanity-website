'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  Heart,
  Stethoscope,
  Users,
  Scale,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Clock,
  Award,
  Settings,
  Download
} from 'lucide-react'

interface ComplianceCheck {
  id: string
  name: string
  category: 'hipaa' | 'medical-accuracy' | 'readability' | 'accessibility' | 'content-guidelines'
  status: 'passed' | 'failed' | 'warning' | 'pending'
  score?: number
  maxScore?: number
  details: string
  recommendations?: string[]
  lastChecked: string
}

interface ContentValidation {
  id: string
  contentId: string
  contentTitle: string
  contentType: 'article' | 'blog-post' | 'patient-education' | 'clinical-guideline'
  status: 'validating' | 'approved' | 'rejected' | 'requires-review'
  overallScore: number
  maxScore: number
  submittedAt: string
  completedAt?: string
  reviewer?: string
  checks: ComplianceCheck[]
  medicalAccuracy: {
    score: number
    confidence: number
    sources: string[]
    flaggedClaims: string[]
  }
  readabilityMetrics: {
    gradeLevel: number
    readingEase: number
    avgSentenceLength: number
    complexWords: number
  }
  complianceFlags: {
    hipaaCompliant: boolean
    fdaCompliant: boolean
    accessibilityCompliant: boolean
    ethicalGuidelines: boolean
  }
}

interface ComplianceMetrics {
  totalValidations: number
  approvalRate: number
  averageProcessingTime: number
  medicalAccuracyAverage: number
  readabilityAverage: number
  complianceViolations: number
  trendData: {
    date: string
    validations: number
    approvalRate: number
  }[]
}

export default function HealthcareComplianceMonitor() {
  const [validations, setValidations] = useState<ContentValidation[]>([])
  const [selectedValidation, setSelectedValidation] = useState<ContentValidation | null>(null)
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockValidations: ContentValidation[] = [
      {
        id: 'val-1',
        contentId: 'content-123',
        contentTitle: 'Understanding Heart Disease: Risk Factors and Prevention',
        contentType: 'article',
        status: 'validating',
        overallScore: 87,
        maxScore: 100,
        submittedAt: '2025-01-20T10:30:00Z',
        checks: [
          {
            id: 'check-1',
            name: 'HIPAA Compliance',
            category: 'hipaa',
            status: 'passed',
            score: 100,
            maxScore: 100,
            details: 'Content does not contain any protected health information (PHI)',
            lastChecked: '2025-01-20T10:35:00Z'
          },
          {
            id: 'check-2',
            name: 'Medical Accuracy',
            category: 'medical-accuracy',
            status: 'passed',
            score: 92,
            maxScore: 100,
            details: 'Medical claims verified against peer-reviewed sources',
            recommendations: ['Consider adding more recent studies (2024)'],
            lastChecked: '2025-01-20T10:40:00Z'
          },
          {
            id: 'check-3',
            name: 'Readability Assessment',
            category: 'readability',
            status: 'warning',
            score: 78,
            maxScore: 100,
            details: 'Reading level slightly above target (9th grade vs 8th grade target)',
            recommendations: [
              'Simplify medical terminology',
              'Break down complex sentences',
              'Add more explanatory text for technical terms'
            ],
            lastChecked: '2025-01-20T10:42:00Z'
          }
        ],
        medicalAccuracy: {
          score: 92,
          confidence: 95,
          sources: [
            'American Heart Association Guidelines 2024',
            'Journal of Cardiovascular Medicine',
            'NIH Heart Disease Prevention Guidelines'
          ],
          flaggedClaims: []
        },
        readabilityMetrics: {
          gradeLevel: 9.2,
          readingEase: 67.5,
          avgSentenceLength: 18.3,
          complexWords: 127
        },
        complianceFlags: {
          hipaaCompliant: true,
          fdaCompliant: true,
          accessibilityCompliant: true,
          ethicalGuidelines: true
        }
      },
      {
        id: 'val-2',
        contentId: 'content-124',
        contentTitle: 'Patient Guide: Managing Diabetes Daily',
        contentType: 'patient-education',
        status: 'approved',
        overallScore: 95,
        maxScore: 100,
        submittedAt: '2025-01-20T09:15:00Z',
        completedAt: '2025-01-20T09:47:00Z',
        reviewer: 'Dr. Sarah Johnson',
        checks: [
          {
            id: 'check-4',
            name: 'Medical Accuracy',
            category: 'medical-accuracy',
            status: 'passed',
            score: 98,
            maxScore: 100,
            details: 'Excellent clinical accuracy with current best practices',
            lastChecked: '2025-01-20T09:25:00Z'
          },
          {
            id: 'check-5',
            name: 'Patient Safety',
            category: 'content-guidelines',
            status: 'passed',
            score: 100,
            maxScore: 100,
            details: 'All safety warnings and disclaimers properly included',
            lastChecked: '2025-01-20T09:30:00Z'
          }
        ],
        medicalAccuracy: {
          score: 98,
          confidence: 99,
          sources: [
            'American Diabetes Association Standards 2024',
            'Diabetes Care Journal',
            'CDC Diabetes Guidelines'
          ],
          flaggedClaims: []
        },
        readabilityMetrics: {
          gradeLevel: 7.8,
          readingEase: 72.1,
          avgSentenceLength: 15.2,
          complexWords: 89
        },
        complianceFlags: {
          hipaaCompliant: true,
          fdaCompliant: true,
          accessibilityCompliant: true,
          ethicalGuidelines: true
        }
      }
    ]

    const mockMetrics: ComplianceMetrics = {
      totalValidations: 156,
      approvalRate: 94.2,
      averageProcessingTime: 24.5,
      medicalAccuracyAverage: 91.8,
      readabilityAverage: 8.1,
      complianceViolations: 3,
      trendData: [
        { date: '2025-01-13', validations: 12, approvalRate: 91.7 },
        { date: '2025-01-14', validations: 15, approvalRate: 93.3 },
        { date: '2025-01-15', validations: 18, approvalRate: 94.4 },
        { date: '2025-01-16', validations: 22, approvalRate: 95.5 },
        { date: '2025-01-17', validations: 19, approvalRate: 94.7 },
        { date: '2025-01-18', validations: 16, approvalRate: 93.8 },
        { date: '2025-01-19', validations: 20, approvalRate: 94.2 }
      ]
    }

    setValidations(mockValidations)
    setSelectedValidation(mockValidations[0])
    setMetrics(mockMetrics)
    setLoading(false)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
      case 'approved': return <Award className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      case 'validating': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'requires-review': return <Eye className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': 
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
      case 'requires-review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
      case 'validating': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hipaa': return <Shield className="h-4 w-4" />
      case 'medical-accuracy': return <Stethoscope className="h-4 w-4" />
      case 'readability': return <BookOpen className="h-4 w-4" />
      case 'accessibility': return <Users className="h-4 w-4" />
      case 'content-guidelines': return <FileCheck className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getReadabilityGrade = (score: number) => {
    if (score <= 6) return { label: 'Elementary', color: 'text-green-600' }
    if (score <= 8) return { label: 'Middle School', color: 'text-blue-600' }
    if (score <= 12) return { label: 'High School', color: 'text-yellow-600' }
    return { label: 'College', color: 'text-red-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading compliance monitoring...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Healthcare Compliance Monitor
          </h1>
          <p className="text-muted-foreground">
            Content validation, medical accuracy, and regulatory compliance tracking
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalValidations}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageProcessingTime}m</div>
            <p className="text-xs text-muted-foreground">
              -3.2m from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.complianceViolations}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validations">Active Validations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Checks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Medical Accuracy Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Accuracy Score</span>
                  <span className="font-semibold text-lg">{metrics?.medicalAccuracyAverage}/100</span>
                </div>
                <Progress value={metrics?.medicalAccuracyAverage} className="h-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Sources Verified</div>
                    <div className="text-muted-foreground">1,247 medical sources</div>
                  </div>
                  <div>
                    <div className="font-medium">Expert Reviews</div>
                    <div className="text-muted-foreground">89% physician approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Readability Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Reading Level</span>
                  <span className="font-semibold text-lg">{metrics?.readabilityAverage} Grade</span>
                </div>
                <Progress value={(12 - (metrics?.readabilityAverage || 0)) / 12 * 100} className="h-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Target Met</div>
                    <div className="text-muted-foreground">78% within target</div>
                  </div>
                  <div>
                    <div className="font-medium">Complexity Score</div>
                    <div className="text-muted-foreground">Low-Medium</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Validations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Validations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validations.slice(0, 5).map(validation => (
                  <div
                    key={validation.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedValidation(validation)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(validation.status)}
                      <div>
                        <div className="font-medium text-sm">{validation.contentTitle}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {validation.contentType.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">{validation.overallScore}/{validation.maxScore}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(validation.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(validation.status)}>
                        {validation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Validations Tab */}
        <TabsContent value="validations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Validations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {validations.map(validation => (
                      <div
                        key={validation.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedValidation?.id === validation.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedValidation(validation)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(validation.status)}
                            <div>
                              <div className="font-medium text-sm">{validation.contentTitle}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {validation.contentType.replace('-', ' ')}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(validation.status)}>
                            {validation.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Score: {validation.overallScore}/{validation.maxScore}</span>
                          <span>{new Date(validation.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <Progress 
                          value={(validation.overallScore / validation.maxScore) * 100} 
                          className="mt-2 h-1"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Validation Details */}
            {selectedValidation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedValidation.status)}
                      Validation Details
                    </div>
                    <Badge className={getStatusColor(selectedValidation.status)}>
                      {selectedValidation.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm mb-2">{selectedValidation.contentTitle}</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Content Type: </span>
                        <span className="capitalize">{selectedValidation.contentType.replace('-', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted: </span>
                        <span>{new Date(selectedValidation.submittedAt).toLocaleString()}</span>
                      </div>
                      {selectedValidation.reviewer && (
                        <div>
                          <span className="text-muted-foreground">Reviewer: </span>
                          <span>{selectedValidation.reviewer}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-semibold">
                        {selectedValidation.overallScore}/{selectedValidation.maxScore}
                      </span>
                    </div>
                    <Progress 
                      value={(selectedValidation.overallScore / selectedValidation.maxScore) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Individual Checks */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Compliance Checks</h4>
                    {selectedValidation.checks.map(check => (
                      <div key={check.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(check.category)}
                            <span className="font-medium text-sm">{check.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {check.score && (
                              <span className="text-sm font-medium">
                                {check.score}/{check.maxScore}
                              </span>
                            )}
                            <Badge className={`text-xs ${getStatusColor(check.status)}`}>
                              {check.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {check.details}
                        </p>
                        {check.score && check.maxScore && (
                          <Progress 
                            value={(check.score / check.maxScore) * 100} 
                            className="h-1 mb-2"
                          />
                        )}
                        {check.recommendations && check.recommendations.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium mb-1">Recommendations:</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {check.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <span>•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Medical Accuracy Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Medical Accuracy Analysis
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Accuracy Score:</span>
                        <span className="font-medium">{selectedValidation.medicalAccuracy.score}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Confidence Level:</span>
                        <span className="font-medium">{selectedValidation.medicalAccuracy.confidence}%</span>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium mb-1">Verified Sources:</div>
                        <ul className="text-muted-foreground space-y-1">
                          {selectedValidation.medicalAccuracy.sources.map((source, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{source}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Readability Metrics */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Readability Analysis
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-medium">Reading Level</div>
                          <div className={getReadabilityGrade(selectedValidation.readabilityMetrics.gradeLevel).color}>
                            Grade {selectedValidation.readabilityMetrics.gradeLevel} 
                            ({getReadabilityGrade(selectedValidation.readabilityMetrics.gradeLevel).label})
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Reading Ease</div>
                          <div className="text-muted-foreground">
                            {selectedValidation.readabilityMetrics.readingEase}/100
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Avg Sentence Length</div>
                          <div className="text-muted-foreground">
                            {selectedValidation.readabilityMetrics.avgSentenceLength} words
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Complex Words</div>
                          <div className="text-muted-foreground">
                            {selectedValidation.readabilityMetrics.complexWords}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Compliance Checks Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  HIPAA Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Audit</span>
                    <span className="text-sm text-muted-foreground">Jan 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Violations</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Scale className="h-4 w-4" />
                  FDA Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Review</span>
                    <span className="text-sm text-muted-foreground">Jan 18, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Issues</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">WCAG 2.1 AA</span>
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Test</span>
                    <span className="text-sm text-muted-foreground">Jan 19, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Score</span>
                    <span className="text-sm font-medium">98/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4" />
                  Content Ethics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Guidelines</span>
                    <Badge className="bg-green-100 text-green-800">Met</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Review</span>
                    <span className="text-sm text-muted-foreground">Jan 20, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Flags</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Violations Alert */}
          {(metrics?.complianceViolations || 0) > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Compliance Violations Detected</AlertTitle>
              <AlertDescription>
                {metrics?.complianceViolations} content items require immediate attention for compliance violations.
                <Button size="sm" className="ml-2">
                  Review Now
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Compliance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics and trend charts will be displayed here</p>
                <p className="text-sm mt-2">
                  Including approval rate trends, processing time analytics, and compliance score distributions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}