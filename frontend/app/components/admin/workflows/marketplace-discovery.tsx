'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Heart,
  TrendingUp,
  Crown,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { MarketplaceWorkflow, MarketplaceSearchFilters, MarketplaceSearchResult } from '@/lib/workflows/marketplace';

interface MarketplaceDiscoveryProps {
  searchResults: MarketplaceSearchResult;
  onSearch: (query: string, filters: MarketplaceSearchFilters, page: number) => void;
  onInstallWorkflow: (workflowId: string) => void;
  onViewWorkflow: (workflowId: string) => void;
  onLikeWorkflow: (workflowId: string) => void;
  onFilterChange: (filters: MarketplaceSearchFilters) => void;
}

export function MarketplaceDiscovery({
  searchResults,
  onSearch,
  onInstallWorkflow,
  onViewWorkflow,
  onLikeWorkflow,
  onFilterChange
}: MarketplaceDiscoveryProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<MarketplaceSearchFilters>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'downloads' | 'newest' | 'trending'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (newQuery?: string, newFilters?: MarketplaceSearchFilters, page?: number) => {
    const searchQuery = newQuery !== undefined ? newQuery : query;
    const searchFilters = newFilters !== undefined ? newFilters : filters;
    const searchPage = page !== undefined ? page : 1;
    
    onSearch(searchQuery, searchFilters, searchPage);
    setCurrentPage(searchPage);
  };

  const handleFilterChange = (newFilters: Partial<MarketplaceSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
    handleSearch(query, updatedFilters, 1);
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    handleSearch(query, filters, 1);
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
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

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Workflow Marketplace</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {searchResults.total} workflows
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Search and Controls */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search workflows..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={() => handleSearch()}>
                  Search
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="downloads">Downloads</option>
                  <option value="newest">Newest</option>
                  <option value="trending">Trending</option>
                </select>
                
                <div className="flex items-center border rounded-md">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Category</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                    className="w-full px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="">All Categories</option>
                    {searchResults.facets.categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Pricing</label>
                  <select
                    value={filters.pricing?.[0] || ''}
                    onChange={(e) => handleFilterChange({ 
                      pricing: e.target.value ? [e.target.value as any] : undefined 
                    })}
                    className="w-full px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="">All Pricing</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Rating</label>
                  <select
                    value={filters.rating?.min || ''}
                    onChange={(e) => handleFilterChange({ 
                      rating: e.target.value ? { min: Number(e.target.value), max: 5 } : undefined 
                    })}
                    className="w-full px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Features</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.featured || false}
                        onChange={(e) => handleFilterChange({ featured: e.target.checked || undefined })}
                        className="rounded"
                      />
                      Featured
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.trending || false}
                        onChange={(e) => handleFilterChange({ trending: e.target.checked || undefined })}
                        className="rounded"
                      />
                      Trending
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 p-4">
            {searchResults.workflows.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No workflows found matching your criteria
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                : 'space-y-4'
              }>
                {searchResults.workflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{workflow.name}</h3>
                            {workflow.featured && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            {workflow.trending && (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {workflow.description}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {getRatingStars(workflow.stats.rating)}
                              <span className="text-sm text-gray-600">
                                {workflow.stats.rating.toFixed(1)} ({workflow.stats.reviewCount})
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">•</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Download className="h-4 w-4" />
                              {formatNumber(workflow.stats.downloads)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {workflow.category}
                            </Badge>
                            {getPricingBadge(workflow.pricing)}
                            {workflow.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>{workflow.author.name}</span>
                          {workflow.author.verified && (
                            <Badge variant="outline" className="text-xs text-blue-600">
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewWorkflow(workflow.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onLikeWorkflow(workflow.id)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {workflow.stats.likes}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onInstallWorkflow(workflow.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Install
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Published {formatDate(workflow.publishedAt)} • 
                        {workflow.metadata.nodeCount} nodes • 
                        {workflow.metadata.estimatedExecutionTime}ms
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {searchResults.hasMore && (
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {searchResults.workflows.length} of {searchResults.total} workflows
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleSearch(query, filters, currentPage + 1)}
                >
                  Load More
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
