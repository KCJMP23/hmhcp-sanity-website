'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

const logger = new HealthcareAILogger('RevisionDiff');

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

interface DiffSection {
  title: string;
  lines: DiffLine[];
  hasChanges: boolean;
}

interface RevisionDiffProps {
  fromRevision: {
    id: string;
    version: number;
    title: string;
    content: string;
    author: { name: string };
    createdAt: string;
  };
  toRevision: {
    id: string;
    version: number;
    title: string;
    content: string;
    author: { name: string };
    createdAt: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

export function RevisionDiff({
  fromRevision,
  toRevision,
  onClose,
  isOpen
}: RevisionDiffProps) {
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('title');
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateDiff();
    }
  }, [isOpen, fromRevision, toRevision]);

  const generateDiff = async () => {
    try {
      setIsLoading(true);
      logger.info('Generating revision diff', {
        fromVersion: fromRevision.version,
        toVersion: toRevision.version
      });

      // Generate diff for title
      const titleDiff = generateTextDiff(fromRevision.title, toRevision.title);
      
      // Generate diff for content
      const contentDiff = generateTextDiff(fromRevision.content, toRevision.content);

      const sections: DiffSection[] = [
        {
          title: 'Title',
          lines: titleDiff,
          hasChanges: titleDiff.some(line => line.type !== 'unchanged')
        },
        {
          title: 'Content',
          lines: contentDiff,
          hasChanges: contentDiff.some(line => line.type !== 'unchanged')
        }
      ];

      setDiffSections(sections);
      setActiveSection(sections[0].title.toLowerCase());
      
      logger.info('Diff generated successfully', {
        sectionsCount: sections.length,
        totalChanges: sections.reduce((acc, section) => 
          acc + section.lines.filter(line => line.type !== 'unchanged').length, 0
        )
      });
    } catch (error) {
      logger.error('Failed to generate diff', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTextDiff = (oldText: string, newText: string): DiffLine[] => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: DiffLine[] = [];
    
    let oldIndex = 0;
    let newIndex = 0;
    let lineNumber = 1;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex] || '';
      const newLine = newLines[newIndex] || '';

      if (oldIndex >= oldLines.length) {
        // Only new lines remain
        diff.push({
          type: 'added',
          content: newLine,
          lineNumber: lineNumber++
        });
        newIndex++;
      } else if (newIndex >= newLines.length) {
        // Only old lines remain
        diff.push({
          type: 'removed',
          content: oldLine,
          lineNumber: lineNumber++
        });
        oldIndex++;
      } else if (oldLine === newLine) {
        // Lines are identical
        diff.push({
          type: 'unchanged',
          content: oldLine,
          lineNumber: lineNumber++
        });
        oldIndex++;
        newIndex++;
      } else {
        // Lines are different - check if it's an addition or deletion
        const nextOldLine = oldLines[oldIndex + 1];
        const nextNewLine = newLines[newIndex + 1];

        if (nextOldLine === newLine) {
          // Current old line was removed
          diff.push({
            type: 'removed',
            content: oldLine,
            lineNumber: lineNumber++
          });
          oldIndex++;
        } else if (oldLine === nextNewLine) {
          // Current new line was added
          diff.push({
            type: 'added',
            content: newLine,
            lineNumber: lineNumber++
          });
          newIndex++;
        } else {
          // Both lines changed
          diff.push({
            type: 'removed',
            content: oldLine,
            lineNumber: lineNumber++
          });
          diff.push({
            type: 'added',
            content: newLine,
            lineNumber: lineNumber++
          });
          oldIndex++;
          newIndex++;
        }
      }
    }

    return diff;
  };

  const getLineStyle = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-4 border-green-500 text-green-800';
      case 'removed':
        return 'bg-red-50 border-l-4 border-red-500 text-red-800';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getLineIcon = (type: string) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  const getLineIconColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'text-green-600';
      case 'removed':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const filteredSections = showOnlyChanges 
    ? diffSections.filter(section => section.hasChanges)
    : diffSections;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revision Comparison</h2>
            <p className="text-sm text-gray-600">
              Comparing version {fromRevision.version} → {toRevision.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Revision Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">From Version {fromRevision.version}</h3>
              <p className="text-sm text-gray-600">{fromRevision.author.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(fromRevision.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">To Version {toRevision.version}</h3>
              <p className="text-sm text-gray-600">{toRevision.author.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(toRevision.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyChanges}
                  onChange={(e) => setShowOnlyChanges(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show only changes</span>
              </label>
            </div>
            <div className="text-sm text-gray-600">
              {filteredSections.reduce((acc, section) => 
                acc + section.lines.filter(line => line.type !== 'unchanged').length, 0
              )} changes found
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-600">Generating diff...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    {section.hasChanges && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Modified
                      </span>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="w-8">Line</span>
                        <span className="w-8">Type</span>
                        <span>Content</span>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {section.lines.map((line, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 border-b border-gray-100 last:border-b-0 ${getLineStyle(line.type)}`}
                        >
                          <div className="flex items-start space-x-4 text-sm font-mono">
                            <span className="w-8 text-gray-500 text-right">
                              {line.lineNumber}
                            </span>
                            <span className={`w-8 text-center font-bold ${getLineIconColor(line.type)}`}>
                              {getLineIcon(line.type)}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap">
                              {line.content || ' '}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredSections.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No changes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                The selected revisions are identical
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
