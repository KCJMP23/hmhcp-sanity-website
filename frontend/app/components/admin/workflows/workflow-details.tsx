'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Heart, 
  Eye, 
  Star, 
  User, 
  Clock, 
  Tag,
  Crown,
  TrendingUp,
  ChevronLeft,
  Share,
  Flag,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { MarketplaceWorkflow, WorkflowReview } from '@/lib/workflows/marketplace';

interface WorkflowDetailsProps {
  workflow: MarketplaceWorkflow;
  reviews: WorkflowReview[];
  isInstalled: boolean;
  isLiked: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onLike: () => void;
  onUnlike: () => void;
  onViewWorkflow: () => void;
  onShare: () => void;
  onReport: () => void;
  onAddReview: (rating: number, title: string, comment: string) => void;
  onRateReview: (reviewId: string, helpful: boolean) => void;
}

export function WorkflowDetails({
  workflow,
  reviews,
  isInstalled,
  isLiked,
  onInstall,
  onUninstall,
  onLike,
  onUnlike,
  onViewWorkflow,
  onShare,
  onReport,
  onAddReview,
  onRateReview
}: WorkflowDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'dependencies' | 'changelog'>('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingStars = (rating: number, interactive: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-5 w-5 ${
            i <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={interactive ? () => setReviewRating(i) : undefined}
        />
      );
    }
    return stars;
  };

  const getPricingBadge = (pricing: MarketplaceWorkflow['pricing']) => {
    switch (pricing.type) {
      case 'free':
        return <Badge variant="outline" className="text-green-600 border-green-600">Free</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">${pricing.price}</Badge>;
      case 'subscription':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">${pricing.price}/{pricing.subscriptionPeriod}</Badge>;
      default:
        return null;
    }
  };

  const handleSubmitReview = () => {
    if (reviewTitle.trim() && reviewComment.trim()) {
      onAddReview(reviewRating, reviewTitle, reviewComment);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="text-lg font-semibold">{workflow.name}</CardTitle>
              {workflow.featured && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
              {workflow.trending && (
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onShare}
              >
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReport}
              >
                <Flag className="h-4 w-4 mr-1" />
                Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Header Info */}
          <div className="p-4 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {workflow.category}
                  </Badge>
                  {getPricingBadge(workflow.pricing)}
                  <Badge variant="secondary" className="text-xs">
                    v{workflow.version}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4">{workflow.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{workflow.author.name}</span>
                    {workflow.author.verified && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Published {formatDate(workflow.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatNumber(workflow.stats.views)} views</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {getRatingStars(workflow.stats.rating)}
                    <span className="text-sm text-gray-600">
                      {workflow.stats.rating.toFixed(1)} ({workflow.stats.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Download className="h-4 w-4" />
                    {formatNumber(workflow.stats.downloads)} downloads
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Heart className="h-4 w-4" />
                    {formatNumber(workflow.stats.likes)} likes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isLiked ? onUnlike : onLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewWorkflow}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                
                {isInstalled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onUninstall}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Installed
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onInstall}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-1 flex-wrap">
                {workflow.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({workflow.stats.reviewCount})</TabsTrigger>
              <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* Workflow Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{workflow.metadata.nodeCount}</div>
                      <div className="text-sm text-gray-600">Nodes</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{workflow.metadata.edgeCount}</div>
                      <div className="text-sm text-gray-600">Connections</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{workflow.metadata.complexity}</div>
                      <div className="text-sm text-gray-600">Complexity</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{workflow.metadata.estimatedExecutionTime}ms</div>
                      <div className="text-sm text-gray-600">Est. Time</div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Minimum Version: {workflow.requirements.minVersion}</span>
                      </div>
                      {workflow.requirements.dependencies.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Dependencies: {workflow.requirements.dependencies.join(', ')}</span>
                        </div>
                      )}
                      {workflow.requirements.permissions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Permissions: {workflow.requirements.permissions.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reviews" className="flex-1 mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Add Review Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Reviews</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      Add Review
                    </Button>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">Rating</label>
                          <div className="flex items-center gap-1">
                            {getRatingStars(reviewRating, true)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">Title</label>
                          <input
                            type="text"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder="Brief title for your review"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-2 block">Comment</label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this workflow"
                            rows={4}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button onClick={handleSubmitReview}>
                            Submit Review
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No reviews yet. Be the first to review this workflow!
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{review.userName}</span>
                              {review.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                              <div className="flex items-center gap-1">
                                {getRatingStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold mb-2">{review.title}</h4>
                            <p className="text-gray-600 mb-3">{review.comment}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Was this helpful?</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRateReview(review.id, true)}
                              >
                                Yes ({review.helpful})
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRateReview(review.id, false)}
                              >
                                No ({review.notHelpful})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dependencies" className="flex-1 mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dependencies</h3>
                  {workflow.requirements.dependencies.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No dependencies required
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workflow.requirements.dependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-semibold">{dep}</div>
                            <div className="text-sm text-gray-500">Required dependency</div>
                          </div>
                          <Button size="sm" variant="outline">
                            Install
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="changelog" className="flex-1 mt-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Changelog</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold">Version {workflow.version}</div>
                      <div className="text-sm text-gray-500 mb-2">
                        Released {formatDate(workflow.publishedAt)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Initial release of {workflow.name}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
