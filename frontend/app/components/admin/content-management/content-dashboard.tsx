'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { AppleButton } from '@/components/ui/apple-button';
import { FrostedCard, FrostedCardContent } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  Settings, 
  BarChart3, 
  FileText, 
  Globe,
  Sparkles,
  Users,
  Calendar
} from 'lucide-react';

const ContentDashboard: React.FC = () => {
  const { aiContent, localization, userManagement, analytics } = useCoreIntegration();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedContentType, setSelectedContentType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const [contentStats] = useState({
    totalContent: 1247,
    publishedContent: 1189,
    draftContent: 58,
    aiGenerated: 342,
    multiLanguage: 156,
    thisMonth: 89,
    lastMonth: 76
  });

  const [recentActivity] = useState([
    { id: 1, type: 'blog_post', title: 'Healthcare Innovation Trends 2024', author: 'Dr. Sarah Johnson', status: 'published', date: '2024-01-15' },
    { id: 2, type: 'page', title: 'Patient Care Guidelines', author: 'Admin Team', status: 'draft', date: '2024-01-14' },
    { id: 3, type: 'email', title: 'Monthly Newsletter', author: 'Marketing Team', status: 'published', date: '2024-01-13' },
    { id: 4, type: 'social_media', title: 'Wellness Tips', author: 'AI Assistant', status: 'published', date: '2024-01-12' }
  ]);

  useEffect(() => {
    // Initialize analytics tracking
    analytics.trackPageView('/admin/content-management');
    analytics.trackEvent('admin_dashboard_viewed', { section: 'content_management' });
  }, [analytics]);

  const handleCreateContent = (type: string) => {
    console.log('Creating new content of type:', type);
    // Navigate to content creation form
  };

  const handleEditContent = (contentId: number) => {
    console.log('Editing content:', contentId);
    // Navigate to content editor
  };

  const handleDeleteContent = (contentId: number) => {
    console.log('Deleting content:', contentId);
    // Show confirmation dialog and delete
  };

  const handleViewContent = (contentId: number) => {
    console.log('Viewing content:', contentId);
    // Navigate to content viewer
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="display" className="text-gray-900">Content Management</Typography>
          <Typography variant="body" className="text-gray-600">Manage all content types, AI generation, and multi-language support</Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline" onClick={() => setActiveTab('ai-generation')}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generation
          </AppleButton>
          <AppleButton variant="outline" onClick={() => setActiveTab('languages')}>
            <Globe className="h-4 w-4 mr-2" />
            Languages
          </AppleButton>
          <AppleButton onClick={() => handleCreateContent('blog_post')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </AppleButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <Typography variant="label" className="text-gray-700">Total Content</Typography>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {contentStats.totalContent}
            </Typography>
            <Typography variant="small" className="text-blue-600">
              +{contentStats.thisMonth} this month
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <Typography variant="label" className="text-gray-700">Published</Typography>
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {contentStats.publishedContent}
            </Typography>
            <Typography variant="small" className="text-green-600">
              {Math.round((contentStats.publishedContent / contentStats.totalContent) * 100)}% of total
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <Typography variant="label" className="text-gray-700">AI Generated</Typography>
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {contentStats.aiGenerated}
            </Typography>
            <Typography variant="small" className="text-purple-600">
              {Math.round((contentStats.aiGenerated / contentStats.totalContent) * 100)}% of total
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <Typography variant="label" className="text-gray-700">Multi-language</Typography>
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {contentStats.multiLanguage}
            </Typography>
            <Typography variant="small" className="text-orange-600">
              {Math.round((contentStats.multiLanguage / contentStats.totalContent) * 100)}% of total
            </Typography>
          </div>
        </FrostedCard>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ai-generation">AI Generation</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest content updates and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.author} • {activity.type}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewContent(activity.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditContent(activity.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Common content management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleCreateContent('blog_post')}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Blog Post</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleCreateContent('page')}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Page</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleCreateContent('email')}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Email</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => handleCreateContent('social_media')}>
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Social Media</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Library</CardTitle>
              <CardDescription>Manage all your content in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-4">
                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="blog_post">Blog Posts</SelectItem>
                    <SelectItem value="page">Pages</SelectItem>
                    <SelectItem value="email">Emails</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.type === 'blog_post' ? 'bg-blue-100 text-blue-800' :
                        activity.type === 'page' ? 'bg-green-100 text-green-800' :
                        activity.type === 'email' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {activity.type.replace('_', ' ')}
                      </div>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.author} • {activity.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={activity.status === 'published' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleViewContent(activity.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditContent(activity.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteContent(activity.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generation Tab */}
        <TabsContent value="ai-generation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>AI Content Generation</span>
              </CardTitle>
              <CardDescription>Create content using AI-powered templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiContent.templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{template.content_type}</Badge>
                          {template.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {template.prompt_template.substring(0, 100)}...
                        </p>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1" onClick={() => handleCreateContent(template.content_type)}>
                            Use Template
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Language Management</span>
              </CardTitle>
              <CardDescription>Configure multi-language support for your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localization.languages.map((language) => (
                  <Card key={language.code} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{language.native_name}</CardTitle>
                        {language.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <CardDescription>{language.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Direction:</span>
                          <Badge variant="outline">{language.direction}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge variant={language.is_active ? 'default' : 'secondary'}>
                            {language.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1" variant="outline">
                            Manage Translations
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Templates</CardTitle>
              <CardDescription>Manage and customize content templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Template management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Content Analytics</span>
              </CardTitle>
              <CardDescription>Track content performance and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentDashboard;
