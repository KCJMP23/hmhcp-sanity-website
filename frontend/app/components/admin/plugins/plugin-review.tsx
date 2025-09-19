// Plugin Review Component
// Story 6.2: WordPress-Style Plugin Marketplace & Management

'use client';

import React, { useState } from 'react';
import { 
  Star, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Edit,
  Trash2,
  Shield,
  Clock
} from 'lucide-react';
import { PluginReview } from '@/types/plugins/marketplace';

interface PluginReviewProps {
  pluginId: string;
  organizationId: string;
  onReviewSubmitted?: (review: PluginReview) => void;
  onReviewUpdated?: (review: PluginReview) => void;
  onReviewDeleted?: (reviewId: string) => void;
}

interface ReviewFormData {
  rating: number;
  review_text: string;
  helpful_votes: number;
  verified_install: boolean;
}

export default function PluginReview({ 
  pluginId, 
  organizationId, 
  onReviewSubmitted,
  onReviewUpdated,
  onReviewDeleted
}: PluginReviewProps) {
  const [reviews, setReviews] = useState<PluginReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    review_text: '',
    helpful_votes: 0,
    verified_install: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    loadReviews();
  }, [pluginId]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/plugins/marketplace/reviews?plugin_id=${pluginId}&limit=20`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || 'Failed to load reviews');
      }
    } catch (error) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/plugins/marketplace/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin_id: pluginId,
          organization_id: organizationId,
          rating: formData.rating,
          review_text: formData.review_text,
          verified_install: formData.verified_install
        })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews(prev => [newReview, ...prev]);
        setFormData({
          rating: 0,
          review_text: '',
          helpful_votes: 0,
          verified_install: false
        });
        setSuccess('Review submitted successfully');
        onReviewSubmitted?.(newReview);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit review');
      }
    } catch (error) {
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/plugins/marketplace/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: formData.rating,
          review_text: formData.review_text
        })
      });

      if (response.ok) {
        const updatedReview = await response.json();
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? updatedReview : review
        ));
        setEditingReview(null);
        setSuccess('Review updated successfully');
        onReviewUpdated?.(updatedReview);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update review');
      }
    } catch (error) {
      setError('Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/plugins/marketplace/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        setSuccess('Review deleted successfully');
        onReviewDeleted?.(reviewId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete review');
      }
    } catch (error) {
      setError('Failed to delete review');
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/plugins/marketplace/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful: true })
      });

      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpful_votes: review.helpful_votes + 1 }
            : review
        ));
      }
    } catch (error) {
      console.error('Failed to vote on review:', error);
    }
  };

  const startEditing = (review: PluginReview) => {
    setEditingReview(review.id);
    setFormData({
      rating: review.rating,
      review_text: review.review_text || '',
      helpful_votes: review.helpful_votes,
      verified_install: review.verified_install
    });
  };

  const cancelEditing = () => {
    setEditingReview(null);
    setFormData({
      rating: 0,
      review_text: '',
      helpful_votes: 0,
      verified_install: false
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => interactive && onRatingChange?.(i + 1)}
        className={`w-6 h-6 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${interactive ? 'hover:text-yellow-500 cursor-pointer' : ''}`}
      >
        <Star className="w-full h-full" />
      </button>
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {renderStars(Math.floor(averageRating))}
              <span className="ml-2 text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <span className="text-sm text-gray-600 w-8">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current mx-2" />
                <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h4>
        
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {renderStars(formData.rating, true, (rating) => 
                setFormData(prev => ({ ...prev, rating }))
              )}
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
            </label>
            <textarea
              value={formData.review_text}
              onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
              rows={4}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your experience with this plugin..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="verified_install"
              checked={formData.verified_install}
              onChange={(e) => setFormData(prev => ({ ...prev, verified_install: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="verified_install" className="ml-2 text-sm text-gray-700">
              I have installed and used this plugin
            </label>
          </div>

          {error && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {review.verified_install ? 'Verified Install' : 'User Review'}
                    </span>
                    {review.verified_install && (
                      <Shield className="w-4 h-4 text-green-500" title="Verified Install" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVoteHelpful(review.id)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">{review.helpful_votes}</span>
                  </div>
                  <button
                    onClick={() => startEditing(review)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="Edit Review"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {editingReview === review.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center space-x-1">
                      {renderStars(formData.rating, true, (rating) => 
                        setFormData(prev => ({ ...prev, rating }))
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review
                    </label>
                    <textarea
                      value={formData.review_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateReview(review.id)}
                      disabled={submitting}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {submitting ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {review.review_text && (
                    <p className="text-sm text-gray-700">{review.review_text}</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to review this plugin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
