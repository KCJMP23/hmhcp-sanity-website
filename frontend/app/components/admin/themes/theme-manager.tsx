/**
 * Theme Manager Component - Theme marketplace and management interface
 * Healthcare-focused theme management with organization context
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Settings, 
  Shield, 
  Eye,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { ThemeDefinition } from '@/types/themes/theme-types';

interface ThemeManagerProps {
  organizationId: string;
  onThemeChange?: (themeId: string) => void;
}

export function ThemeManager({ organizationId, onThemeChange }: ThemeManagerProps) {
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [healthcareFilter, setHealthcareFilter] = useState(false);
  const [accessibilityFilter, setAccessibilityFilter] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    loadThemes();
  }, [organizationId]);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/themes?organization_id=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load themes');
      }

      const data = await response.json();
      setThemes(data.themes || []);
      setActiveTheme(data.active_theme || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const installTheme = async (themeId: string) => {
    try {
      setInstalling(themeId);
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme_id: themeId,
          organization_id: organizationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to install theme');
      }

      await loadThemes();
      onThemeChange?.(themeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install theme');
    } finally {
      setInstalling(null);
    }
  };

  const switchTheme = async (themeId: string) => {
    try {
      const response = await fetch('/api/admin/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme_id: themeId,
          organization_id: organizationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch theme');
      }

      await loadThemes();
      onThemeChange?.(themeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch theme');
    }
  };

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || theme.theme_type === categoryFilter;
    const matchesHealthcare = !healthcareFilter || theme.healthcare_compliance.hipaa_compliant;
    const matchesAccessibility = !accessibilityFilter || theme.accessibility_compliant;

    return matchesSearch && matchesCategory && matchesHealthcare && matchesAccessibility;
  });

  const getComplianceBadges = (theme: ThemeDefinition) => {
    const badges = [];
    
    if (theme.healthcare_compliance.hipaa_compliant) {
      badges.push(
        <Badge key="hipaa" variant="default" className="bg-green-100 text-green-800">
          <Shield className="w-3 h-3 mr-1" />
          HIPAA
        </Badge>
      );
    }
    
    if (theme.accessibility_compliant) {
      badges.push(
        <Badge key="accessibility" variant="default" className="bg-blue-100 text-blue-800">
          <Eye className="w-3 h-3 mr-1" />
          Accessible
        </Badge>
      );
    }
    
    if (theme.healthcare_compliance.fda_compliant) {
      badges.push(
        <Badge key="fda" variant="default" className="bg-purple-100 text-purple-800">
          FDA
        </Badge>
      );
    }

    return badges;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Theme Manager</h2>
          <p className="text-gray-600">Manage and customize your organization's theme</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Active Theme */}
      {activeTheme && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Active Theme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{activeTheme.name}</h3>
                <p className="text-sm text-gray-600">{activeTheme.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getComplianceBadges(activeTheme)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="white-label">White-Label</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={healthcareFilter}
                  onChange={(e) => setHealthcareFilter(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Healthcare Compliant</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={accessibilityFilter}
                  onChange={(e) => setAccessibilityFilter(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Accessible</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <Card key={theme.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {theme.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">{theme.rating.toFixed(1)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Compliance Badges */}
                <div className="flex flex-wrap gap-2">
                  {getComplianceBadges(theme)}
                </div>

                {/* Theme Info */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Author: {theme.author}</div>
                  <div>Version: {theme.version}</div>
                  <div>Installs: {theme.installation_count.toLocaleString()}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {activeTheme?.id === theme.id ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => switchTheme(theme.id)}
                      disabled={installing === theme.id}
                      className="flex-1"
                    >
                      {installing === theme.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {installing === theme.id ? 'Installing...' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No themes found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
