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
  Headphones, 
  MessageSquare, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Star,
  User,
  Building,
  Phone,
  Mail,
  Video,
  FileText,
  Code,
  Shield,
  Award,
  TrendingUp,
  Users,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  assignedTo: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  } | null;
  requester: {
    id: string;
    name: string;
    email: string;
    organization: string;
  };
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  tags: string[];
}

interface Consultation {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'compliance' | 'integration' | 'architecture';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  consultant: {
    id: string;
    name: string;
    avatar: string;
    expertise: string[];
    rating: number;
  };
  client: {
    id: string;
    name: string;
    organization: string;
  };
  scheduledAt: Date;
  duration: number;
  meetingLink: string;
  notes: string;
}

interface CodeReview {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  reviewer: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  author: {
    id: string;
    name: string;
    organization: string;
  };
  createdAt: Date;
  updatedAt: Date;
  findings: CodeFinding[];
  complianceScore: number;
}

interface CodeFinding {
  id: string;
  type: 'security' | 'performance' | 'compliance' | 'best-practice';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  suggestion: string;
  status: 'open' | 'addressed' | 'dismissed';
}

interface EnterpriseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  system: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedHours: number;
  tags: string[];
}

const SUPPORT_CATEGORIES = [
  { value: 'technical', label: 'Technical Support', icon: Code },
  { value: 'compliance', label: 'Compliance & Security', icon: Shield },
  { value: 'integration', label: 'System Integration', icon: Building },
  { value: 'billing', label: 'Billing & Account', icon: FileText },
  { value: 'feature-request', label: 'Feature Request', icon: TrendingUp }
];

const CONSULTATION_TYPES = [
  { value: 'technical', label: 'Technical Consultation', icon: Code },
  { value: 'compliance', label: 'Compliance Review', icon: Shield },
  { value: 'integration', label: 'Integration Planning', icon: Building },
  { value: 'architecture', label: 'Architecture Design', icon: Award }
];

const ENTERPRISE_TEMPLATES: EnterpriseTemplate[] = [
  {
    id: 'epic-integration',
    name: 'Epic EHR Integration',
    description: 'Complete integration with Epic EHR system using FHIR R4',
    category: 'ehr',
    system: 'Epic',
    complexity: 'complex',
    estimatedHours: 40,
    tags: ['epic', 'fhir', 'ehr', 'integration']
  },
  {
    id: 'cerner-integration',
    name: 'Cerner PowerChart Integration',
    description: 'Integration with Cerner PowerChart for patient data exchange',
    category: 'ehr',
    system: 'Cerner',
    complexity: 'medium',
    estimatedHours: 24,
    tags: ['cerner', 'powerchart', 'ehr', 'integration']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams Integration',
    description: 'Integrate with Microsoft Teams for healthcare collaboration',
    category: 'collaboration',
    system: 'Microsoft Teams',
    complexity: 'simple',
    estimatedHours: 12,
    tags: ['microsoft', 'teams', 'collaboration', 'office365']
  }
];

export function EnterpriseSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [codeReviews, setCodeReviews] = useState<CodeReview[]>([]);
  const [activeTab, setActiveTab] = useState('tickets');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSchedulingConsultation, setIsSchedulingConsultation] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('technical');

  // Load data on component mount
  useEffect(() => {
    loadTickets();
    loadConsultations();
    loadCodeReviews();
  }, []);

  const loadTickets = async () => {
    // Simulate loading support tickets
    const mockTickets: SupportTicket[] = [
      {
        id: 'ticket_1',
        title: 'FHIR Integration Issues with Epic',
        description: 'Having trouble with FHIR R4 integration with Epic EHR system. Getting authentication errors.',
        priority: 'high',
        status: 'in-progress',
        category: 'integration',
        assignedTo: {
          id: 'consultant_1',
          name: 'Dr. Sarah Wilson',
          avatar: '/avatars/sarah.jpg',
          role: 'Senior Integration Consultant'
        },
        requester: {
          id: 'client_1',
          name: 'John Smith',
          email: 'john.smith@hospital.com',
          organization: 'Metro General Hospital'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        tags: ['epic', 'fhir', 'authentication']
      },
      {
        id: 'ticket_2',
        title: 'HIPAA Compliance Review Request',
        description: 'Need a comprehensive HIPAA compliance review for our custom plugin.',
        priority: 'critical',
        status: 'open',
        assignedTo: null,
        requester: {
          id: 'client_2',
          name: 'Dr. Emily Chen',
          email: 'emily.chen@clinic.com',
          organization: 'Downtown Medical Clinic'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 12),
        tags: ['hipaa', 'compliance', 'security']
      }
    ];
    setTickets(mockTickets);
  };

  const loadConsultations = async () => {
    // Simulate loading consultations
    const mockConsultations: Consultation[] = [
      {
        id: 'consult_1',
        title: 'Epic EHR Integration Strategy',
        description: 'Planning a comprehensive Epic EHR integration for our healthcare platform.',
        type: 'integration',
        status: 'scheduled',
        consultant: {
          id: 'consultant_1',
          name: 'Dr. Sarah Wilson',
          avatar: '/avatars/sarah.jpg',
          expertise: ['EHR Integration', 'FHIR', 'Epic'],
          rating: 4.9
        },
        client: {
          id: 'client_1',
          name: 'John Smith',
          organization: 'Metro General Hospital'
        },
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        duration: 120,
        meetingLink: 'https://meet.hmhcp.com/consult-1',
        notes: 'Focus on FHIR R4 implementation and security considerations'
      }
    ];
    setConsultations(mockConsultations);
  };

  const loadCodeReviews = async () => {
    // Simulate loading code reviews
    const mockCodeReviews: CodeReview[] = [
      {
        id: 'review_1',
        title: 'Patient Data Validation Plugin',
        description: 'Review of patient data validation plugin for HIPAA compliance',
        code: `function validatePatientData(patient) {
  // Validate patient ID
  if (!patient.id) {
    throw new Error('Patient ID is required');
  }
  
  // Validate name
  if (!patient.name || !patient.name.family) {
    throw new Error('Patient family name is required');
  }
  
  return true;
}`,
        language: 'typescript',
        status: 'in-review',
        reviewer: {
          id: 'reviewer_1',
          name: 'Alex Rodriguez',
          avatar: '/avatars/alex.jpg'
        },
        author: {
          id: 'client_1',
          name: 'John Smith',
          organization: 'Metro General Hospital'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30),
        findings: [
          {
            id: 'finding_1',
            type: 'compliance',
            severity: 'high',
            description: 'Missing audit logging for patient data access',
            line: 5,
            suggestion: 'Add audit logging before processing patient data',
            status: 'open'
          }
        ],
        complianceScore: 75
      }
    ];
    setCodeReviews(mockCodeReviews);
  };

  const createTicket = async (ticketData: {
    title: string;
    description: string;
    priority: string;
    category: string;
    tags: string[];
  }) => {
    try {
      // Simulate creating ticket
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTicket: SupportTicket = {
        id: `ticket_${Date.now()}`,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority as any,
        status: 'open',
        category: ticketData.category,
        assignedTo: null,
        requester: {
          id: 'current_user',
          name: 'Current User',
          email: 'user@example.com',
          organization: 'Current Organization'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        tags: ticketData.tags
      };
      
      setTickets([newTicket, ...tickets]);
      setIsCreatingTicket(false);
      toast.success('Support ticket created successfully');
    } catch (error) {
      toast.error('Failed to create support ticket');
    }
  };

  const scheduleConsultation = async (consultationData: {
    title: string;
    description: string;
    type: string;
    scheduledAt: Date;
    duration: number;
  }) => {
    try {
      // Simulate scheduling consultation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newConsultation: Consultation = {
        id: `consult_${Date.now()}`,
        title: consultationData.title,
        description: consultationData.description,
        type: consultationData.type as any,
        status: 'scheduled',
        consultant: {
          id: 'consultant_1',
          name: 'Dr. Sarah Wilson',
          avatar: '/avatars/sarah.jpg',
          expertise: ['EHR Integration', 'FHIR', 'Epic'],
          rating: 4.9
        },
        client: {
          id: 'current_user',
          name: 'Current User',
          organization: 'Current Organization'
        },
        scheduledAt: consultationData.scheduledAt,
        duration: consultationData.duration,
        meetingLink: `https://meet.hmhcp.com/consult-${Date.now()}`,
        notes: ''
      };
      
      setConsultations([newConsultation, ...consultations]);
      setIsSchedulingConsultation(false);
      toast.success('Consultation scheduled successfully');
    } catch (error) {
      toast.error('Failed to schedule consultation');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enterprise Support</h2>
          <p className="text-muted-foreground">
            Get expert technical consultation and support for your healthcare integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="code-reviews">Code Reviews</TabsTrigger>
          <TabsTrigger value="templates">Integration Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>
                        Track and manage your support requests
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsCreatingTicket(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Ticket
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{ticket.title}</h3>
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm mb-3">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{ticket.requester.organization}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{ticket.createdAt.toLocaleDateString()}</span>
                                </div>
                                {ticket.assignedTo && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Assigned to {ticket.assignedTo.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {ticket.tags.map((tag) => (
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
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    Video Consultation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Support Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Open Tickets</span>
                    <span className="font-medium">{tickets.filter(t => t.status === 'open').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="font-medium">{tickets.filter(t => t.status === 'in-progress').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Resolved</span>
                    <span className="font-medium">{tickets.filter(t => t.status === 'resolved').length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Technical Consultations</CardTitle>
                  <CardDescription>
                    Schedule expert consultations for your healthcare integration needs
                  </CardDescription>
                </div>
                <Button onClick={() => setIsSchedulingConsultation(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2">{consultation.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3">
                            {consultation.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={consultation.consultant.avatar} />
                                <AvatarFallback>{consultation.consultant.name[0]}</AvatarFallback>
                              </Avatar>
                              <span>{consultation.consultant.name}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{consultation.consultant.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{consultation.scheduledAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{consultation.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(consultation.status)}>
                          {consultation.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {consultation.consultant.expertise.map((expertise) => (
                          <Badge key={expertise} variant="outline" className="text-xs">
                            {expertise}
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

        <TabsContent value="code-reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Reviews</CardTitle>
              <CardDescription>
                Get expert code reviews with healthcare compliance validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {codeReviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3">
                            {review.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{review.language}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>Compliance Score: {review.complianceScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{review.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(review.status)}>
                          {review.status}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg mb-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{review.code}</code>
                        </pre>
                      </div>
                      
                      {review.findings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Findings:</h4>
                          {review.findings.map((finding) => (
                            <div key={finding.id} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getSeverityColor(finding.severity)}>
                                  {finding.severity}
                                </Badge>
                                <Badge variant="outline">{finding.type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Line {finding.line}
                                </span>
                              </div>
                              <p className="text-sm mb-2">{finding.description}</p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Suggestion:</strong> {finding.suggestion}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Templates</CardTitle>
              <CardDescription>
                Pre-built integration templates for popular healthcare systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ENTERPRISE_TEMPLATES.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">System:</span>
                          <span className="font-medium">{template.system}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Complexity:</span>
                          <Badge variant="outline" className="capitalize">
                            {template.complexity}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Est. Hours:</span>
                          <span className="font-medium">{template.estimatedHours}h</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        {template.tags.map((tag) => (
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
