'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Heart, MessageCircle, Star, Download, Eye, Users, Calendar, ThumbsUp, ThumbsDown, Flag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowTemplate } from '@/lib/workflows/template-manager';
import { cn } from '@/lib/utils';

interface TemplateSharingProps {
  template: WorkflowTemplate;
  onShare?: (shareData: ShareData) => void;
  onRate?: (rating: number) => void;
  onReview?: (review: TemplateReview) => void;
  className?: string;
}

interface ShareData {
  method: 'link' | 'email' | 'social';
  recipients?: string[];
  message?: string;
  platform?: 'twitter' | 'linkedin' | 'facebook';
}

interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  helpful: number;
  notHelpful: number;
  isVerified: boolean;
}

interface TemplateComment {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  isAuthor: boolean;
}

export function TemplateSharing({ template, onShare, onRate, onReview, className }: TemplateSharingProps) {
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [comments, setComments] = useState<TemplateComment[]>([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: ''
  });
  const [newComment, setNewComment] = useState('');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    method: 'link',
    message: `Check out this workflow template: ${template.name}`
  });

  // Load reviews and comments
  useEffect(() => {
    loadReviews();
    loadComments();
  }, [template.id]);

  const loadReviews = () => {
    // Mock data - in real implementation, this would fetch from API
    const mockReviews: TemplateReview[] = [
      {
        id: '1',
        templateId: template.id,
        userId: 'user1',
        userName: 'Dr. Sarah Johnson',
        userAvatar: '/avatars/sarah.jpg',
        rating: 5,
        title: 'Excellent workflow for patient intake',
        content: 'This template saved us hours of setup time. The HIPAA compliance checks are thorough and the workflow is easy to customize for our specific needs.',
        createdAt: new Date('2024-01-15'),
        helpful: 12,
        notHelpful: 0,
        isVerified: true
      },
      {
        id: '2',
        templateId: template.id,
        userId: 'user2',
        userName: 'Mike Chen',
        userAvatar: '/avatars/mike.jpg',
        rating: 4,
        title: 'Great template with minor issues',
        content: 'Overall very good, but the data validation could be more flexible. The documentation is comprehensive though.',
        createdAt: new Date('2024-01-20'),
        helpful: 8,
        notHelpful: 1,
        isVerified: false
      }
    ];
    setReviews(mockReviews);
  };

  const loadComments = () => {
    // Mock data - in real implementation, this would fetch from API
    const mockComments: TemplateComment[] = [
      {
        id: '1',
        reviewId: '1',
        userId: 'user3',
        userName: 'Dr. Emily Rodriguez',
        userAvatar: '/avatars/emily.jpg',
        content: 'I agree! The HIPAA compliance features are exactly what we needed.',
        createdAt: new Date('2024-01-16'),
        isAuthor: false
      },
      {
        id: '2',
        reviewId: '2',
        userId: 'author1',
        userName: 'Template Author',
        userAvatar: '/avatars/author.jpg',
        content: 'Thanks for the feedback! We\'re working on making the validation more flexible in the next update.',
        createdAt: new Date('2024-01-21'),
        isAuthor: true
      }
    ];
    setComments(mockComments);
  };

  const handleShare = () => {
    onShare?.(shareData);
    setIsShareDialogOpen(false);
  };

  const handleRate = (rating: number) => {
    onRate?.(rating);
  };

  const handleSubmitReview = () => {
    if (newReview.rating === 0 || !newReview.title || !newReview.content) return;

    const review: TemplateReview = {
      id: Date.now().toString(),
      templateId: template.id,
      userId: 'current-user',
      userName: 'Current User',
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      createdAt: new Date(),
      helpful: 0,
      notHelpful: 0,
      isVerified: false
    };

    setReviews(prev => [review, ...prev]);
    onReview?.(review);
    setNewReview({ rating: 0, title: '', content: '' });
    setIsReviewDialogOpen(false);
  };

  const handleSubmitComment = (reviewId: string) => {
    if (!newComment.trim()) return;

    const comment: TemplateComment = {
      id: Date.now().toString(),
      reviewId,
      userId: 'current-user',
      userName: 'Current User',
      content: newComment,
      createdAt: new Date(),
      isAuthor: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const handleHelpful = (reviewId: string, helpful: boolean) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            helpful: helpful ? review.helpful + 1 : review.helpful,
            notHelpful: !helpful ? review.notHelpful + 1 : review.notHelpful
          }
        : review
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Template Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{template.downloadCount.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{reviews.length}</div>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{template.reviewCount}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Template</DialogTitle>
              <DialogDescription>
                Share this template with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Share Method</label>
                <Select value={shareData.method} onValueChange={(value) => setShareData(prev => ({ ...prev, method: value as any }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Share Link</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shareData.method === 'email' && (
                <div>
                  <label className="text-sm font-medium">Recipients</label>
                  <Input
                    placeholder="Enter email addresses separated by commas"
                    className="mt-1"
                  />
                </div>
              )}

              {shareData.method === 'social' && (
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={shareData.platform} onValueChange={(value) => setShareData(prev => ({ ...prev, platform: value as any }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={shareData.message}
                  onChange={(e) => setShareData(prev => ({ ...prev, message: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShare}>
                  Share
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience with this template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <Star 
                        className={cn(
                          "w-6 h-6",
                          star <= newReview.rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newReview.title}
                  onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for your review"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Review</label>
                <Textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your detailed experience..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={newReview.rating === 0 || !newReview.title || !newReview.content}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline">
          <Heart className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Reviews and Comments */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{review.userName}</h4>
                          {review.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-4 h-4",
                                  star <= review.rating 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>{review.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">{review.title}</h5>
                    <p className="text-sm text-muted-foreground">{review.content}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id, true)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful ({review.helpful})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id, false)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Not Helpful ({review.notHelpful})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReview(selectedReview === review.id ? null : review.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Flag className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>

                  {/* Comments */}
                  {selectedReview === review.id && (
                    <div className="border-t pt-4 space-y-3">
                      {comments.filter(comment => comment.reviewId === review.id).map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{comment.userName}</span>
                              {comment.isAuthor && (
                                <Badge variant="secondary" className="text-xs">
                                  Author
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewComment('')}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitComment(review.id)}
                              disabled={!newComment.trim()}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No discussions yet</p>
            <p className="text-sm">Start a discussion about this template</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
