'use client';

import React, { useState } from 'react';
import { WorkflowOptimizationSuggestion, WorkflowDefinition } from '@/types/workflows/visual-builder';
import { RealTimeValidationResult } from '@/lib/workflows/real-time-validator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wrench, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Shield, 
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoFixPanelProps {
  validationResult: RealTimeValidationResult;
  onApplyFix: (suggestionId: string) => Promise<{ success: boolean; updatedWorkflow?: WorkflowDefinition; error?: string }>;
  onWorkflowUpdate?: (workflow: WorkflowDefinition) => void;
  className?: string;
}

export function AutoFixPanel({
  validationResult,
  onApplyFix,
  onWorkflowUpdate,
  className,
}: AutoFixPanelProps) {
  const [applyingFixes, setApplyingFixes] = useState<Set<string>>(new Set());
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [fixResults, setFixResults] = useState<Map<string, { success: boolean; error?: string }>>(new Map());

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'compliance':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'structure':
        return <Wrench className="w-4 h-4 text-green-500" />;
      case 'cost':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'compliance':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'structure':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'cost':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleApplyFix = async (suggestion: WorkflowOptimizationSuggestion) => {
    if (!suggestion.autoFix) return;

    setApplyingFixes(prev => new Set(prev).add(suggestion.id));
    
    try {
      const result = await onApplyFix(suggestion.id);
      
      setFixResults(prev => new Map(prev).set(suggestion.id, {
        success: result.success,
        error: result.error,
      }));
      
      if (result.success && result.updatedWorkflow && onWorkflowUpdate) {
        onWorkflowUpdate(result.updatedWorkflow);
        setAppliedFixes(prev => new Set(prev).add(suggestion.id));
      }
    } catch (error) {
      setFixResults(prev => new Map(prev).set(suggestion.id, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    } finally {
      setApplyingFixes(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }
  };

  const getFixStatus = (suggestionId: string) => {
    if (appliedFixes.has(suggestionId)) {
      return { status: 'applied', icon: CheckCircle, color: 'text-green-600' };
    }
    if (applyingFixes.has(suggestionId)) {
      return { status: 'applying', icon: Clock, color: 'text-blue-600' };
    }
    if (fixResults.has(suggestionId)) {
      const result = fixResults.get(suggestionId)!;
      if (result.success) {
        return { status: 'applied', icon: CheckCircle, color: 'text-green-600' };
      } else {
        return { status: 'failed', icon: XCircle, color: 'text-red-600' };
      }
    }
    return { status: 'available', icon: ChevronRight, color: 'text-gray-600' };
  };

  if (!validationResult.autoFixAvailable || validationResult.suggestions.length === 0) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Auto-fix Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No auto-fix suggestions available</p>
            <p className="text-xs text-gray-500 mt-1">Your workflow looks good!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Auto-fix Suggestions
          <Badge variant="outline" className="ml-auto">
            {validationResult.suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {validationResult.suggestions.map((suggestion, index) => {
          const fixStatus = getFixStatus(suggestion.id);
          const StatusIcon = fixStatus.icon;
          const isApplying = applyingFixes.has(suggestion.id);
          const isApplied = appliedFixes.has(suggestion.id);
          const hasError = fixResults.has(suggestion.id) && !fixResults.get(suggestion.id)!.success;

          return (
            <div
              key={suggestion.id}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200',
                getSuggestionColor(suggestion.type),
                isApplied && 'opacity-75',
                hasError && 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{suggestion.message}</h4>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                  
                  {suggestion.details && (
                    <p className="text-xs text-gray-600 mb-2">{suggestion.details}</p>
                  )}
                  
                  {suggestion.nodeId && (
                    <p className="text-xs text-gray-500 mb-2">Node: {suggestion.nodeId}</p>
                  )}
                  
                  {/* Error message */}
                  {hasError && (
                    <Alert className="mt-2">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {fixResults.get(suggestion.id)?.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    variant={isApplied ? "outline" : "default"}
                    onClick={() => handleApplyFix(suggestion)}
                    disabled={isApplying || isApplied || !suggestion.autoFix}
                    className={cn(
                      'h-8 px-3 text-xs',
                      isApplied && 'bg-green-100 text-green-700 hover:bg-green-200',
                      isApplying && 'animate-pulse'
                    )}
                  >
                    {isApplying ? (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Applying...
                      </>
                    ) : isApplied ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Applied
                      </>
                    ) : (
                      <>
                        <StatusIcon className={cn('w-3 h-3 mr-1', fixStatus.color)} />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {appliedFixes.size} of {validationResult.suggestions.length} fixes applied
            </span>
            {appliedFixes.size > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAppliedFixes(new Set());
                  setFixResults(new Map());
                }}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
