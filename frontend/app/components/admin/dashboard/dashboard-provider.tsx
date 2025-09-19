'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardWidget, DashboardState, DashboardAction } from '@/types/admin/dashboard';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('DashboardProvider');

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  toggleWidgetVisibility: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const initialState: DashboardState = {
  widgets: [],
  layout: {
    columns: 12,
    rowHeight: 60,
    margin: [16, 16],
    containerPadding: [16, 16]
  },
  customization: {
    isCustomizing: false,
    selectedWidget: null,
    showGrid: false
  },
  realTimeData: {
    systemStatus: null,
    aiWorkflows: [],
    contentMetrics: null,
    complianceStatus: null,
    activityFeed: []
  },
  isLoading: false,
  error: null
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_WIDGET':
      const newWidget: DashboardWidget = {
        ...action.payload,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      return {
        ...state,
        widgets: [...state.widgets, newWidget]
      };
    
    case 'REMOVE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter(widget => widget.id !== action.payload)
      };
    
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload.id
            ? { ...widget, ...action.payload.updates }
            : widget
        )
      };
    
    case 'REORDER_WIDGETS':
      return {
        ...state,
        widgets: action.payload
      };
    
    case 'TOGGLE_WIDGET_VISIBILITY':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload
            ? { ...widget, visible: !widget.visible }
            : widget
        )
      };
    
    case 'SET_CUSTOMIZATION_MODE':
      return {
        ...state,
        customization: {
          ...state.customization,
          isCustomizing: action.payload
        }
      };
    
    case 'SELECT_WIDGET':
      return {
        ...state,
        customization: {
          ...state.customization,
          selectedWidget: action.payload
        }
      };
    
    case 'TOGGLE_GRID':
      return {
        ...state,
        customization: {
          ...state.customization,
          showGrid: !state.customization.showGrid
        }
      };
    
    case 'UPDATE_REAL_TIME_DATA':
      return {
        ...state,
        realTimeData: {
          ...state.realTimeData,
          ...action.payload
        }
      };
    
    case 'RESET_DASHBOARD':
      return initialState;
    
    default:
      return state;
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const addWidget = (widget: Omit<DashboardWidget, 'id'>) => {
    // Validate widget data before adding
    if (!widget.type || !widget.title) {
      logger.error('Invalid widget data provided', { widget });
      return;
    }
    
    dispatch({ type: 'ADD_WIDGET', payload: widget });
    logger.debug('Widget added to dashboard', { widgetType: widget.type });
  };

  const removeWidget = (id: string) => {
    dispatch({ type: 'REMOVE_WIDGET', payload: id });
    logger.debug('Widget removed from dashboard', { widgetId: id });
  };

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    dispatch({ type: 'UPDATE_WIDGET', payload: { id, updates } });
    logger.debug('Widget updated', { widgetId: id, updates });
  };

  const reorderWidgets = (widgets: DashboardWidget[]) => {
    dispatch({ type: 'REORDER_WIDGETS', payload: widgets });
    logger.debug('Widgets reordered', { widgetCount: widgets.length });
  };

  const toggleWidgetVisibility = (id: string) => {
    dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: id });
    logger.debug('Widget visibility toggled', { widgetId: id });
  };

  // Load dashboard configuration from localStorage on mount
  useEffect(() => {
    const loadDashboardConfig = () => {
      try {
        const savedConfig = localStorage.getItem('admin-dashboard-config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.widgets && Array.isArray(config.widgets)) {
            // Validate each widget before adding
            config.widgets.forEach((widget: any) => {
              if (widget && typeof widget === 'object' && widget.type && widget.title) {
                dispatch({ type: 'ADD_WIDGET', payload: widget });
              } else {
                logger.warn('Invalid widget found in saved config, skipping', { widget });
              }
            });
          }
        }
        logger.debug('Dashboard configuration loaded from localStorage');
      } catch (error) {
        logger.error('Failed to load dashboard configuration', { error });
        // Clear corrupted data
        localStorage.removeItem('admin-dashboard-config');
      }
    };

    loadDashboardConfig();
  }, []);

  // Save dashboard configuration to localStorage when widgets change
  useEffect(() => {
    const saveDashboardConfig = () => {
      try {
        const config = {
          widgets: state.widgets,
          layout: state.layout,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('admin-dashboard-config', JSON.stringify(config));
        logger.debug('Dashboard configuration saved to localStorage');
      } catch (error) {
        logger.error('Failed to save dashboard configuration', { error });
      }
    };

    if (state.widgets.length > 0) {
      saveDashboardConfig();
    }
  }, [state.widgets, state.layout]);

  const value: DashboardContextType = {
    state,
    dispatch,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    toggleWidgetVisibility
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
