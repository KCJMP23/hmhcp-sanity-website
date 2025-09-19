'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  UserCheck,
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Settings,
  Info,
  Zap,
  Stethoscope,
  Globe,
  Building2
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { AppleButton } from '@/components/ui/apple-button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  validateCompliance, 
  applyAutoFixes, 
  createComplianceAuditEvent,
  detectPHI,
  sanitizeContent,
  validateMedicalTerminology,
  requiresManualApproval,
  ComplianceStandard, 
  ComplianceResult, 
  ComplianceViolation,
  AuditEvent as ComplianceAuditEvent
} from '@/lib/validation/healthcare-compliance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface ComplianceCheck {
  id: string;
  category: 'HIPAA' | 'GDPR' | 'SOC2' | 'ISO27001' | 'FDA';
  name: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'warning' | 'pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: Date;
  findings: ComplianceFinding[];
  remediationSteps?: string[];
  automatedFix?: boolean;
}

interface ComplianceFinding {
  id: string;
  type: 'violation' | 'warning' | 'recommendation';
  message: string;
  resource?: string;
  evidence?: string;
  timestamp: Date;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  resourceType: 'patient_data' | 'system_config' | 'user_account' | 'workflow' | 'integration';
  ipAddress: string;
  location?: string;
  status: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, any>;
  phiAccessed?: boolean;
}

interface ComplianceReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  complianceScore: number;
  findings: number;
  criticalIssues: number;
  status: 'generating' | 'ready' | 'failed';
}

export default function ComplianceDashboard() {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [testContent, setTestContent] = useState('');
  const [phiDetectionResult, setPHIDetectionResult] = useState<any>(null);
  const [medicalValidation, setMedicalValidation] = useState<any>(null);
  const [complianceResults, setComplianceResults] = useState<Record<string, ComplianceResult>>({});
  const [activeStandards, setActiveStandards] = useState<ComplianceStandard[]>(['HIPAA']);
  const [autoFixesAvailable, setAutoFixesAvailable] = useState(0);

  // Mock data generation
  useEffect(() => {
    const mockChecks: ComplianceCheck[] = [
      {
        id: '1',
        category: 'HIPAA',
        name: 'PHI Encryption',
        description: 'Verify all PHI is encrypted at rest and in transit',
        status: 'compliant',
        severity: 'critical',
        lastChecked: new Date(Date.now() - 300000),
        findings: [],
        automatedFix: false
      },
      {
        id: '2',
        category: 'HIPAA',
        name: 'Access Controls',
        description: 'Validate role-based access controls for patient data',
        status: 'warning',
        severity: 'high',
        lastChecked: new Date(Date.now() - 600000),
        findings: [
          {
            id: 'f1',
            type: 'warning',
            message: '3 users have not accessed the system in 90+ days',
            resource: 'User Management',
            timestamp: new Date()
          }
        ],
        remediationSteps: ['Review inactive user accounts', 'Disable or remove unused accounts'],
        automatedFix: true
      },
      {
        id: '3',
        category: 'GDPR',
        name: 'Data Retention Policy',
        description: 'Ensure data retention policies are enforced',
        status: 'compliant',
        severity: 'medium',
        lastChecked: new Date(Date.now() - 1800000),
        findings: []
      },
      {
        id: '4',
        category: 'HIPAA',
        name: 'Audit Logging',
        description: 'Comprehensive audit logging for all PHI access',
        status: 'compliant',
        severity: 'critical',
        lastChecked: new Date(Date.now() - 900000),
        findings: []
      },
      {
        id: '5',
        category: 'SOC2',
        name: 'Change Management',
        description: 'Verify change management procedures are followed',
        status: 'non-compliant',
        severity: 'high',
        lastChecked: new Date(Date.now() - 2700000),
        findings: [
          {
            id: 'f2',
            type: 'violation',
            message: 'Unauthorized production deployment detected',
            resource: 'Deployment Pipeline',
            evidence: 'Deployment ID: dep_xyz123',
            timestamp: new Date(Date.now() - 3600000)
          }
        ],
        remediationSteps: ['Review deployment approval process', 'Implement automated checks'],
        automatedFix: false
      }
    ];

    const mockAuditLogs: AuditLogEntry[] = [
      {
        id: 'log1',
        timestamp: new Date(Date.now() - 60000),
        user: 'Dr. Sarah Johnson',
        action: 'VIEW_PATIENT_RECORD',
        resource: 'Patient #12345',
        resourceType: 'patient_data',
        ipAddress: '192.168.1.100',
        location: 'New York, NY',
        status: 'success',
        phiAccessed: true
      },
      {
        id: 'log2',
        timestamp: new Date(Date.now() - 120000),
        user: 'Admin User',
        action: 'UPDATE_ACCESS_POLICY',
        resource: 'RBAC Configuration',
        resourceType: 'system_config',
        ipAddress: '10.0.0.50',
        status: 'success',
        phiAccessed: false
      },
      {
        id: 'log3',
        timestamp: new Date(Date.now() - 180000),
        user: 'System',
        action: 'AUTOMATED_BACKUP',
        resource: 'Database Backup',
        resourceType: 'system_config',
        ipAddress: '127.0.0.1',
        status: 'success',
        phiAccessed: false
      },
      {
        id: 'log4',
        timestamp: new Date(Date.now() - 240000),
        user: 'Dr. Michael Chen',
        action: 'EXPORT_REPORT',
        resource: 'Monthly Analytics',
        resourceType: 'patient_data',
        ipAddress: '192.168.1.105',
        location: 'Los Angeles, CA',
        status: 'success',
        phiAccessed: true
      },
      {
        id: 'log5',
        timestamp: new Date(Date.now() - 300000),
        user: 'Unknown',
        action: 'LOGIN_ATTEMPT',
        resource: 'Authentication Service',
        resourceType: 'user_account',
        ipAddress: '203.0.113.1',
        status: 'failure',
        phiAccessed: false
      }
    ];

    const mockReports: ComplianceReport[] = [
      {
        id: 'report1',
        name: 'Q4 2024 HIPAA Compliance Report',
        type: 'quarterly',
        generatedAt: new Date(Date.now() - 86400000),
        period: {
          start: new Date('2024-10-01'),
          end: new Date('2024-12-31')
        },
        complianceScore: 94,
        findings: 12,
        criticalIssues: 1,
        status: 'ready'
      },
      {
        id: 'report2',
        name: 'December 2024 Monthly Audit',
        type: 'monthly',
        generatedAt: new Date(Date.now() - 172800000),
        period: {
          start: new Date('2024-12-01'),
          end: new Date('2024-12-31')
        },
        complianceScore: 96,
        findings: 5,
        criticalIssues: 0,
        status: 'ready'
      },
      {
        id: 'report3',
        name: 'Weekly Security Review',
        type: 'weekly',
        generatedAt: new Date(),
        period: {
          start: new Date(Date.now() - 604800000),
          end: new Date()
        },
        complianceScore: 0,
        findings: 0,
        criticalIssues: 0,
        status: 'generating'
      }
    ];

    setComplianceChecks(mockChecks);
    setAuditLogs(mockAuditLogs);
    setReports(mockReports);

    // Calculate overall compliance score
    const compliantChecks = mockChecks.filter(c => c.status === 'compliant').length;
    const score = Math.round((compliantChecks / mockChecks.length) * 100);
    setOverallScore(score);
  }, []);

  const getStatusIcon = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: ComplianceCheck['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
    }
  };

  const runComplianceScan = async () => {
    setIsScanning(true);
    try {
      // Simulate real healthcare compliance validation
      const testData = {
        content: testContent || 'Patient John Doe, DOB: 12/15/1980, SSN: 123-45-6789, was treated for diabetes.',
        containsPHI: true,
        auditLogged: false,
        accessScope: 'full' as const,
        justification: '',
        processingPersonalData: true,
        userConsent: false,
        sensitiveOperation: true,
        roleBasedAccess: false,
        sensitiveData: true,
        encrypted: false,
        medicalRecommendation: true,
        clinicallyValidated: false
      };

      // Run PHI detection
      const phiResult = detectPHI(testData.content);
      setPHIDetectionResult(phiResult);

      // Validate medical terminology
      const medResult = validateMedicalTerminology(testData.content);
      setMedicalValidation(medResult);

      // Run compliance validation for each standard
      const results: Record<string, ComplianceResult> = {};
      let totalAutoFixes = 0;

      for (const standard of activeStandards) {
        const result = validateCompliance(testData, [standard]);
        results[standard] = result;
        totalAutoFixes += result.violations.filter(v => v.autoFixAvailable).length;
      }

      setComplianceResults(results);
      setAutoFixesAvailable(totalAutoFixes);

      // Calculate new overall score based on real results
      const scores = Object.values(results).map(r => r.score);
      const newScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      setOverallScore(Math.round(newScore));

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    } catch (error) {
      console.error('Healthcare compliance scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const applyHealthcareAutoFixes = async () => {
    try {
      const allViolations = Object.values(complianceResults)
        .flatMap(result => result.violations);
      
      const fixableViolations = allViolations.filter(v => v.autoFixAvailable);
      
      if (fixableViolations.length > 0) {
        const testData = {
          content: testContent,
          containsPHI: true,
          auditLogged: false,
          accessScope: 'full' as const,
          justification: ''
        };

        const { fixedData, appliedFixes } = applyAutoFixes(testData, fixableViolations);
        
        // Update test content with sanitized version
        if (fixedData.content !== testData.content) {
          setTestContent(fixedData.content);
        }
        
        // Re-run scan after fixes
        setTimeout(() => {
          runComplianceScan();
        }, 1000);
        
        console.log(`Applied ${appliedFixes.length} automatic fixes`);
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
    }
  };

  const exportAuditLog = () => {
    // Export logic
    console.log('Exporting audit log...');
  };

  const generateReport = (type: ComplianceReport['type']) => {
    // Report generation logic
    console.log(`Generating ${type} report...`);
  };

  const remediateIssue = (checkId: string) => {
    // Remediation logic
    console.log(`Remediating issue ${checkId}...`);
  };

  const filteredChecks = complianceChecks.filter(check => {
    const matchesCategory = selectedCategory === 'all' || check.category === selectedCategory;
    const matchesSearch = check.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         check.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="heading3" className="text-gray-900 mb-2">
            Compliance Dashboard
          </Typography>
          <Typography variant="body" className="text-gray-600">
            Monitor HIPAA, GDPR, and regulatory compliance in real-time
          </Typography>
        </div>
        <div className="flex items-center space-x-3">
          <AppleButton
            variant="outline"
            onClick={exportAuditLog}
            icon={<Download className="h-4 w-4" />}
          >
            Export Audit Log
          </AppleButton>
          <AppleButton
            variant="primary"
            onClick={runComplianceScan}
            disabled={isScanning}
            icon={<RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />}
          >
            {isScanning ? 'Scanning...' : 'Run Compliance Scan'}
          </AppleButton>
        </div>
      </div>

      {/* Compliance Score Overview */}
      <FrostedCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${overallScore * 3.52} 352`}
                    className={overallScore >= 90 ? 'text-green-600' : overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Typography variant="heading2" className="text-gray-900">
                      {overallScore}%
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      Compliant
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Typography variant="heading3" className="text-green-900">
                    {complianceChecks.filter(c => c.status === 'compliant').length}
                  </Typography>
                </div>
                <Typography variant="label" className="text-green-700">
                  Compliant Checks
                </Typography>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <Typography variant="heading3" className="text-yellow-900">
                    {complianceChecks.filter(c => c.status === 'warning').length}
                  </Typography>
                </div>
                <Typography variant="label" className="text-yellow-700">
                  Warnings
                </Typography>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <Typography variant="heading3" className="text-red-900">
                    {complianceChecks.filter(c => c.status === 'non-compliant').length}
                  </Typography>
                </div>
                <Typography variant="label" className="text-red-700">
                  Non-Compliant
                </Typography>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {['HIPAA', 'GDPR', 'SOC2'].map(category => {
                const categoryChecks = complianceChecks.filter(c => c.category === category);
                const compliantCount = categoryChecks.filter(c => c.status === 'compliant').length;
                const percentage = categoryChecks.length > 0 ? (compliantCount / categoryChecks.length) * 100 : 0;
                
                return (
                  <div key={category} className="flex items-center space-x-3">
                    <Typography variant="label" className="text-gray-700 w-20">
                      {category}
                    </Typography>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <Typography variant="small" className="text-gray-600 w-12 text-right">
                      {Math.round(percentage)}%
                    </Typography>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FrostedCard>

      {/* Healthcare Content Testing */}
      <FrostedCard className="p-6">
        <Typography variant="heading4" className="text-gray-900 mb-4">
          Healthcare Content Testing
        </Typography>
        <div className="space-y-4">
          <div>
            <Typography variant="label" className="text-gray-700 mb-2">
              Test Content for PHI Detection & Medical Validation
            </Typography>
            <Textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Enter healthcare content to test for PHI, medical accuracy, and compliance..."
              className="min-h-[120px] mb-3"
            />
            <div className="flex items-center space-x-3">
              <AppleButton
                variant="primary"
                onClick={runComplianceScan}
                disabled={isScanning}
                icon={<Stethoscope className="h-4 w-4" />}
              >
                {isScanning ? 'Analyzing...' : 'Analyze Healthcare Content'}
              </AppleButton>
              {autoFixesAvailable > 0 && (
                <AppleButton
                  variant="outline"
                  onClick={applyHealthcareAutoFixes}
                  icon={<Zap className="h-4 w-4" />}
                >
                  Apply {autoFixesAvailable} Auto-Fixes
                </AppleButton>
              )}
            </div>
          </div>

          {/* Real-time Results */}
          {(phiDetectionResult || medicalValidation || Object.keys(complianceResults).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* PHI Detection Results */}
              {phiDetectionResult && (
                <Alert className={phiDetectionResult.hasPHI ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                  <Lock className="h-4 w-4" />
                  <AlertTitle className={phiDetectionResult.hasPHI ? "text-red-800" : "text-green-800"}>
                    PHI Detection: {phiDetectionResult.hasPHI ? 'DETECTED' : 'CLEAR'}
                  </AlertTitle>
                  <AlertDescription className={phiDetectionResult.hasPHI ? "text-red-700" : "text-green-700"}>
                    {phiDetectionResult.hasPHI ? (
                      <div>
                        <p>Found: {phiDetectionResult.phiTypes.join(', ')}</p>
                        <p className="text-xs mt-1">Confidence: {Math.round(phiDetectionResult.confidence * 100)}%</p>
                      </div>
                    ) : (
                      'No PHI detected in content'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Medical Validation Results */}
              {medicalValidation && (
                <Alert className={medicalValidation.isValid ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                  <Stethoscope className="h-4 w-4" />
                  <AlertTitle className={medicalValidation.isValid ? "text-green-800" : "text-yellow-800"}>
                    Medical Terms: {medicalValidation.isValid ? 'VALIDATED' : 'ISSUES FOUND'}
                  </AlertTitle>
                  <AlertDescription className={medicalValidation.isValid ? "text-green-700" : "text-yellow-700"}>
                    {medicalValidation.isValid ? (
                      'Medical terminology appears accurate'
                    ) : (
                      <div>
                        <p>{medicalValidation.issues.length} issues found</p>
                        <p className="text-xs mt-1">Review required</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Compliance Summary */}
              {Object.keys(complianceResults).length > 0 && (
                <Alert className={overallScore >= 90 ? "border-green-200 bg-green-50" : overallScore >= 70 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50"}>
                  <Shield className="h-4 w-4" />
                  <AlertTitle className={overallScore >= 90 ? "text-green-800" : overallScore >= 70 ? "text-yellow-800" : "text-red-800"}>
                    Compliance Score: {overallScore}%
                  </AlertTitle>
                  <AlertDescription className={overallScore >= 90 ? "text-green-700" : overallScore >= 70 ? "text-yellow-700" : "text-red-700"}>
                    {Object.values(complianceResults).reduce((total, result) => total + result.violations.length, 0)} total violations across {activeStandards.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </FrostedCard>

      {/* Standards Selection */}
      <FrostedCard className="p-6">
        <Typography variant="heading4" className="text-gray-900 mb-4">
          Active Healthcare Compliance Standards
        </Typography>
        <div className="flex flex-wrap gap-3">
          {(['HIPAA', 'GDPR', 'SOC2', 'ISO27001', 'FDA'] as ComplianceStandard[]).map(standard => {
            const isActive = activeStandards.includes(standard);
            const standardIcons = {
              'HIPAA': <Stethoscope className="h-4 w-4" />,
              'GDPR': <Globe className="h-4 w-4" />,
              'SOC2': <Building2 className="h-4 w-4" />,
              'ISO27001': <Shield className="h-4 w-4" />,
              'FDA': <FileText className="h-4 w-4" />
            };
            
            return (
              <AppleButton
                key={standard}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveStandards(prev => 
                    prev.includes(standard) 
                      ? prev.filter(s => s !== standard)
                      : [...prev, standard]
                  );
                }}
                icon={standardIcons[standard]}
              >
                {standard}
              </AppleButton>
            );
          })}
        </div>
      </FrostedCard>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Compliance Checks</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Critical Issues */}
          <FrostedCard className="p-4 border-l-4 border-red-500">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <Typography variant="label" className="text-red-900 mb-1">
                  Critical Compliance Issue
                </Typography>
                <Typography variant="body" className="text-gray-700 mb-3">
                  Unauthorized production deployment detected without proper approval workflow
                </Typography>
                <div className="flex items-center space-x-3">
                  <AppleButton variant="outline" size="sm">
                    View Details
                  </AppleButton>
                  <AppleButton variant="primary" size="sm">
                    Remediate Now
                  </AppleButton>
                </div>
              </div>
            </div>
          </FrostedCard>

          {/* Recent Activity */}
          <FrostedCard className="p-6">
            <Typography variant="heading4" className="text-gray-900 mb-4">
              Recent Compliance Activity
            </Typography>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {log.action.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {log.user} • {log.resource}
                      </Typography>
                    </div>
                  </div>
                  <div className="text-right">
                    <Typography variant="small" className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                    {log.phiAccessed && (
                      <Badge variant="secondary" className="ml-2">PHI</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FrostedCard>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search compliance checks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="HIPAA">HIPAA</option>
              <option value="GDPR">GDPR</option>
              <option value="SOC2">SOC2</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="FDA">FDA</option>
            </select>
          </div>

          {/* Compliance Checks List */}
          <div className="space-y-4">
            {filteredChecks.map(check => (
              <FrostedCard key={check.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <Typography variant="label" className="text-gray-900">
                          {check.name}
                        </Typography>
                        <Badge variant="outline">{check.category}</Badge>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(check.severity)}`}>
                          {check.severity.toUpperCase()}
                        </span>
                      </div>
                      <Typography variant="body" className="text-gray-600 mb-2">
                        {check.description}
                      </Typography>
                      
                      {check.findings.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {check.findings.map(finding => (
                            <div key={finding.id} className="bg-yellow-50 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                <div className="flex-1">
                                  <Typography variant="small" className="text-gray-900">
                                    {finding.message}
                                  </Typography>
                                  {finding.resource && (
                                    <Typography variant="small" className="text-gray-600">
                                      Resource: {finding.resource}
                                    </Typography>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {check.remediationSteps && (
                        <div className="mt-3">
                          <Typography variant="label" className="text-gray-700 mb-2">
                            Remediation Steps:
                          </Typography>
                          <ul className="list-disc list-inside space-y-1">
                            {check.remediationSteps.map((step, index) => (
                              <li key={index} className="text-sm text-gray-600">{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 mt-3">
                        <Typography variant="small" className="text-gray-500">
                          Last checked: {new Date(check.lastChecked).toLocaleString()}
                        </Typography>
                        {check.automatedFix && check.status !== 'compliant' && (
                          <AppleButton
                            variant="outline"
                            size="sm"
                            onClick={() => remediateIssue(check.id)}
                          >
                            Auto-Remediate
                          </AppleButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FrostedCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Audit Trail Table */}
          <FrostedCard className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">Timestamp</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">User</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">Action</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">Resource</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">IP Address</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">Status</Typography>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Typography variant="label" className="text-gray-700">PHI</Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Typography variant="small" className="text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </td>
                      <td className="py-3 px-4">
                        <Typography variant="small" className="text-gray-900">
                          {log.user}
                        </Typography>
                      </td>
                      <td className="py-3 px-4">
                        <Typography variant="small" className="text-gray-900">
                          {log.action.replace(/_/g, ' ')}
                        </Typography>
                      </td>
                      <td className="py-3 px-4">
                        <Typography variant="small" className="text-gray-900">
                          {log.resource}
                        </Typography>
                      </td>
                      <td className="py-3 px-4">
                        <Typography variant="small" className="text-gray-600">
                          {log.ipAddress}
                        </Typography>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {log.phiAccessed && (
                          <Lock className="h-4 w-4 text-blue-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FrostedCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Report Generation */}
          <FrostedCard className="p-6">
            <Typography variant="heading4" className="text-gray-900 mb-4">
              Generate Compliance Report
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AppleButton
                variant="outline"
                onClick={() => generateReport('daily')}
                className="justify-center"
              >
                Daily Report
              </AppleButton>
              <AppleButton
                variant="outline"
                onClick={() => generateReport('weekly')}
                className="justify-center"
              >
                Weekly Report
              </AppleButton>
              <AppleButton
                variant="outline"
                onClick={() => generateReport('monthly')}
                className="justify-center"
              >
                Monthly Report
              </AppleButton>
            </div>
          </FrostedCard>

          {/* Existing Reports */}
          <div className="space-y-4">
            {reports.map(report => (
              <FrostedCard key={report.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {report.name}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {report.status === 'ready' && (
                      <>
                        <div className="text-right">
                          <Typography variant="heading4" className="text-gray-900">
                            {report.complianceScore}%
                          </Typography>
                          <Typography variant="small" className="text-gray-600">
                            Compliance Score
                          </Typography>
                        </div>
                        <div className="text-right">
                          <Typography variant="body" className="text-gray-900">
                            {report.findings}
                          </Typography>
                          <Typography variant="small" className="text-gray-600">
                            Findings
                          </Typography>
                        </div>
                        {report.criticalIssues > 0 && (
                          <Badge variant="destructive">
                            {report.criticalIssues} Critical
                          </Badge>
                        )}
                        <AppleButton variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </AppleButton>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <Typography variant="small" className="text-blue-600">
                          Generating...
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              </FrostedCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}