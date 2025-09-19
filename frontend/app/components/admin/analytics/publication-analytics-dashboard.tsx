"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Download, 
  ExternalLink, 
  Mail, 
  TrendingUp, 
  Users, 
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Building,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface AnalyticsOverview {
  total_views: number
  total_downloads: number
  total_journal_clicks: number
  total_pubmed_clicks: number
  total_leads: number
  completed_downloads: number
  unique_sessions: number
  completion_rate: string
}

interface TopPublication {
  publication_id: string
  publication_title: string
  publication_type: string
  views: number
  downloads: number
  journal_clicks: number
  pubmed_clicks: number
  unique_sessions: number
}

interface LeadStat {
  publication_id: string
  publication_title: string
  total_leads: number
  completed_downloads: number
  unique_companies: number
  completion_rate: string
  latest_lead: string
}

interface ConversionFunnel {
  publication_id: string
  publication_title: string
  views: number
  unique_viewers: number
  email_submissions: number
  completed_downloads: number
  conversion_rate_percent: number
  completion_rate_percent: number
}

interface TimeSeriesData {
  date: string
  views: number
  downloads: number
  leads: number
  completed_downloads: number
}

interface WhitepaperLead {
  name: string
  email: string
  company: string
  job_title: string
  created_at: string
  download_completed: boolean
}

interface AnalyticsData {
  success: boolean
  timeframe: string
  overview: AnalyticsOverview
  top_publications: TopPublication[]
  lead_stats: LeadStat[]
  conversion_funnel: ConversionFunnel[]
  time_series: TimeSeriesData[]
}

export default function PublicationAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30') // days
  const [selectedPublication, setSelectedPublication] = useState<string | null>(null)
  const [publicationDetails, setPublicationDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = selectedPublication 
        ? `/api/admin/publication-analytics?publication_id=${selectedPublication}&timeframe=${timeframe}`
        : `/api/admin/publication-analytics?timeframe=${timeframe}`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (selectedPublication) {
        setPublicationDetails(data)
      } else {
        setAnalyticsData(data)
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicationDetails = async (publicationId: string) => {
    try {
      setDetailsLoading(true)
      setSelectedPublication(publicationId)
      
      const response = await fetch(`/api/admin/publication-analytics?publication_id=${publicationId}&timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPublicationDetails(data)

    } catch (error) {
      console.error('Error fetching publication details:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch publication details')
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  useEffect(() => {
    if (selectedPublication) {
      fetchPublicationDetails(selectedPublication)
    }
  }, [selectedPublication, timeframe])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-red-700">Error Loading Analytics</h3>
          <p className="text-red-600">{error}</p>
        </div>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Publication Analytics</h1>
          <p className="text-gray-600">
            Track downloads, views, and lead generation from publications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedPublication ? 'details' : 'overview'} className="space-y-6">
        <TabsList>
          <TabsTrigger 
            value="overview"
            onClick={() => setSelectedPublication(null)}
          >
            Overview
          </TabsTrigger>
          {selectedPublication && (
            <TabsTrigger value="details">
              Publication Details
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsData && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_views)}</p>
                        <p className="text-sm text-gray-600">Total Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Download className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_downloads)}</p>
                        <p className="text-sm text-gray-600">Downloads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.total_leads)}</p>
                        <p className="text-sm text-gray-600">Email Leads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.unique_sessions)}</p>
                        <p className="text-sm text-gray-600">Unique Sessions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Publications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Top Performing Publications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.top_publications.map((pub) => (
                      <div 
                        key={pub.publication_id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => fetchPublicationDetails(pub.publication_id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold line-clamp-2">{pub.publication_title}</h4>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <Badge variant="outline">{pub.publication_type}</Badge>
                              <span className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {formatNumber(pub.views)} views
                              </span>
                              <span className="flex items-center">
                                <Download className="w-4 h-4 mr-1" />
                                {formatNumber(pub.downloads)} downloads
                              </span>
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {formatNumber(pub.unique_sessions)} sessions
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Whitepaper Conversion Funnel */}
              {analyticsData.conversion_funnel && analyticsData.conversion_funnel.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Whitepaper Conversion Funnel</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.conversion_funnel.map((funnel) => (
                        <div key={funnel.publication_id} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3">{funnel.publication_title}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{formatNumber(funnel.views)}</p>
                              <p className="text-gray-600">Views</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{formatNumber(funnel.email_submissions)}</p>
                              <p className="text-gray-600">Email Submissions</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{formatNumber(funnel.completed_downloads)}</p>
                              <p className="text-gray-600">Completed Downloads</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">{funnel.conversion_rate_percent}%</p>
                              <p className="text-gray-600">Conversion Rate</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lead Statistics */}
              {analyticsData.lead_stats && analyticsData.lead_stats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>Lead Generation Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Publication</th>
                            <th className="text-center p-2">Total Leads</th>
                            <th className="text-center p-2">Completed</th>
                            <th className="text-center p-2">Companies</th>
                            <th className="text-center p-2">Completion Rate</th>
                            <th className="text-center p-2">Latest Lead</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.lead_stats.map((stat) => (
                            <tr key={stat.publication_id} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <div className="font-medium line-clamp-2">{stat.publication_title}</div>
                              </td>
                              <td className="text-center p-2">{formatNumber(stat.total_leads)}</td>
                              <td className="text-center p-2">{formatNumber(stat.completed_downloads)}</td>
                              <td className="text-center p-2">{formatNumber(stat.unique_companies)}</td>
                              <td className="text-center p-2">
                                <Badge variant={parseFloat(stat.completion_rate) > 80 ? "default" : "secondary"}>
                                  {stat.completion_rate}%
                                </Badge>
                              </td>
                              <td className="text-center p-2">{formatDate(stat.latest_lead)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {selectedPublication && publicationDetails && (
            <PublicationDetailsView 
              data={publicationDetails}
              onBack={() => setSelectedPublication(null)}
              loading={detailsLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Publication Details Component
interface PublicationDetailsViewProps {
  data: any
  onBack: () => void
  loading: boolean
}

function PublicationDetailsView({ data, onBack, loading }: PublicationDetailsViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Overview
        </Button>
        <Badge>{data.publication_id}</Badge>
      </div>

      {/* Event Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.event_counts || {}).map(([event, count]) => (
              <div key={event} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{count as number}</p>
                <p className="text-sm text-gray-600 capitalize">{event.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      {data.conversion_funnel && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.conversion_funnel.views || 0}</p>
                <p className="text-sm text-gray-600">Views</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data.conversion_funnel.email_submissions || 0}</p>
                <p className="text-sm text-gray-600">Email Submissions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">{data.conversion_funnel.completed_downloads || 0}</p>
                <p className="text-sm text-gray-600">Completed Downloads</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{data.conversion_funnel.conversion_rate_percent || 0}%</p>
                <p className="text-sm text-gray-600">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Leads */}
      {data.lead_analysis && data.lead_analysis.recent_leads && data.lead_analysis.recent_leads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lead_analysis.recent_leads.map((lead: WhitepaperLead, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{lead.name}</span>
                      {lead.download_completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    {lead.company && <p className="text-sm text-gray-500">{lead.company}</p>}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      {data.recent_events && data.recent_events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recent_events.slice(0, 10).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 text-sm border-b last:border-b-0">
                  <div className="flex items-center space-x-2">
                    {event.event_type === 'download' && <Download className="w-4 h-4 text-green-500" />}
                    {event.event_type === 'publication_view' && <Eye className="w-4 h-4 text-blue-500" />}
                    {event.event_type === 'journal_click' && <ExternalLink className="w-4 h-4 text-purple-500" />}
                    {event.event_type === 'pubmed_click' && <ExternalLink className="w-4 h-4 text-orange-500" />}
                    <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}