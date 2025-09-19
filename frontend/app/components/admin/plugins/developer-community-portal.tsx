'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Code, 
  Star, 
  Heart, 
  Share2, 
  Download, 
  Upload,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  GitBranch,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Flag,
  Search,
  Filter,
  Plus,
  Settings,
  Bell,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  votes: number;
  replies: number;
  views: number;
  isPinned: boolean;
  isSolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  downloads: number;
  stars: number;
  tags: string[];
  createdAt: Date;
}

interface PluginShowcase {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  downloads: number;
  stars: number;
  rating: number;
  category: string;
  tags: string[];
  image: string;
  createdAt: Date;
}

interface Developer {
  id: string;
  name: string;
  avatar: string;
  role: string;
  reputation: number;
  plugins: number;
  posts: number;
  solutions: number;
  joinedAt: Date;
  isOnline: boolean;
}

const FORUM_CATEGORIES = [
  { value: 'general', label: 'General Discussion', icon: MessageSquare },
  { value: 'plugins', label: 'Plugin Development', icon: Code },
  { value: 'api', label: 'API & Integration', icon: GitBranch },
  { value: 'compliance', label: 'Healthcare Compliance', icon: Shield },
  { value: 'troubleshooting', label: 'Troubleshooting', icon: Bug },
  { value: 'feature-requests', label: 'Feature Requests', icon: Lightbulb }
];

const CODE_LANGUAGES = [
  'typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust', 'php'
];

export function DeveloperCommunityPortal() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [showcase, setShowcase] = useState<PluginShowcase[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('forum');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadForumPosts();
    loadCodeSnippets();
    loadShowcase();
    loadDevelopers();
  }, []);

  const loadForumPosts = async () => {
    // Simulate loading forum posts
    const mockPosts: ForumPost[] = [
      {
        id: 'post_1',
        title: 'How to implement HIPAA compliance in custom plugins?',
        content: 'I\'m developing a plugin that handles patient data and need to ensure HIPAA compliance. What are the best practices?',
        author: {
          id: 'user_1',
          name: 'Sarah Johnson',
          avatar: '/avatars/sarah.jpg',
          role: 'Senior Developer',
          reputation: 1250
        },
        category: 'compliance',
        tags: ['hipaa', 'compliance', 'patient-data'],
        votes: 15,
        replies: 8,
        views: 142,
        isPinned: true,
        isSolved: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'post_2',
        title: 'Plugin development best practices and patterns',
        content: 'What are the recommended patterns and best practices for developing healthcare plugins?',
        author: {
          id: 'user_2',
          name: 'Mike Chen',
          avatar: '/avatars/mike.jpg',
          role: 'Plugin Developer',
          reputation: 890
        },
        category: 'plugins',
        tags: ['best-practices', 'patterns', 'development'],
        votes: 23,
        replies: 12,
        views: 89,
        isPinned: false,
        isSolved: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60)
      }
    ];
    setPosts(mockPosts);
  };

  const loadCodeSnippets = async () => {
    // Simulate loading code snippets
    const mockSnippets: CodeSnippet[] = [
      {
        id: 'snippet_1',
        title: 'Patient Data Validation Helper',
        description: 'A utility function for validating patient data according to FHIR standards',
        code: `function validatePatientData(patient) {
  const errors = [];
  
  if (!patient.id) {
    errors.push('Patient ID is required');
  }
  
  if (!patient.name || !patient.name.family) {
    errors.push('Patient family name is required');
  }
  
  if (patient.birthDate && !isValidDate(patient.birthDate)) {
    errors.push('Invalid birth date format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}`,
        language: 'typescript',
        author: {
          id: 'user_3',
          name: 'Alex Rodriguez',
          avatar: '/avatars/alex.jpg'
        },
        downloads: 45,
        stars: 12,
        tags: ['fhir', 'validation', 'patient-data'],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
      }
    ];
    setCodeSnippets(mockSnippets);
  };

  const loadShowcase = async () => {
    // Simulate loading showcase
    const mockShowcase: PluginShowcase[] = [
      {
        id: 'plugin_1',
        name: 'Advanced Patient Analytics',
        description: 'Comprehensive patient data analysis with machine learning insights',
        author: {
          id: 'user_4',
          name: 'Dr. Emily Watson',
          avatar: '/avatars/emily.jpg'
        },
        downloads: 234,
        stars: 45,
        rating: 4.8,
        category: 'analytics',
        tags: ['ml', 'analytics', 'patient-data'],
        image: '/plugins/analytics.jpg',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8)
      }
    ];
    setShowcase(mockShowcase);
  };

  const loadDevelopers = async () => {
    // Simulate loading developers
    const mockDevelopers: Developer[] = [
      {
        id: 'user_1',
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        role: 'Senior Developer',
        reputation: 1250,
        plugins: 8,
        posts: 45,
        solutions: 23,
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        isOnline: true
      },
      {
        id: 'user_2',
        name: 'Mike Chen',
        avatar: '/avatars/mike.jpg',
        role: 'Plugin Developer',
        reputation: 890,
        plugins: 12,
        posts: 67,
        solutions: 34,
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        isOnline: false
      }
    ];
    setDevelopers(mockDevelopers);
  };

  const createPost = async (postData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => {
    try {
      // Simulate creating post
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPost: ForumPost = {
        id: `post_${Date.now()}`,
        title: postData.title,
        content: postData.content,
        author: {
          id: 'current_user',
          name: 'Current User',
          avatar: '/avatars/current.jpg',
          role: 'Developer',
          reputation: 500
        },
        category: postData.category,
        tags: postData.tags,
        votes: 0,
        replies: 0,
        views: 0,
        isPinned: false,
        isSolved: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setPosts([newPost, ...posts]);
      setIsCreatingPost(false);
      toast.success('Post created successfully');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const votePost = async (postId: string, type: 'up' | 'down') => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, votes: post.votes + (type === 'up' ? 1 : -1) }
        : post
    ));
  };

  const starCodeSnippet = async (snippetId: string) => {
    setCodeSnippets(codeSnippets.map(snippet =>
      snippet.id === snippetId
        ? { ...snippet, stars: snippet.stars + 1 }
        : snippet
    ));
  };

  const getCategoryIcon = (category: string) => {
    const categoryInfo = FORUM_CATEGORIES.find(c => c.value === category);
    return categoryInfo ? categoryInfo.icon : MessageSquare;
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = FORUM_CATEGORIES.find(c => c.value === category);
    return categoryInfo ? categoryInfo.label : category;
  };

  const filteredPosts = posts.filter(post => 
    post.category === selectedCategory &&
    (searchQuery === '' || 
     post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Developer Community</h2>
          <p className="text-muted-foreground">
            Connect, collaborate, and share with the healthcare developer community
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forum">Forum</TabsTrigger>
          <TabsTrigger value="code">Code Sharing</TabsTrigger>
          <TabsTrigger value="showcase">Showcase</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
        </TabsList>

        <TabsContent value="forum" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Forum Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {FORUM_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <div
                        key={category.value}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedCategory === category.value
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedCategory(category.value)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{category.label}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {developers.slice(0, 5).map((developer) => (
                    <div key={developer.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={developer.avatar} />
                        <AvatarFallback>{developer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{developer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {developer.reputation} reputation
                        </p>
                      </div>
                      {developer.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Forum Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search and Create Post */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button onClick={() => setIsCreatingPost(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts List */}
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const CategoryIcon = getCategoryIcon(post.category);
                  return (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => votePost(post.id, 'up')}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">{post.votes}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => votePost(post.id, 'down')}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {getCategoryLabel(post.category)}
                              </span>
                              {post.isPinned && (
                                <Badge variant="secondary">Pinned</Badge>
                              )}
                              {post.isSolved && (
                                <Badge variant="default">Solved</Badge>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2 hover:text-primary cursor-pointer">
                              {post.title}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {post.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={post.author.avatar} />
                                  <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{post.author.name}</span>
                                <Badge variant="outline">{post.author.role}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.replies}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{post.createdAt.toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Code Snippets</CardTitle>
                  <CardDescription>
                    Share and discover useful code snippets for healthcare development
                  </CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Share Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {codeSnippets.map((snippet) => (
                  <Card key={snippet.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{snippet.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3">
                            {snippet.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={snippet.author.avatar} />
                                <AvatarFallback>{snippet.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <span>{snippet.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              <span>{snippet.downloads}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{snippet.stars}</span>
                            </div>
                            <Badge variant="outline">{snippet.language}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => starCodeSnippet(snippet.id)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Star
                        </Button>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          <code>{snippet.code}</code>
                        </pre>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        {snippet.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="showcase" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Plugins</CardTitle>
              <CardDescription>
                Discover amazing plugins created by the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showcase.map((plugin) => (
                  <Card key={plugin.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                        <Code className="h-12 w-12 text-muted-foreground" />
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{plugin.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {plugin.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={plugin.author.avatar} />
                            <AvatarFallback>{plugin.author.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{plugin.author.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{plugin.downloads}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{plugin.stars}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        {plugin.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Developers</CardTitle>
              <CardDescription>
                Meet the talented developers in our community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {developers.map((developer) => (
                  <Card key={developer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={developer.avatar} />
                          <AvatarFallback>{developer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{developer.name}</h3>
                          <p className="text-muted-foreground text-sm">{developer.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{developer.reputation} reputation</Badge>
                            {developer.isOnline && (
                              <Badge variant="default">Online</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <p className="text-2xl font-bold">{developer.plugins}</p>
                          <p className="text-xs text-muted-foreground">Plugins</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{developer.posts}</p>
                          <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{developer.solutions}</p>
                          <p className="text-xs text-muted-foreground">Solutions</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                        <Button variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
