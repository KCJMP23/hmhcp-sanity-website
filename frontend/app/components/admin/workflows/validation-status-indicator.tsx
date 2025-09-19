'use client';

import React from 'react';
import { RealTimeValidationResult } from '@/lib/workflows/real-time-validator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Zap, 
  Shield, 
  TrendingUp,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationStatusIndicatorProps {
  validationResult: RealTimeValidationResult;
  onAutoFix?: (suggestionId: string) => void;
  onViewDetails?: () => void;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

export function ValidationStatusIndicator({
  validationResult,
  onAutoFix,
  onViewDetails,
  showDetails = false,
  onToggleDetails,
  className,
}: ValidationStatusIndicatorProps) {
  const getStatusIcon = () => {
    if (validationResult.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    switch (validationResult.severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    if (validationResult.isValid) return 'bg-green-100 text-green-800 border-green-200';
    
    switch (validationResult.severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = () => {
    if (validationResult.isValid) return 'Valid';
    
    switch (validationResult.severity) {
      case 'critical':
        return 'Critical Issues';
      case 'high':
        return 'High Priority Issues';
      case 'medium':
        return 'Medium Priority Issues';
      default:
        return 'Low Priority Issues';
    }
  };

  const getPerformanceColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceStatus = () => {
    const { complianceReport } = validationResult;
    if (complianceReport.overallStatus === 'compliant') {
      return { text: 'Compliant', color: 'text-green-600', icon: Shield };
    }
    if (complianceReport.violations.length > 0) {
      return { text: 'Non-Compliant', color: 'text-red-600', icon: XCircle };
    }
    return { text: 'Pending', color: 'text-yellow-600', icon: Clock };
  };

  const complianceStatus = getComplianceStatus();
  const ComplianceIcon = complianceStatus.icon;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Status Card */}
      <Card className={cn('border-2', getStatusColor())}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-lg">{getStatusText()}</CardTitle>
                <p className="text-sm opacity-75">
                  {validationResult.errors.length} errors, {validationResult.warnings.length} warnings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {validationResult.validationTimeMs}ms
              </Badge>
              {onToggleDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDetails}
                  className="h-8 w-8 p-0"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Quick Stats */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className={getPerformanceColor(validationResult.performanceMetrics.estimatedExecutionTimeMs)}>
                {validationResult.performanceMetrics.estimatedExecutionTimeMs}ms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ComplianceIcon className="w-4 h-4" />
              <span className={complianceStatus.color}>
                {complianceStatus.text}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>
                {validationResult.performanceMetrics.optimizationPotential}% potential
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-4">
          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Errors ({validationResult.errors.length})</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  {validationResult.errors.slice(0, 3).map((error, index) => (
                    <div key={error.id} className="text-sm">
                      <span className="font-medium">• {error.message}</span>
                      {error.nodeId && (
                        <span className="text-xs opacity-75 ml-2">(Node: {error.nodeId})</span>
                      )}
                    </div>
                  ))}
                  {validationResult.errors.length > 3 && (
                    <div className="text-sm opacity-75">
                      +{validationResult.errors.length - 3} more errors
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warnings ({validationResult.warnings.length})</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  {validationResult.warnings.slice(0, 3).map((warning, index) => (
                    <div key={warning.id} className="text-sm">
                      <span className="font-medium">• {warning.message}</span>
                      {warning.nodeId && (
                        <span className="text-xs opacity-75 ml-2">(Node: {warning.nodeId})</span>
                      )}
                    </div>
                  ))}
                  {validationResult.warnings.length > 3 && (
                    <div className="text-sm opacity-75">
                      +{validationResult.warnings.length - 3} more warnings
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Performance Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Execution Time</span>
                  <span className={getPerformanceColor(validationResult.performanceMetrics.estimatedExecutionTimeMs)}>
                    {validationResult.performanceMetrics.estimatedExecutionTimeMs}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (validationResult.performanceMetrics.estimatedExecutionTimeMs / 10000) * 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Estimated Cost</span>
                <span>${validationResult.performanceMetrics.estimatedCostUnits.toFixed(4)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Optimization Potential</span>
                <span className="text-purple-600">
                  {validationResult.performanceMetrics.optimizationPotential}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Report */}
          {validationResult.complianceReport.violations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Compliance Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.complianceReport.violations.slice(0, 3).map((violation, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-400">
                      <div className="font-medium text-red-800">{violation.rule}</div>
                      <div className="text-red-600">{violation.description}</div>
                      {violation.nodeId && (
                        <div className="text-xs text-red-500 mt-1">Node: {violation.nodeId}</div>
                      )}
                    </div>
                  ))}
                  {validationResult.complianceReport.violations.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{validationResult.complianceReport.violations.length - 3} more violations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-fix Suggestions */}
          {validationResult.autoFixAvailable && validationResult.suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Auto-fix Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{suggestion.message}</div>
                        {suggestion.details && (
                          <div className="text-xs text-gray-600 mt-1">{suggestion.details}</div>
                        )}
                      </div>
                      {onAutoFix && suggestion.autoFix && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAutoFix(suggestion.id)}
                          className="ml-2 h-8"
                        >
                          Fix
                        </Button>
                      )}
                    </div>
                  ))}
                  {validationResult.suggestions.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{validationResult.suggestions.length - 3} more suggestions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onViewDetails && (
              <Button variant="outline" onClick={onViewDetails} className="flex-1">
                View Full Details
              </Button>
            )}
            {validationResult.autoFixAvailable && onAutoFix && (
              <Button 
                onClick={() => {
                  const firstSuggestion = validationResult.suggestions.find(s => s.autoFix);
                  if (firstSuggestion) onAutoFix(firstSuggestion.id);
                }}
                className="flex-1"
              >
                Apply Auto-fix
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
