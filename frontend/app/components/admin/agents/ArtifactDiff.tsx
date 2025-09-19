'use client'

import React, { useState } from 'react';
import { AgentArtifact } from '@/lib/agents/types';

interface ArtifactDiffProps {
  artifact: AgentArtifact;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export default function ArtifactDiff({ 
  artifact, 
  onApprove, 
  onReject, 
  showActions = true 
}: ArtifactDiffProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper function to render different artifact types
  const renderArtifactContent = () => {
    switch (artifact.type) {
      case 'seo_recommendations':
        return renderSEORecommendations(artifact.content);
      
      case 'content_updates':
        return renderContentUpdates(artifact.content);
      
      case 'social_strategy':
        return renderSocialStrategy(artifact.content);
      
      case 'lead_management':
        return renderLeadManagement(artifact.content);
      
      case 'growth_analysis':
        return renderGrowthAnalysis(artifact.content);
      
      case 'link_analysis':
        return renderLinkAnalysis(artifact.content);
      
      case 'serp_analysis':
        return renderSerpAnalysis(artifact.content);
      
      case 'sitemap':
        return renderSitemap(artifact.content);
      
      case 'social_analytics':
        return renderSocialAnalytics(artifact.content);
      
      case 'analytics_data':
        return renderAnalyticsData(artifact.content);
      
      case 'content_optimization':
        return renderContentOptimization(artifact.content);
      
      default:
        return renderGenericContent(artifact.content);
    }
  };

  const renderSEORecommendations = (content: any) => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">SEO Recommendations</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Meta Descriptions:</span>
            <span className="text-sm text-blue-700 dark:text-blue-300">{content.metaDescriptions}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Title Optimization:</span>
            <span className="text-sm text-blue-700 dark:text-blue-300">{content.titleOptimization}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Keyword Opportunities</h4>
        <div className="flex flex-wrap gap-2">
          {content.keywordOpportunities?.map((keyword: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
              {keyword}
            </span>
          ))}
        </div>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Technical SEO</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
          {content.technicalSeo?.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderContentUpdates = (content: any) => (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">New Meta Descriptions</h4>
        <div className="space-y-3">
          {content.newMetaDescriptions?.map((meta: any, index: number) => (
            <div key={index} className="border-l-4 border-purple-300 pl-3">
              <div className="font-medium text-sm text-purple-800 dark:text-purple-200">{meta.page}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">{meta.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Blog Post Ideas</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800 dark:text-indigo-200">
          {content.blogPostIdeas?.map((idea: string, index: number) => (
            <li key={index}>{idea}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Social Media Content</h4>
        <div className="space-y-2">
          {content.socialMediaContent?.map((post: string, index: number) => (
            <div key={index} className="text-sm text-pink-800 dark:text-pink-200 bg-white dark:bg-gray-800 p-2 rounded border">
              {post}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSocialStrategy = (content: any) => (
    <div className="space-y-4">
      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Scheduled Posts</h4>
        <div className="space-y-2">
          {content.scheduledPosts?.map((post: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border">
              <div className="flex-1">
                <div className="text-sm text-teal-800 dark:text-teal-200">{post.content}</div>
                <div className="text-xs text-teal-600 dark:text-teal-400">
                  {post.platform} • {new Date(post.scheduledTime).toLocaleString()}
                </div>
              </div>
              <span className="px-2 py-1 bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 text-xs rounded">
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Hashtag Strategy</h4>
        <div className="flex flex-wrap gap-2">
          {content.hashtagStrategy?.map((hashtag: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 text-xs rounded">
              {hashtag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-sky-900 dark:text-sky-100 mb-2">Engagement Metrics</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-sky-700 dark:text-sky-300">Expected Reach:</span>
            <span className="ml-2 font-medium text-sky-800 dark:text-sky-200">{content.engagementMetrics?.expectedReach}</span>
          </div>
          <div>
            <span className="text-sky-700 dark:text-sky-300">Target Engagement:</span>
            <span className="ml-2 font-medium text-sky-800 dark:text-sky-200">{content.engagementMetrics?.targetEngagement}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeadManagement = (content: any) => (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">New Leads</h4>
        <div className="space-y-2">
          {content.newLeads?.map((lead: any, index: number) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
              <div className="font-medium text-sm text-emerald-800 dark:text-emerald-200">{lead.email}</div>
              <div className="text-sm text-emerald-700 dark:text-emerald-300">Interest: {lead.interest}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Newsletter Subscribers</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{content.newsletterSubscribers?.newThisWeek}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">New This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{content.newsletterSubscribers?.totalActive}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">Total Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{content.newsletterSubscribers?.engagementRate}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">Engagement Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGrowthAnalysis = (content: any) => (
    <div className="space-y-4">
      <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Traffic Projections</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-medium text-violet-800 dark:text-violet-200">{content.trafficProjections?.currentDaily}</div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Current Daily</div>
          </div>
          <div>
            <div className="text-lg font-medium text-violet-800 dark:text-violet-200">{content.trafficProjections?.projectedDaily}</div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Projected Daily</div>
          </div>
          <div>
            <div className="text-lg font-medium text-violet-800 dark:text-violet-200">{content.trafficProjections?.growthRate}</div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Growth Rate</div>
          </div>
        </div>
      </div>
      
      <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-rose-900 dark:text-rose-100 mb-2">Revenue Potential</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-medium text-rose-800 dark:text-rose-200">{content.revenuePotential?.monthly}</div>
            <div className="text-xs text-rose-600 dark:text-rose-400">Monthly</div>
          </div>
          <div>
            <div className="text-lg font-medium text-rose-800 dark:text-rose-200">{content.revenuePotential?.quarterly}</div>
            <div className="text-xs text-rose-600 dark:text-rose-400">Quarterly</div>
          </div>
          <div>
            <div className="text-lg font-medium text-rose-800 dark:text-rose-200">{content.revenuePotential?.annual}</div>
            <div className="text-xs text-rose-600 dark:text-rose-400">Annual</div>
          </div>
        </div>
      </div>
      
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Conversion Opportunities</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-orange-800 dark:text-orange-200">
          {content.conversionOpportunities?.map((opportunity: string, index: number) => (
            <li key={index}>{opportunity}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderLinkAnalysis = (content: any) => (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Link Analysis Summary</h4>
        <div className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
          {content.deadLinks} / {content.totalLinks} Dead Links
        </div>
        <div className="text-sm text-red-700 dark:text-red-300">{content.summary}</div>
      </div>
      
      {content.deadLinkDetails && content.deadLinkDetails.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Dead Link Details</h4>
          <div className="space-y-2">
            {content.deadLinkDetails.map((link: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                <div className="text-sm text-red-800 dark:text-red-200 font-mono">{link.url}</div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  Status: {link.status} • {link.error || 'No response'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSerpAnalysis = (content: any) => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Keyword Analysis: {content.query}</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">High Volume</h5>
            <div className="space-y-1">
              {content.searchVolume?.high?.map((kw: string, index: number) => (
                <span key={index} className="block text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Medium Volume</h5>
            <div className="space-y-1">
              {content.searchVolume?.medium?.map((kw: string, index: number) => (
                <span key={index} className="block text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Low Volume</h5>
            <div className="space-y-1">
              {content.searchVolume?.low?.map((kw: string, index: number) => (
                <span key={index} className="block text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Long-tail Opportunities</h4>
        <div className="space-y-2">
          {content.longTailOpportunities?.map((opportunity: string, index: number) => (
            <div key={index} className="text-sm text-green-800 dark:text-green-200 bg-white dark:bg-gray-800 p-2 rounded border">
              {opportunity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSitemap = (content: any) => (
    <div className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Sitemap Overview</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{content.totalPages}</div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">Total Pages</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{content.totalUrls}</div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">Total URLs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
              {new Date(content.lastModified).toLocaleDateString()}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">Last Modified</div>
          </div>
        </div>
      </div>
      
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Top Pages</h4>
        <div className="space-y-2">
          {content.pages?.slice(0, 5).map((page: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
              <span className="text-sm text-purple-800 dark:text-purple-200 font-mono">{page.url}</span>
              <span className="text-xs text-purple-600 dark:text-purple-400">Priority: {page.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSocialAnalytics = (content: any) => (
    <div className="space-y-4">
      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Follower Counts</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-medium text-teal-800 dark:text-teal-200">{content.followers?.twitter}</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">Twitter</div>
          </div>
          <div>
            <div className="text-lg font-medium text-teal-800 dark:text-teal-200">{content.followers?.linkedin}</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">LinkedIn</div>
          </div>
          <div>
            <div className="text-lg font-medium text-teal-800 dark:text-teal-200">{content.followers?.facebook}</div>
            <div className="text-xs text-teal-600 dark:text-teal-400">Facebook</div>
          </div>
        </div>
      </div>
      
      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Engagement Rates</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-medium text-cyan-800 dark:text-cyan-200">{content.engagement?.twitter}</div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400">Twitter</div>
          </div>
          <div>
            <div className="text-lg font-medium text-cyan-800 dark:text-cyan-200">{content.engagement?.linkedin}</div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400">LinkedIn</div>
          </div>
          <div>
            <div className="text-lg font-medium text-cyan-800 dark:text-cyan-200">{content.engagement?.facebook}</div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400">Facebook</div>
          </div>
        </div>
      </div>
      
      <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-sky-900 dark:text-sky-100 mb-2">Recommendations</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-sky-800 dark:text-sky-200">
          {content.recommendations?.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderAnalyticsData = (content: any) => (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Key Metrics</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(content.metrics || {}).map(([metric, data]: [string, any]) => (
            <div key={metric} className="bg-white dark:bg-gray-800 p-3 rounded border">
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200 capitalize">
                {metric.replace('_', ' ')}
              </div>
              <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{data.value}</div>
              <div className={`text-xs ${data.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {data.change}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Top Pages</h4>
        <div className="space-y-2">
          {content.topPages?.slice(0, 3).map((page: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
              <span className="text-sm text-amber-800 dark:text-amber-200 font-mono">{page.page}</span>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {page.views} views • {page.bounceRate} bounce
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Insights</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-violet-800 dark:text-violet-200">
          {content.insights?.map((insight: string, index: number) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderContentOptimization = (content: any) => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">SEO Score</h4>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{content.seoScore?.overall}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Overall</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{content.seoScore?.title}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Title</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{content.seoScore?.metaDescription}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Meta</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{content.seoScore?.headings}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Headings</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{content.seoScore?.content}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Content</div>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Recommendations</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-200">
          {content.recommendations?.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Readability</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-medium text-yellow-800 dark:text-yellow-200">{content.readabilityScore?.fleschReadingEase}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Reading Ease</div>
          </div>
          <div>
            <div className="text-lg font-medium text-yellow-800 dark:text-yellow-200">{content.readabilityScore?.gradeLevel}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Grade Level</div>
          </div>
          <div>
            <div className="text-lg font-medium text-yellow-800 dark:text-yellow-200">{content.readabilityScore?.sentenceComplexity}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Complexity</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenericContent = (content: any) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {artifact.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {artifact.type}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        {artifact.metadata?.timestamp && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generated: {new Date(artifact.metadata.timestamp).toLocaleString()}
          </div>
        )}
      </div>
      
      <div className={`${expanded ? 'block' : 'hidden'} p-4`}>
        {renderArtifactContent()}
        
        {showActions && (onApprove || onReject) && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end space-x-3">
              {onReject && (
                <button
                  onClick={onReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Reject
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


