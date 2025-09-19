// Plugin Detail Page Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Download, 
  Shield, 
  Clock, 
  Users, 
  Code, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Heart,
  Share2,
  BookOpen,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { PluginDefinition, PluginReview } from '@/types/plugins/marketplace';

interface PluginDetailProps {
  pluginId: string;
  organizationId: string;
  onInstall?: (plugin: PluginDefinition) => void;
  onBack?: () => void;
}

export default function PluginDetail({ pluginId, organizationId, onInstall, onBack }: PluginDetailProps) {
  const [plugin, setPlugin] = useState<PluginDefinition | null>(null);
  const [reviews, setReviews] = useState<PluginReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'changelog' | 'support'>('overview');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    loadPluginDetails();
    loadReviews();
  }, [pluginId]);

  const loadPluginDetails = async () => {
    try {
      const response = await fetch(`/api/plugins/marketplace/plugin?id=${pluginId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlugin(data);
      } else {
        setError(data.error || 'Failed to load plugin details');
      }
    } catch (error) {
      setError('Failed to load plugin details');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/plugins/marketplace/reviews?plugin_id=${pluginId}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleInstall = async () => {
    if (!plugin) return;
    
    setIsInstalling(true);
    try {
      const response = await fetch('/api/plugins/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin_id: plugin.id,
          organization_id: organizationId
        })
      });

      if (response.ok) {
        onInstall?.(plugin);
      } else {
        const error = await response.json();
        setError(error.error || 'Installation failed');
      }
    } catch (error) {
      setError('Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getComplianceIcon = (type: string) => {
    switch (type) {
      case 'hipaa': return <Shield className="w-4 h-4 text-green-500" title="HIPAA Compliant" />;
      case 'fda': return <Shield className="w-4 h-4 text-blue-500" title="FDA Compliant" />;
      case 'cms': return <Shield className="w-4 h-4 text-purple-500" title="CMS Compliant" />;
      case 'jcaho': return <Shield className="w-4 h-4 text-orange-500" title="JCAHO Compliant" />;
      default: return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !plugin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error || 'Plugin not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{plugin.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {plugin.plugin_type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{plugin.description}</p>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                {renderStars(plugin.rating)}
                <span className="ml-2 text-sm text-gray-600">
                  {plugin.rating.toFixed(1)} ({plugin.installation_count} installs)
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                by {plugin.author}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Updated {new Date(plugin.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-red-500">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-500">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install Plugin
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Badges */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Healthcare Compliance</h3>
        <div className="flex items-center space-x-4">
          {plugin.healthcare_compliance?.hipaa && getComplianceIcon('hipaa')}
          {plugin.healthcare_compliance?.fda && getComplianceIcon('fda')}
          {plugin.healthcare_compliance?.cms && getComplianceIcon('cms')}
          {plugin.healthcare_compliance?.jcaho && getComplianceIcon('jcaho')}
          {plugin.compliance_certifications?.map((cert, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              {cert}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'changelog', label: 'Changelog', icon: Code },
              { id: 'support', label: 'Support', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plugin.manifest?.features?.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  )) || (
                    <div className="text-sm text-gray-500">No features listed</div>
                  )}
                </div>
              </div>

              {/* Healthcare Specializations */}
              {plugin.healthcare_specializations?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Healthcare Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {plugin.healthcare_specializations.map((specialization, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {specialization}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* API Endpoints */}
              {plugin.api_endpoints && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">API Endpoints</h3>
                  <div className="space-y-2">
                    {plugin.api_endpoints.rest?.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                            endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <span className="ml-3 font-mono text-sm">{endpoint.path}</span>
                        </div>
                        <span className="text-sm text-gray-500">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions */}
              {plugin.manifest?.permissions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(plugin.manifest.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <div className="flex items-center">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-gray-400" />
                            )
                          ) : (
                            <span className="text-sm text-gray-500">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reviews ({reviews.length})
                </h3>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Write Review
                </button>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {review.verified_install ? 'Verified Install' : 'User Review'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-gray-700">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Be the first to review this plugin.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Changelog</h3>
              <div className="text-sm text-gray-500">
                Changelog information will be displayed here when available.
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    View the complete plugin documentation and API reference.
                  </p>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Documentation
                  </button>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Support Forum</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Get help from the community and plugin developers.
                  </p>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Visit Forum
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
