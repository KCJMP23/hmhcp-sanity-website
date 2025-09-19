/**
 * Context-Aware Suggestions Component
 * Dynamic recommendation display for AI assistant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Target, 
  Shield, 
  Zap,
  BookOpen,
  BarChart3,
  FileText,
  Search,
  Settings
} from 'lucide-react';

interface ContextAwareSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  maxVisible?: number;
}

interface SuggestionCategory {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const suggestionCategories: Record<string, SuggestionCategory> = {
  'compliance': {
    icon: <Shield className="h-3 w-3" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  'content': {
    icon: <FileText className="h-3 w-3" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'analytics': {
    icon: <BarChart3 className="h-3 w-3" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'research': {
    icon: <BookOpen className="h-3 w-3" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  'search': {
    icon: <Search className="h-3 w-3" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  'settings': {
    icon: <Settings className="h-3 w-3" />,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  'workflow': {
    icon: <Zap className="h-3 w-3" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  'default': {
    icon: <Target className="h-3 w-3" />,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
};

export function ContextAwareSuggestions({
  suggestions,
  onSuggestionClick,
  maxVisible = 3
}: ContextAwareSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categorizedSuggestions, setCategorizedSuggestions] = useState<Record<string, string[]>>({});

  // Categorize suggestions based on keywords
  useEffect(() => {
    const categorized: Record<string, string[]> = {};
    
    suggestions.forEach(suggestion => {
      const category = categorizeSuggestion(suggestion);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(suggestion);
    });
    
    setCategorizedSuggestions(categorized);
  }, [suggestions]);

  const categorizeSuggestion = (suggestion: string): string => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('compliance') || lowerSuggestion.includes('hipaa') || lowerSuggestion.includes('fda')) {
      return 'compliance';
    }
    if (lowerSuggestion.includes('content') || lowerSuggestion.includes('create') || lowerSuggestion.includes('edit')) {
      return 'content';
    }
    if (lowerSuggestion.includes('analytics') || lowerSuggestion.includes('report') || lowerSuggestion.includes('data')) {
      return 'analytics';
    }
    if (lowerSuggestion.includes('research') || lowerSuggestion.includes('literature') || lowerSuggestion.includes('study')) {
      return 'research';
    }
    if (lowerSuggestion.includes('search') || lowerSuggestion.includes('find') || lowerSuggestion.includes('look')) {
      return 'search';
    }
    if (lowerSuggestion.includes('settings') || lowerSuggestion.includes('configure') || lowerSuggestion.includes('preferences')) {
      return 'settings';
    }
    if (lowerSuggestion.includes('workflow') || lowerSuggestion.includes('process') || lowerSuggestion.includes('automate')) {
      return 'workflow';
    }
    
    return 'default';
  };

  const getVisibleSuggestions = () => {
    if (isExpanded) {
      return suggestions;
    }
    return suggestions.slice(0, maxVisible);
  };

  const getHiddenCount = () => {
    return Math.max(0, suggestions.length - maxVisible);
  };

  const renderSuggestion = (suggestion: string, index: number) => {
    const category = categorizeSuggestion(suggestion);
    const categoryInfo = suggestionCategories[category] || suggestionCategories.default;
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSuggestionClick(suggestion)}
          className={`w-full justify-start text-left h-auto p-3 ${categoryInfo.bgColor} ${categoryInfo.borderColor} hover:${categoryInfo.bgColor} border`}
        >
          <div className="flex items-start space-x-2 w-full">
            <div className={`flex-shrink-0 ${categoryInfo.color}`}>
              {categoryInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${categoryInfo.color}`}>
                {suggestion}
              </span>
            </div>
          </div>
        </Button>
      </motion.div>
    );
  };

  const renderCategorizedSuggestions = () => {
    return Object.entries(categorizedSuggestions).map(([category, categorySuggestions]) => {
      const categoryInfo = suggestionCategories[category] || suggestionCategories.default;
      const visibleSuggestions = isExpanded 
        ? categorySuggestions 
        : categorySuggestions.slice(0, 2);
      
      if (visibleSuggestions.length === 0) return null;
      
      return (
        <div key={category} className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`flex-shrink-0 ${categoryInfo.color}`}>
              {categoryInfo.icon}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wide ${categoryInfo.color}`}>
              {category}
            </span>
            <Badge variant="secondary" className="text-xs">
              {categorySuggestions.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {visibleSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className={`w-full justify-start text-left h-auto p-2 ${categoryInfo.bgColor} hover:${categoryInfo.bgColor} ${categoryInfo.borderColor} border`}
              >
                <span className={`text-xs ${categoryInfo.color}`}>
                  {suggestion}
                </span>
              </Button>
            ))}
          </div>
        </div>
      );
    });
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            Smart Suggestions
          </span>
          <Badge variant="secondary" className="text-xs">
            {suggestions.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-xs text-blue-600">
          <Clock className="h-3 w-3" />
          <span>Context-aware</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.keys(categorizedSuggestions).length > 1 ? (
          renderCategorizedSuggestions()
        ) : (
          <div className="space-y-2">
            {getVisibleSuggestions().map((suggestion, index) => 
              renderSuggestion(suggestion, index)
            )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        {suggestions.length > maxVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {getHiddenCount()} More
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
