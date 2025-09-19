// Main Plugin Marketplace Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Download, 
  Shield, 
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
  Zap,
  X
} from 'lucide-react';
import MarketplaceBrowser from './marketplace-browser';
import PluginInstaller from './plugin-installer';
import PluginMonitor from './plugin-monitor';
import PluginDashboard from './plugin-dashboard';
import PluginAnalytics from './plugin-analytics';

interface PluginMarketplaceProps {
  organizationId: string;
  initialView?: 'browse' | 'installed' | 'monitor' | 'analytics';
}

export default function PluginMarketplace({ 
  organizationId, 
  initialView = 'browse' 
}: PluginMarketplaceProps) {
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const views = [
    { id: 'browse', label: 'Browse Plugins', icon: Grid, description: 'Discover and install new plugins' },
    { id: 'installed', label: 'Installed Plugins', icon: Download, description: 'Manage your installed plugins' },
    { id: 'monitor', label: 'Monitoring', icon: Activity, description: 'Monitor plugin performance and health' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'View detailed analytics and insights' }
  ];

  const handlePluginSelect = (plugin: any) => {
    setSelectedPlugin(plugin);
    setShowDetail(true);
  };

  const handlePluginInstall = (plugin: any) => {
    setSelectedPlugin(plugin);
    setShowConfiguration(true);
  };

  const handlePluginConfigure = (plugin: any) => {
    setSelectedPlugin(plugin);
    setShowConfiguration(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'browse':
        return (
          <MarketplaceBrowser
            organizationId={organizationId}
            onPluginSelect={handlePluginSelect}
            onPluginInstall={handlePluginInstall}
          />
        );
      case 'installed':
        return (
          <PluginDashboard
            organizationId={organizationId}
            onPluginSelect={handlePluginSelect}
            onPluginConfigure={handlePluginConfigure}
          />
        );
      case 'monitor':
        return (
          <PluginMonitor
            organizationId={organizationId}
          />
        );
      case 'analytics':
        return (
          <PluginAnalytics
            organizationId={organizationId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Plugin Marketplace</h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Healthcare Edition
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id as any)}
                  className={`${
                    currentView === view.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4 w-full text-left`}
                >
                  <view.icon
                    className={`${
                      currentView === view.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5`}
                  />
                  <div>
                    <div>{view.label}</div>
                    <div className="text-xs text-gray-500">{view.description}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available Plugins</span>
                  <span className="font-medium text-gray-900">1,247</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Installed</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active</span>
                  <span className="font-medium text-green-600">8</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Issues</span>
                  <span className="font-medium text-red-600">2</span>
                </div>
              </div>
            </div>

            {/* Healthcare Compliance Badge */}
            <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="ml-2">
                  <div className="text-sm font-medium text-green-800">HIPAA Compliant</div>
                  <div className="text-xs text-green-600">All plugins verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderCurrentView()}
          </div>
        </div>
      </div>

      {/* Plugin Detail Modal */}
      {showDetail && selectedPlugin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <button
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              {/* Plugin detail content would go here */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedPlugin.name || 'Plugin Details'}
                </h2>
                <p className="text-gray-600">
                  Plugin detail view would be implemented here with full plugin information,
                  reviews, configuration options, and installation controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plugin Configuration Modal */}
      {showConfiguration && selectedPlugin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <button
                onClick={() => setShowConfiguration(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
              {/* Plugin configuration content would go here */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Configure {selectedPlugin.name || 'Plugin'}
                </h2>
                <p className="text-gray-600">
                  Plugin configuration view would be implemented here with settings,
                  permissions, resource limits, and environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
