'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from './dashboard-provider';
import { DashboardHeader } from './dashboard-header';
import { DashboardGrid } from './dashboard-grid';
import { WidgetLibrary } from './widget-library';
import { DashboardCustomization } from './dashboard-customization';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('AdminDashboard');

export function AdminDashboard() {
  const { state, dispatch } = useDashboard();
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  // Initialize default widgets on first load
  useEffect(() => {
    if (state.widgets.length === 0) {
      const defaultWidgets = [
        {
          type: 'system-status' as const,
          title: 'System Status',
          position: { x: 0, y: 0, w: 6, h: 4 },
          config: {},
          visible: true
        },
        {
          type: 'content-performance' as const,
          title: 'Content Performance',
          position: { x: 6, y: 0, w: 6, h: 4 },
          config: {},
          visible: true
        },
        {
          type: 'compliance' as const,
          title: 'Healthcare Compliance',
          position: { x: 0, y: 4, w: 4, h: 3 },
          config: {},
          visible: true
        },
        {
          type: 'ai-workflows' as const,
          title: 'AI Workflows',
          position: { x: 4, y: 4, w: 4, h: 3 },
          config: {},
          visible: true
        },
        {
          type: 'activity-feed' as const,
          title: 'Recent Activity',
          position: { x: 8, y: 4, w: 4, h: 3 },
          config: {},
          visible: true
        }
      ];

      defaultWidgets.forEach(widget => {
        dispatch({ type: 'ADD_WIDGET', payload: widget });
      });

      logger.debug('Default dashboard widgets initialized');
    }
  }, [state.widgets.length, dispatch]);

  // Real-time data updates with better error handling and performance
  useEffect(() => {
    let isMounted = true;
    let updateTimeout: NodeJS.Timeout;

    const updateRealTimeData = async () => {
      if (!isMounted) return;
      
      try {
        // Simulate real-time data updates with more realistic data
        const now = new Date();
        const mockData = {
          systemStatus: {
            database: 'healthy',
            apis: 'operational',
            aiAgents: 'active',
            lastChecked: now.toISOString()
          },
          aiWorkflows: [
            {
              id: 'workflow-1',
              name: 'Content Generation',
              status: 'running' as const,
              progress: Math.floor(Math.random() * 30) + 70, // 70-100%
              startTime: new Date(now.getTime() - 300000).toISOString()
            },
            {
              id: 'workflow-2',
              name: 'Medical Validation',
              status: 'completed' as const,
              progress: 100,
              startTime: new Date(now.getTime() - 600000).toISOString(),
              endTime: new Date(now.getTime() - 300000).toISOString()
            }
          ],
          contentMetrics: {
            totalViews: 12543 + Math.floor(Math.random() * 100),
            engagementRate: 0.68 + (Math.random() - 0.5) * 0.1,
            topContent: 'Diabetes Management Guide',
            lastUpdated: now.toISOString()
          },
          complianceStatus: {
            hipaa: 'compliant' as const,
            fda: 'compliant' as const,
            lastAudit: new Date(now.getTime() - 86400000).toISOString()
          },
          activityFeed: [
            {
              id: 'activity-1',
              type: 'content_created' as const,
              message: 'New blog post published: "Advanced Diabetes Care"',
              timestamp: new Date(now.getTime() - 300000).toISOString(),
              user: 'Dr. Sarah Johnson'
            },
            {
              id: 'activity-2',
              type: 'workflow_completed' as const,
              message: 'AI workflow "Medical Validation" completed successfully',
              timestamp: new Date(now.getTime() - 600000).toISOString(),
              user: 'System'
            }
          ]
        };

        if (isMounted) {
          dispatch({ type: 'UPDATE_REAL_TIME_DATA', payload: mockData });
        }
      } catch (error) {
        logger.error('Failed to update real-time data', { error });
        // Implement exponential backoff for failed updates
        const retryDelay = Math.min(30000, 5000 * Math.pow(2, 0)); // Start with 5s, max 30s
        updateTimeout = setTimeout(updateRealTimeData, retryDelay);
      }
    };

    // Update data immediately
    updateRealTimeData();

    // Set up interval for periodic updates
    const interval = setInterval(() => {
      if (isMounted) {
        updateRealTimeData();
      }
    }, 30000); // Update every 30 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [dispatch]);

  const handleCustomizationToggle = () => {
    setShowCustomization(!showCustomization);
    dispatch({ type: 'SET_CUSTOMIZATION_MODE', payload: !showCustomization });
  };

  const handleWidgetLibraryToggle = () => {
    setShowWidgetLibrary(!showWidgetLibrary);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        onCustomizationToggle={handleCustomizationToggle}
        onWidgetLibraryToggle={handleWidgetLibraryToggle}
        isCustomizing={state.customization.isCustomizing}
      />

      <main className="p-4 md:p-6">
        <AnimatePresence>
          {showCustomization && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <DashboardCustomization />
            </motion.div>
          )}
        </AnimatePresence>

        <DashboardGrid />

        <AnimatePresence>
          {showWidgetLibrary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowWidgetLibrary(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <WidgetLibrary onClose={() => setShowWidgetLibrary(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
