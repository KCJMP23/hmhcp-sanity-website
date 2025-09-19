'use client';

import React, { useEffect, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { RealTimeValidationResult } from '@/lib/workflows/real-time-validator';
import { cn } from '@/lib/utils';

interface ErrorHighlighterProps {
  nodes: Node[];
  edges: Edge[];
  validationResult: RealTimeValidationResult;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

export function ErrorHighlighter({
  nodes,
  edges,
  validationResult,
  onNodeClick,
  onEdgeClick,
}: ErrorHighlighterProps) {
  const errorMap = useMemo(() => {
    const map = new Map<string, { errors: any[]; warnings: any[] }>();
    
    // Group errors and warnings by node/edge ID
    validationResult.errors.forEach(error => {
      const id = error.nodeId || error.edgeId;
      if (id) {
        if (!map.has(id)) map.set(id, { errors: [], warnings: [] });
        map.get(id)!.errors.push(error);
      }
    });
    
    validationResult.warnings.forEach(warning => {
      const id = warning.nodeId || warning.edgeId;
      if (id) {
        if (!map.has(id)) map.set(id, { errors: [], warnings: [] });
        map.get(id)!.warnings.push(warning);
      }
    });
    
    return map;
  }, [validationResult.errors, validationResult.warnings]);

  const getNodeErrorClass = (nodeId: string) => {
    const issues = errorMap.get(nodeId);
    if (!issues) return '';
    
    if (issues.errors.length > 0) {
      return 'ring-2 ring-red-500 bg-red-50';
    }
    if (issues.warnings.length > 0) {
      return 'ring-2 ring-yellow-500 bg-yellow-50';
    }
    return '';
  };

  const getEdgeErrorClass = (edgeId: string) => {
    const issues = errorMap.get(edgeId);
    if (!issues) return '';
    
    if (issues.errors.length > 0) {
      return 'stroke-red-500 stroke-2';
    }
    if (issues.warnings.length > 0) {
      return 'stroke-yellow-500 stroke-2';
    }
    return '';
  };

  const getNodeErrorCount = (nodeId: string) => {
    const issues = errorMap.get(nodeId);
    if (!issues) return null;
    
    const total = issues.errors.length + issues.warnings.length;
    return total > 0 ? total : null;
  };

  const getEdgeErrorCount = (edgeId: string) => {
    const issues = errorMap.get(edgeId);
    if (!issues) return null;
    
    const total = issues.errors.length + issues.warnings.length;
    return total > 0 ? total : null;
  };

  // Update node styles based on validation results
  useEffect(() => {
    nodes.forEach(node => {
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
      if (nodeElement) {
        const errorClass = getNodeErrorClass(node.id);
        const errorCount = getNodeErrorCount(node.id);
        
        // Remove existing error classes
        nodeElement.classList.remove(
          'ring-2', 'ring-red-500', 'ring-yellow-500', 
          'bg-red-50', 'bg-yellow-50'
        );
        
        // Add new error classes
        if (errorClass) {
          nodeElement.classList.add(...errorClass.split(' '));
        }
        
        // Add error count badge
        const existingBadge = nodeElement.querySelector('.error-badge');
        if (existingBadge) {
          existingBadge.remove();
        }
        
        if (errorCount) {
          const badge = document.createElement('div');
          badge.className = 'error-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold';
          badge.textContent = errorCount.toString();
          nodeElement.style.position = 'relative';
          nodeElement.appendChild(badge);
        }
      }
    });
  }, [nodes, errorMap]);

  // Update edge styles based on validation results
  useEffect(() => {
    edges.forEach(edge => {
      const edgeElement = document.querySelector(`[data-id="${edge.id}"]`);
      if (edgeElement) {
        const errorClass = getEdgeErrorClass(edge.id);
        const errorCount = getEdgeErrorCount(edge.id);
        
        // Remove existing error classes
        edgeElement.classList.remove('stroke-red-500', 'stroke-yellow-500', 'stroke-2');
        
        // Add new error classes
        if (errorClass) {
          edgeElement.classList.add(...errorClass.split(' '));
        }
        
        // Add error count indicator
        const existingIndicator = edgeElement.querySelector('.edge-error-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }
        
        if (errorCount) {
          const indicator = document.createElement('div');
          indicator.className = 'edge-error-indicator absolute bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold';
          indicator.textContent = errorCount.toString();
          indicator.style.left = '50%';
          indicator.style.top = '50%';
          indicator.style.transform = 'translate(-50%, -50%)';
          edgeElement.style.position = 'relative';
          edgeElement.appendChild(indicator);
        }
      }
    });
  }, [edges, errorMap]);

  return (
    <div className="error-highlighter">
      {/* Error Summary Overlay */}
      {validationResult.errors.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {validationResult.errors.length} error{validationResult.errors.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
      
      {/* Warning Summary Overlay */}
      {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {validationResult.warnings.length} warning{validationResult.warnings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
      
      {/* Performance Warning */}
      {validationResult.performanceMetrics.estimatedExecutionTimeMs > 10000 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Slow workflow: {validationResult.performanceMetrics.estimatedExecutionTimeMs}ms
            </span>
          </div>
        </div>
      )}
      
      {/* Compliance Warning */}
      {validationResult.complianceReport.overallStatus === 'non-compliant' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-purple-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Compliance issues detected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing error highlighting
export function useErrorHighlighting(
  nodes: Node[],
  edges: Edge[],
  validationResult: RealTimeValidationResult
) {
  const errorMap = useMemo(() => {
    const map = new Map<string, { errors: any[]; warnings: any[] }>();
    
    validationResult.errors.forEach(error => {
      const id = error.nodeId || error.edgeId;
      if (id) {
        if (!map.has(id)) map.set(id, { errors: [], warnings: [] });
        map.get(id)!.errors.push(error);
      }
    });
    
    validationResult.warnings.forEach(warning => {
      const id = warning.nodeId || warning.edgeId;
      if (id) {
        if (!map.has(id)) map.set(id, { errors: [], warnings: [] });
        map.get(id)!.warnings.push(warning);
      }
    });
    
    return map;
  }, [validationResult.errors, validationResult.warnings]);

  const getNodeIssues = (nodeId: string) => {
    return errorMap.get(nodeId) || { errors: [], warnings: [] };
  };

  const getEdgeIssues = (edgeId: string) => {
    return errorMap.get(edgeId) || { errors: [], warnings: [] };
  };

  const hasErrors = (id: string) => {
    const issues = errorMap.get(id);
    return issues ? issues.errors.length > 0 : false;
  };

  const hasWarnings = (id: string) => {
    const issues = errorMap.get(id);
    return issues ? issues.warnings.length > 0 : false;
  };

  const getIssueCount = (id: string) => {
    const issues = errorMap.get(id);
    return issues ? issues.errors.length + issues.warnings.length : 0;
  };

  return {
    errorMap,
    getNodeIssues,
    getEdgeIssues,
    hasErrors,
    hasWarnings,
    getIssueCount,
  };
}
