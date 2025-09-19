// PublicationAnalytics Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Users, FileText, Award, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicationAnalyticsSummary, PublicationTrends } from '@/types/publications';

interface PublicationAnalyticsProps {
  analytics: any[];
  trends: PublicationTrends[];
  benchmarks: {
    metric_name: string;
    value: number;
  }[];
  summary: PublicationAnalyticsSummary;
}

export function PublicationAnalytics({
  analytics,
  trends,
  benchmarks,
  summary
}: PublicationAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName.toLowerCase()) {
      case 'citations':
        return <Award className="h-4 w-4" />;
      case 'publications':
        return <FileText className="h-4 w-4" />;
      case 'authors':
        return <Users className="h-4 w-4" />;
      case 'impact_factor':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const filteredTrends = selectedMetric === 'all' 
    ? trends 
    : trends.filter(trend => trend.metric_name.toLowerCase().includes(selectedMetric.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publication Analytics</h1>
          <p className="text-gray-600">Research impact and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Publications</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_publications)}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Published this year: </span>
              <span className="font-medium text-gray-900 ml-1">{formatNumber(summary.published_this_year)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Citations</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_citations)}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Avg per publication: </span>
              <span className="font-medium text-gray-900 ml-1">{formatNumber(summary.avg_citations_per_publication)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Publication Type</p>
                <p className="text-lg font-bold text-gray-900">
                  {summary.top_publication_type || 'N/A'}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Most common type</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Author</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {summary.top_author_name || 'N/A'}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Publications: </span>
              <span className="font-medium text-gray-900 ml-1">{formatNumber(summary.top_author_publications)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Trends
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="citations">Citations</SelectItem>
                  <SelectItem value="publications">Publications</SelectItem>
                  <SelectItem value="impact">Impact Factor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTrends.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No trend data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(trend.metric_name)}
                        <span className="font-medium text-gray-900">{trend.metric_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(trend.trend_direction)}
                        <span className={`text-sm font-medium ${getTrendColor(trend.trend_direction)}`}>
                          {trend.trend_direction || 'Stable'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {trend.data_points.slice(0, 5).map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(point.date).toLocaleDateString()}</span>
                          <span className="font-medium">{formatNumber(point.value)}</span>
                        </div>
                      ))}
                      {trend.data_points.length > 5 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{trend.data_points.length - 5} more data points
                        </div>
                      )}
                    </div>
                    
                    {trend.benchmark_value && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Benchmark:</span>
                          <span className="font-medium">{formatNumber(trend.benchmark_value)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Performance Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {benchmarks.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No benchmark data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {benchmarks.map((benchmark, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(benchmark.metric_name)}
                        <span className="font-medium text-gray-900">{benchmark.metric_name}</span>
                      </div>
                      <Badge variant="outline">{formatNumber(benchmark.value)}</Badge>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (benchmark.value / Math.max(...benchmarks.map(b => b.value))) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              analytics.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.metric_name}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.measurement_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(activity.metric_value)}
                    </span>
                    {getTrendIcon(activity.trend_direction)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
