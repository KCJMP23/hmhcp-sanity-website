/**
 * API Rate Limiting Management Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Activity, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface QuotaUsage {
  organizationId: string;
  currentUsage: {
    monthly: number;
    daily: number;
    hourly: number;
    burst: number;
  };
  limits: {
    monthly: number;
    daily: number;
    hourly: number;
    burst: number;
  };
  healthcarePriority: boolean;
  emergencyOverride: boolean;
}

export default function RateLimitingComponent() {
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotaUsage();
  }, []);

  const loadQuotaUsage = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setQuotaUsage({
        organizationId: 'org-123',
        currentUsage: {
          monthly: 45000,
          daily: 2000,
          hourly: 150,
          burst: 25
        },
        limits: {
          monthly: 100000,
          daily: 5000,
          hourly: 500,
          burst: 100
        },
        healthcarePriority: true,
        emergencyOverride: true
      });
    } catch (err) {
      setError('Failed to load quota usage');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Rate Limiting</h2>
          <p className="text-gray-600">Manage API quotas and rate limiting for your organization</p>
        </div>
        <div className="flex items-center space-x-2">
          {quotaUsage?.healthcarePriority && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Healthcare Priority
            </Badge>
          )}
          {quotaUsage?.emergencyOverride && (
            <Badge variant="secondary">
              Emergency Override
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Current Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Current Usage
            </CardTitle>
            <CardDescription>
              Real-time API usage across all time windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Burst Limit</Label>
                  <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(quotaUsage?.currentUsage.burst || 0, quotaUsage?.limits.burst || 1))}`}>
                    {quotaUsage?.currentUsage.burst || 0} / {quotaUsage?.limits.burst || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(quotaUsage?.currentUsage.burst || 0, quotaUsage?.limits.burst || 1)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">1 minute window</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Hourly Limit</Label>
                  <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(quotaUsage?.currentUsage.hourly || 0, quotaUsage?.limits.hourly || 1))}`}>
                    {quotaUsage?.currentUsage.hourly || 0} / {quotaUsage?.limits.hourly || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(quotaUsage?.currentUsage.hourly || 0, quotaUsage?.limits.hourly || 1)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">1 hour window</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Daily Limit</Label>
                  <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(quotaUsage?.currentUsage.daily || 0, quotaUsage?.limits.daily || 1))}`}>
                    {quotaUsage?.currentUsage.daily || 0} / {quotaUsage?.limits.daily || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(quotaUsage?.currentUsage.daily || 0, quotaUsage?.limits.daily || 1)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">24 hour window</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Monthly Limit</Label>
                  <span className={`text-sm font-bold ${getUsageColor(getUsagePercentage(quotaUsage?.currentUsage.monthly || 0, quotaUsage?.limits.monthly || 1))}`}>
                    {quotaUsage?.currentUsage.monthly || 0} / {quotaUsage?.limits.monthly || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${getUsagePercentage(quotaUsage?.currentUsage.monthly || 0, quotaUsage?.limits.monthly || 1)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">30 day window</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Rate Limiting Configuration
            </CardTitle>
            <CardDescription>
              Configure rate limiting rules and quotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tier">Organization Tier</Label>
                  <Select defaultValue="healthcare">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="healthcare-priority" defaultChecked />
                  <Label htmlFor="healthcare-priority">Healthcare Priority</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="burst-limit">Burst Limit</Label>
                  <Input
                    id="burst-limit"
                    type="number"
                    defaultValue="100"
                    placeholder="Requests per minute"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly-limit">Hourly Limit</Label>
                  <Input
                    id="hourly-limit"
                    type="number"
                    defaultValue="5000"
                    placeholder="Requests per hour"
                  />
                </div>
                <div>
                  <Label htmlFor="daily-limit">Daily Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    defaultValue="50000"
                    placeholder="Requests per day"
                  />
                </div>
                <div>
                  <Label htmlFor="monthly-limit">Monthly Limit</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    defaultValue="1000000"
                    placeholder="Requests per month"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="emergency-override" defaultChecked />
                  <Label htmlFor="emergency-override">Emergency Override</Label>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Configuration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Usage Analytics
            </CardTitle>
            <CardDescription>
              API usage patterns and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics data will be displayed here</p>
              <p className="text-sm">Real-time metrics and historical trends</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
