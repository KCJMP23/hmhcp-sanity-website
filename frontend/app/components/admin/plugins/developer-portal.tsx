/**
 * Developer Portal Component
 * 
 * Comprehensive developer portal with forums, code sharing, collaboration tools,
 * and community features for healthcare plugin developers.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Code, 
  Users, 
  BookOpen, 
  Star, 
  Share2, 
  Download, 
  Upload,
  Search,
  Filter,
  Plus,
  Heart,
  MessageCircle,
  GitBranch,
  Clock,
  TrendingUp
} from 'lucide-react';

interface DeveloperProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio: string;
  location: string;
  joinDate: Date;
  reputation: number;
  plugins: number;
  contributions: number;
  specializations: string[];
  badges: Badge[];
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: DeveloperProfile;
  category: string;
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  solved: boolean;
}

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  author: DeveloperProfile;
  tags: string[];
  likes: number;
  downloads: number;
  createdAt: Date;
  healthcareSpecific: boolean;
  complianceLevel: string;
}

interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  author: DeveloperProfile;
  downloads: number;
  rating: number;
  tags: string[];
  createdAt: Date;
  healthcareCompliance: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  owner: DeveloperProfile;
  contributors: DeveloperProfile[];
  status: 'planning' | 'active' | 'completed' | 'archived';
  technologies: string[];
  healthcareFocus: string[];
  createdAt: Date;
  lastActivity: Date;
}

interface DeveloperPortalProps {
  className?: string;
}

export function DeveloperPortal({ className }: DeveloperPortalProps) {
  const [activeTab, setActiveTab] = useState('forum');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [templates, setTemplates] = useState<PluginTemplate[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    // In a real implementation, this would load data from APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const handleFilter = (category: string) => {
    setFilterCategory(category);
    // Implement filtering functionality
  };

  const handleLike = (itemId: string, type: 'post' | 'snippet' | 'template') => {
    // Implement like functionality
    console.log(`Liked ${type} ${itemId}`);
  };

  const handleShare = (itemId: string, type: string) => {
    // Implement share functionality
    console.log(`Shared ${type} ${itemId}`);
  };

  const handleDownload = (itemId: string, type: string) => {
    // Implement download functionality
    console.log(`Downloaded ${type} ${itemId}`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Developer Portal</h1>
          <p className="text-gray-600">Connect, collaborate, and build healthcare solutions together</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Share Code
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts, code snippets, templates..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Categories</option>
            <option value="ai-agents">AI Agents</option>
            <option value="integrations">Integrations</option>
            <option value="compliance">Compliance</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forum">Community Forum</TabsTrigger>
          <TabsTrigger value="code">Code Sharing</TabsTrigger>
          <TabsTrigger value="templates">Plugin Templates</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
        </TabsList>

        {/* Community Forum */}
        <TabsContent value="forum" className="space-y-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading forum posts...</div>
            ) : (
              mockForumPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{post.title}</h3>
                            {post.pinned && <Badge variant="secondary">Pinned</Badge>}
                            {post.solved && <Badge variant="default">Solved</Badge>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>by {post.author.name}</span>
                            <span>{post.createdAt.toLocaleDateString()}</span>
                            <Badge variant="outline">{post.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id, 'post')}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(post.id, 'post')}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.replies} replies
                      </span>
                      <span>{post.views} views</span>
                      <div className="flex gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Code Sharing */}
        <TabsContent value="code" className="space-y-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading code snippets...</div>
            ) : (
              mockCodeSnippets.map((snippet) => (
                <Card key={snippet.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={snippet.author.avatar} />
                          <AvatarFallback>{snippet.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{snippet.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{snippet.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span>by {snippet.author.name}</span>
                            <span>{snippet.createdAt.toLocaleDateString()}</span>
                            <Badge variant="outline">{snippet.language}</Badge>
                            {snippet.healthcareSpecific && (
                              <Badge variant="default">Healthcare</Badge>
                            )}
                            <Badge variant="secondary">{snippet.complianceLevel}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(snippet.id, 'snippet')}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {snippet.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(snippet.id, 'snippet')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {snippet.downloads}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(snippet.id, 'snippet')}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                      <code>{snippet.code}</code>
                    </pre>
                    <div className="flex gap-1 mt-3">
                      {snippet.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Plugin Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="text-center py-8 col-span-full">Loading templates...</div>
            ) : (
              mockTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{template.category}</Badge>
                          <Badge variant="secondary">{template.complexity}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{template.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>by {template.author.name}</span>
                      <span>{template.downloads} downloads</span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1 mb-3">
                      {template.healthcareCompliance.map((compliance) => (
                        <Badge key={compliance} variant="default" className="text-xs">
                          {compliance}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <GitBranch className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Collaboration */}
        <TabsContent value="collaboration" className="space-y-4">
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-8">Loading collaboration projects...</div>
            ) : (
              mockCollaborations.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={project.owner.avatar} />
                          <AvatarFallback>{project.owner.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span>by {project.owner.name}</span>
                            <span>{project.createdAt.toLocaleDateString()}</span>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          {project.contributors.length} contributors
                        </Button>
                        <Button variant="outline" size="sm">
                          <GitBranch className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 mb-3">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1 mb-3">
                      {project.healthcareFocus.map((focus) => (
                        <Badge key={focus} variant="default" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Last activity {project.lastActivity.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data for demonstration
const mockForumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'How to implement HIPAA compliance in custom plugins?',
    content: 'I\'m working on a healthcare plugin that processes patient data and need guidance on implementing HIPAA compliance. What are the key requirements and best practices?',
    author: {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      bio: 'Healthcare Developer',
      location: 'San Francisco, CA',
      joinDate: new Date('2023-01-15'),
      reputation: 1250,
      plugins: 5,
      contributions: 23,
      specializations: ['HIPAA', 'FHIR', 'AI Agents'],
      badges: []
    },
    category: 'Compliance',
    tags: ['HIPAA', 'compliance', 'patient-data'],
    replies: 12,
    views: 156,
    likes: 8,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    pinned: false,
    solved: false
  },
  {
    id: '2',
    title: 'Best practices for AI agent development in healthcare',
    content: 'Looking for advice on building AI agents that can safely process healthcare data while maintaining compliance and accuracy.',
    author: {
      id: '2',
      name: 'Dr. Michael Chen',
      username: 'mchen',
      bio: 'Medical AI Researcher',
      location: 'Boston, MA',
      joinDate: new Date('2023-03-20'),
      reputation: 2100,
      plugins: 8,
      contributions: 45,
      specializations: ['AI Agents', 'Machine Learning', 'Medical Research'],
      badges: []
    },
    category: 'AI Agents',
    tags: ['AI', 'agents', 'healthcare', 'machine-learning'],
    replies: 7,
    views: 89,
    likes: 15,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    pinned: true,
    solved: true
  }
];

const mockCodeSnippets: CodeSnippet[] = [
  {
    id: '1',
    title: 'FHIR Patient Data Validation',
    description: 'TypeScript utility for validating FHIR patient data with comprehensive error handling',
    code: `import { Patient } from '@hmhcp/fhir-client';

export function validatePatientData(patient: Patient): ValidationResult {
  const errors: string[] = [];
  
  if (!patient.id) {
    errors.push('Patient ID is required');
  }
  
  if (!patient.name || patient.name.length === 0) {
    errors.push('Patient name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}`,
    language: 'TypeScript',
    author: {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      bio: 'Healthcare Developer',
      location: 'San Francisco, CA',
      joinDate: new Date('2023-01-15'),
      reputation: 1250,
      plugins: 5,
      contributions: 23,
      specializations: ['HIPAA', 'FHIR', 'AI Agents'],
      badges: []
    },
    tags: ['FHIR', 'validation', 'TypeScript', 'patient-data'],
    likes: 24,
    downloads: 156,
    createdAt: new Date('2024-01-10'),
    healthcareSpecific: true,
    complianceLevel: 'Enhanced'
  }
];

const mockTemplates: PluginTemplate[] = [
  {
    id: '1',
    name: 'Healthcare Data Processor',
    description: 'Template for processing and validating healthcare data with compliance features',
    category: 'Data Processing',
    author: {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      bio: 'Healthcare Developer',
      location: 'San Francisco, CA',
      joinDate: new Date('2023-01-15'),
      reputation: 1250,
      plugins: 5,
      contributions: 23,
      specializations: ['HIPAA', 'FHIR', 'AI Agents'],
      badges: []
    },
    downloads: 342,
    rating: 4.8,
    tags: ['data-processing', 'compliance', 'validation'],
    createdAt: new Date('2024-01-05'),
    healthcareCompliance: ['HIPAA', 'FHIR'],
    complexity: 'intermediate'
  }
];

const mockCollaborations: CollaborationProject[] = [
  {
    id: '1',
    name: 'Open Source FHIR Toolkit',
    description: 'Building a comprehensive toolkit for FHIR integration in healthcare applications',
    owner: {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      bio: 'Healthcare Developer',
      location: 'San Francisco, CA',
      joinDate: new Date('2023-01-15'),
      reputation: 1250,
      plugins: 5,
      contributions: 23,
      specializations: ['HIPAA', 'FHIR', 'AI Agents'],
      badges: []
    },
    contributors: [],
    status: 'active',
    technologies: ['TypeScript', 'Node.js', 'FHIR'],
    healthcareFocus: ['FHIR', 'Interoperability', 'Data Exchange'],
    createdAt: new Date('2024-01-01'),
    lastActivity: new Date('2024-01-15')
  }
];

