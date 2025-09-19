'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';
import { healthcareKeywordService, KeywordAnalysis } from '@/lib/services/healthcare-keyword-service';

const logger = new HealthcareAILogger('SEOAnalysis');

interface SEOAnalysisProps {
  content: string;
  title: string;
  category: string;
  onAnalysisComplete?: (analysis: KeywordAnalysis) => void;
}

export function SEOAnalysis({
  content,
  title,
  category,
  onAnalysisComplete
}: SEOAnalysisProps) {
  const [analysis, setAnalysis] = useState<KeywordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (content && title && category) {
      analyzeContent();
    }
  }, [content, title, category]);

  const analyzeContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      logger.info('Starting SEO analysis', { 
        contentLength: content.length, 
        title, 
        category 
      });

      const analysisResult = await healthcareKeywordService.analyzeContentKeywords(
        content,
        title,
        category
      );

      setAnalysis(analysisResult);
      onAnalysisComplete?.(analysisResult);
      
      logger.info('SEO analysis completed', { 
        optimizationScore: analysisResult.optimization_score 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('SEO analysis failed', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-600">Analyzing SEO...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Analysis Error</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={analyzeContent}
          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">No analysis available. Add content to analyze.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO Analysis</h3>
          <div className={`px-3 py-1 rounded-full ${getScoreBgColor(analysis.optimization_score)}`}>
            <span className={`text-sm font-medium ${getScoreColor(analysis.optimization_score)}`}>
              {getScoreLabel(analysis.optimization_score)} ({analysis.optimization_score}/100)
            </span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{analysis.optimization_score}</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.secondary_keywords.length}</div>
            <div className="text-sm text-gray-600">Keywords Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analysis.long_tail_keywords.length}</div>
            <div className="text-sm text-gray-600">Long-tail Keywords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analysis.competitor_keywords.length}</div>
            <div className="text-sm text-gray-600">Competitor Keywords</div>
          </div>
        </div>
      </div>

      {/* Primary Keyword */}
      {analysis.primary_keyword && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Primary Keyword</h4>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {analysis.primary_keyword}
            </span>
            <span className="text-sm text-gray-600">
              Main focus keyword for this content
            </span>
          </div>
        </div>
      )}

      {/* Keywords Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secondary Keywords */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Secondary Keywords</h4>
          {analysis.secondary_keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.secondary_keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No secondary keywords identified</p>
          )}
        </div>

        {/* Long-tail Keywords */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Long-tail Keywords</h4>
          {analysis.long_tail_keywords.length > 0 ? (
            <div className="space-y-2">
              {analysis.long_tail_keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800"
                >
                  {keyword}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No long-tail keywords found</p>
          )}
        </div>
      </div>

      {/* Competitor Keywords */}
      {analysis.competitor_keywords.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Competitor Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.competitor_keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Keywords your competitors are targeting
          </p>
        </div>
      )}

      {/* Content Gaps */}
      {analysis.content_gaps.length > 0 && (
        <div className="bg-white rounded-lg border border-yellow-200 p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-3">Content Gaps</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.content_gaps.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            Consider including these keywords to improve SEO
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h4>
        <div className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={analyzeContent}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Refresh Analysis
        </button>
        <button
          onClick={() => {
            // Copy analysis to clipboard
            navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Copy Analysis
        </button>
      </div>
    </div>
  );
}
