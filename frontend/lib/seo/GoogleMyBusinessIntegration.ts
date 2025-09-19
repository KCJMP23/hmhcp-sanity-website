// Google My Business Integration
// Created: 2025-01-27
// Purpose: Google My Business API integration for healthcare facilities

export interface GMBProfile {
  id: string;
  locationId: string;
  businessId: string;
  name: string;
  status: 'active' | 'pending' | 'suspended' | 'error';
  lastSynced: Date;
  insights: GMBInsights;
  reviews: GMBReviews;
  posts: GMBPost[];
  photos: GMBPhoto[];
  questions: GMBQuestion[];
}

export interface GMBInsights {
  views: number;
  searches: number;
  actions: number;
  calls: number;
  directionRequests: number;
  websiteClicks: number;
  photoViews: number;
  postViews: number;
}

export interface GMBReviews {
  total: number;
  average: number;
  recent: GMBReview[];
  responseRate: number;
}

export interface GMBReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: Date;
  response?: string;
  responseDate?: Date;
}

export interface GMBPost {
  id: string;
  type: 'offer' | 'event' | 'product' | 'update';
  title: string;
  content: string;
  mediaUrl?: string;
  callToAction?: {
    text: string;
    url: string;
  };
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'draft';
}

export interface GMBPhoto {
  id: string;
  url: string;
  caption?: string;
  category: 'profile' | 'cover' | 'interior' | 'exterior' | 'team' | 'equipment';
  uploadedDate: Date;
  views?: number;
}

export interface GMBQuestion {
  id: string;
  question: string;
  answer?: string;
  askedBy: string;
  askedDate: Date;
  answeredDate?: Date;
  isAnswered: boolean;
}

export class GoogleMyBusinessIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://mybusiness.googleapis.com/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getProfile(locationId: string): Promise<GMBProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${locationId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GMB API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToGMBProfile(data);

    } catch (error) {
      throw new Error(`Failed to get GMB profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfile(locationId: string, updates: Partial<GMBProfile>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${locationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      return response.ok;

    } catch (error) {
      console.error('Failed to update GMB profile:', error);
      return false;
    }
  }

  async getInsights(locationId: string, startDate: Date, endDate: Date): Promise<GMBInsights> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts/${locationId}/insights?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GMB Insights API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToGMBInsights(data);

    } catch (error) {
      throw new Error(`Failed to get GMB insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReviews(locationId: string): Promise<GMBReviews> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${locationId}/reviews`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GMB Reviews API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToGMBReviews(data);

    } catch (error) {
      throw new Error(`Failed to get GMB reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async respondToReview(reviewId: string, response: string): Promise<boolean> {
    try {
      const apiResponse = await fetch(`${this.baseUrl}/reviews/${reviewId}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });

      return apiResponse.ok;

    } catch (error) {
      console.error('Failed to respond to review:', error);
      return false;
    }
  }

  async createPost(locationId: string, post: Omit<GMBPost, 'id'>): Promise<GMBPost> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${locationId}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(post)
      });

      if (!response.ok) {
        throw new Error(`GMB Post API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToGMBPost(data);

    } catch (error) {
      throw new Error(`Failed to create GMB post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadPhoto(locationId: string, photo: File, category: string): Promise<GMBPhoto> {
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('category', category);

      const response = await fetch(`${this.baseUrl}/accounts/${locationId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`GMB Photo API error: ${response.status}`);
      }

      const data = await response.json();
      return this.mapToGMBPhoto(data);

    } catch (error) {
      throw new Error(`Failed to upload GMB photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQuestions(locationId: string): Promise<GMBQuestion[]> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${locationId}/questions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GMB Questions API error: ${response.status}`);
      }

      const data = await response.json();
      return data.questions?.map((q: any) => this.mapToGMBQuestion(q)) || [];

    } catch (error) {
      throw new Error(`Failed to get GMB questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async answerQuestion(questionId: string, answer: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answer })
      });

      return response.ok;

    } catch (error) {
      console.error('Failed to answer question:', error);
      return false;
    }
  }

  // Private helper methods
  private mapToGMBProfile(data: any): GMBProfile {
    return {
      id: data.id || '',
      locationId: data.locationId || '',
      businessId: data.businessId || '',
      name: data.name || '',
      status: data.status || 'pending',
      lastSynced: new Date(),
      insights: this.mapToGMBInsights(data.insights || {}),
      reviews: this.mapToGMBReviews(data.reviews || {}),
      posts: (data.posts || []).map((p: any) => this.mapToGMBPost(p)),
      photos: (data.photos || []).map((p: any) => this.mapToGMBPhoto(p)),
      questions: (data.questions || []).map((q: any) => this.mapToGMBQuestion(q))
    };
  }

  private mapToGMBInsights(data: any): GMBInsights {
    return {
      views: data.views || 0,
      searches: data.searches || 0,
      actions: data.actions || 0,
      calls: data.calls || 0,
      directionRequests: data.directionRequests || 0,
      websiteClicks: data.websiteClicks || 0,
      photoViews: data.photoViews || 0,
      postViews: data.postViews || 0
    };
  }

  private mapToGMBReviews(data: any): GMBReviews {
    return {
      total: data.total || 0,
      average: data.average || 0,
      recent: (data.recent || []).map((r: any) => this.mapToGMBReview(r)),
      responseRate: data.responseRate || 0
    };
  }

  private mapToGMBReview(data: any): GMBReview {
    return {
      id: data.id || '',
      author: data.author || '',
      rating: data.rating || 0,
      text: data.text || '',
      date: new Date(data.date || Date.now()),
      response: data.response,
      responseDate: data.responseDate ? new Date(data.responseDate) : undefined
    };
  }

  private mapToGMBPost(data: any): GMBPost {
    return {
      id: data.id || '',
      type: data.type || 'update',
      title: data.title || '',
      content: data.content || '',
      mediaUrl: data.mediaUrl,
      callToAction: data.callToAction,
      startDate: new Date(data.startDate || Date.now()),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status || 'active'
    };
  }

  private mapToGMBPhoto(data: any): GMBPhoto {
    return {
      id: data.id || '',
      url: data.url || '',
      caption: data.caption,
      category: data.category || 'profile',
      uploadedDate: new Date(data.uploadedDate || Date.now()),
      views: data.views
    };
  }

  private mapToGMBQuestion(data: any): GMBQuestion {
    return {
      id: data.id || '',
      question: data.question || '',
      answer: data.answer,
      askedBy: data.askedBy || '',
      askedDate: new Date(data.askedDate || Date.now()),
      answeredDate: data.answeredDate ? new Date(data.answeredDate) : undefined,
      isAnswered: data.isAnswered || false
    };
  }
}
