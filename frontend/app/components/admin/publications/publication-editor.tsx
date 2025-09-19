// PublicationEditor Component
// Story 4.3: Publications & Research Management
// Created: 2025-01-04

'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Upload, Link, Calendar, User, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Publication, Author, ResearchTopic, CreatePublicationRequest, UpdatePublicationRequest } from '@/types/publications';

interface PublicationEditorProps {
  publication?: Publication;
  authors: Author[];
  topics: ResearchTopic[];
  onSave: (publication: CreatePublicationRequest | UpdatePublicationRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PublicationEditor({
  publication,
  authors,
  topics,
  onSave,
  onCancel,
  loading = false
}: PublicationEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    publication_date: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    doi: '',
    pubmed_id: '',
    publication_type: 'peer-reviewed' as const,
    keywords: [] as string[],
    full_text_url: '',
    medical_specialty: '',
    research_funding: '',
    ethical_approval: '',
    clinical_trial_id: '',
    status: 'draft' as const,
    featured: false,
    authors: [] as string[],
    topics: [] as string[]
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (publication) {
      setFormData({
        title: publication.title || '',
        abstract: publication.abstract || '',
        publication_date: publication.publication_date || '',
        journal: publication.journal || '',
        volume: publication.volume || '',
        issue: publication.issue || '',
        pages: publication.pages || '',
        doi: publication.doi || '',
        pubmed_id: publication.pubmed_id || '',
        publication_type: publication.publication_type,
        keywords: publication.keywords || [],
        full_text_url: publication.full_text_url || '',
        medical_specialty: publication.medical_specialty || '',
        research_funding: publication.research_funding || '',
        ethical_approval: publication.ethical_approval || '',
        clinical_trial_id: publication.clinical_trial_id || '',
        status: publication.status,
        featured: publication.featured,
        authors: publication.authors?.map(a => a.id) || [],
        topics: publication.topics?.map(t => t.id) || []
      });
    }
  }, [publication]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleKeywordAdd = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      handleInputChange('keywords', [...formData.keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    handleInputChange('keywords', formData.keywords.filter(k => k !== keyword));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.publication_type) {
      newErrors.publication_type = 'Publication type is required';
    }

    if (formData.doi && !/^10\.\d+\/[\S]+$/.test(formData.doi)) {
      newErrors.doi = 'Invalid DOI format';
    }

    if (formData.pubmed_id && !/^\d+$/.test(formData.pubmed_id)) {
      newErrors.pubmed_id = 'PubMed ID must be numeric';
    }

    if (formData.publication_date && isNaN(Date.parse(formData.publication_date))) {
      newErrors.publication_date = 'Invalid date format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      keywords: formData.keywords.filter(k => k.trim()),
      authors: formData.authors,
      topics: formData.topics
    };

    if (publication) {
      onSave({ id: publication.id, ...submitData } as UpdatePublicationRequest);
    } else {
      onSave(submitData as CreatePublicationRequest);
    }
  };

  const publicationTypes = [
    { value: 'peer-reviewed', label: 'Peer-reviewed' },
    { value: 'white-paper', label: 'White Paper' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'review', label: 'Review' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'conference-paper', label: 'Conference Paper' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'under-review', label: 'Under Review' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {publication ? 'Edit Publication' : 'Create Publication'}
        </h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter publication title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                placeholder="Enter publication abstract"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="publication_type">Publication Type *</Label>
                <Select
                  value={formData.publication_type}
                  onValueChange={(value) => handleInputChange('publication_type', value)}
                >
                  <SelectTrigger className={errors.publication_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.publication_type && <p className="text-red-500 text-sm mt-1">{errors.publication_type}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <Label htmlFor="featured">Featured publication</Label>
            </div>
          </CardContent>
        </Card>

        {/* Publication Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Publication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  type="date"
                  value={formData.publication_date}
                  onChange={(e) => handleInputChange('publication_date', e.target.value)}
                  className={errors.publication_date ? 'border-red-500' : ''}
                />
                {errors.publication_date && <p className="text-red-500 text-sm mt-1">{errors.publication_date}</p>}
              </div>

              <div>
                <Label htmlFor="journal">Journal</Label>
                <Input
                  id="journal"
                  value={formData.journal}
                  onChange={(e) => handleInputChange('journal', e.target.value)}
                  placeholder="Journal name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="Volume number"
                />
              </div>

              <div>
                <Label htmlFor="issue">Issue</Label>
                <Input
                  id="issue"
                  value={formData.issue}
                  onChange={(e) => handleInputChange('issue', e.target.value)}
                  placeholder="Issue number"
                />
              </div>

              <div>
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  value={formData.pages}
                  onChange={(e) => handleInputChange('pages', e.target.value)}
                  placeholder="e.g., 123-145"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => handleInputChange('doi', e.target.value)}
                  placeholder="10.1000/182"
                  className={errors.doi ? 'border-red-500' : ''}
                />
                {errors.doi && <p className="text-red-500 text-sm mt-1">{errors.doi}</p>}
              </div>

              <div>
                <Label htmlFor="pubmed_id">PubMed ID</Label>
                <Input
                  id="pubmed_id"
                  value={formData.pubmed_id}
                  onChange={(e) => handleInputChange('pubmed_id', e.target.value)}
                  placeholder="12345678"
                  className={errors.pubmed_id ? 'border-red-500' : ''}
                />
                {errors.pubmed_id && <p className="text-red-500 text-sm mt-1">{errors.pubmed_id}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="full_text_url">Full Text URL</Label>
              <Input
                id="full_text_url"
                value={formData.full_text_url}
                onChange={(e) => handleInputChange('full_text_url', e.target.value)}
                placeholder="https://example.com/publication"
              />
            </div>
          </CardContent>
        </Card>

        {/* Authors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {authors.map(author => (
                <div key={author.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`author-${author.id}`}
                    checked={formData.authors.includes(author.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleInputChange('authors', [...formData.authors, author.id]);
                      } else {
                        handleInputChange('authors', formData.authors.filter(id => id !== author.id));
                      }
                    }}
                  />
                  <Label htmlFor={`author-${author.id}`} className="flex-1">
                    {author.name} {author.credentials && `(${author.credentials})`}
                    {author.affiliation && <span className="text-gray-500 text-sm ml-2">- {author.affiliation}</span>}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Research Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Research Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topics.map(topic => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={formData.topics.includes(topic.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleInputChange('topics', [...formData.topics, topic.id]);
                      } else {
                        handleInputChange('topics', formData.topics.filter(id => id !== topic.id));
                      }
                    }}
                  />
                  <Label htmlFor={`topic-${topic.id}`} className="flex-1">
                    {topic.name}
                    {topic.medical_specialty && <span className="text-gray-500 text-sm ml-2">- {topic.medical_specialty}</span>}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleKeywordAdd())}
              />
              <Button type="button" onClick={handleKeywordAdd} variant="outline">
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{keyword}</span>
                  <button
                    type="button"
                    onClick={() => handleKeywordRemove(keyword)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Healthcare Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Healthcare Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medical_specialty">Medical Specialty</Label>
                <Input
                  id="medical_specialty"
                  value={formData.medical_specialty}
                  onChange={(e) => handleInputChange('medical_specialty', e.target.value)}
                  placeholder="e.g., Cardiology"
                />
              </div>

              <div>
                <Label htmlFor="clinical_trial_id">Clinical Trial ID</Label>
                <Input
                  id="clinical_trial_id"
                  value={formData.clinical_trial_id}
                  onChange={(e) => handleInputChange('clinical_trial_id', e.target.value)}
                  placeholder="NCT12345678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="research_funding">Research Funding</Label>
              <Input
                id="research_funding"
                value={formData.research_funding}
                onChange={(e) => handleInputChange('research_funding', e.target.value)}
                placeholder="Funding source information"
              />
            </div>

            <div>
              <Label htmlFor="ethical_approval">Ethical Approval</Label>
              <Input
                id="ethical_approval"
                value={formData.ethical_approval}
                onChange={(e) => handleInputChange('ethical_approval', e.target.value)}
                placeholder="Ethics committee approval details"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
