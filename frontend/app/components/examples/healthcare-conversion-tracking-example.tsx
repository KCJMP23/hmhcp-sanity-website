'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConversionTracking } from '@/hooks/use-conversion-tracking'
import type { PatientPersona, HealthcareSpecialty } from '@/hooks/use-conversion-tracking'
import {
  Stethoscope,
  Download,
  Mail,
  Calendar,
  Activity,
  Phone,
  FileText,
  Users
} from 'lucide-react'

/**
 * Example component showing how to integrate HIPAA-compliant conversion tracking
 * into healthcare website components
 */
export function HealthcareConversionTrackingExample() {
  const {
    trackContentEngagement,
    trackConsultationRequest,
    trackClinicalTrialInquiry,
    trackHealthcareDownload,
    trackEmailSignup,
    isTracking
  } = useConversionTracking()

  const [selectedPersona, setSelectedPersona] = useState<PatientPersona>('patient')
  const [selectedSpecialty, setSelectedSpecialty] = useState<HealthcareSpecialty>('general_medicine')
  const [email, setEmail] = useState('')

  const handleContentView = async () => {
    await trackContentEngagement(
      'healthcare-guide-123',
      'healthcare_guide',
      selectedPersona,
      {
        content_title: 'Complete Guide to Preventive Care',
        custom_properties: {
          section: 'patient_education',
          reading_time: '5_minutes'
        }
      }
    )
  }

  const handleWhitepaperDownload = async () => {
    await trackHealthcareDownload(
      'Clinical Outcomes Whitepaper 2024',
      'whitepaper',
      selectedPersona,
      {
        event_type: 'whitepaper_download',
        healthcare_specialty: selectedSpecialty,
        custom_properties: {
          file_format: 'pdf',
          file_size: '2.3MB'
        }
      }
    )
  }

  const handleConsultationRequest = async () => {
    await trackConsultationRequest(
      selectedSpecialty,
      'medium',
      selectedPersona,
      {
        custom_properties: {
          consultation_type: 'initial',
          preferred_contact: 'phone',
          urgency_reason: 'routine_care'
        }
      }
    )
  }

  const handleClinicalTrialInquiry = async () => {
    await trackClinicalTrialInquiry(
      selectedSpecialty,
      selectedPersona,
      {
        custom_properties: {
          trial_phase: 'phase_3',
          interest_level: 'high',
          previous_participation: false
        }
      }
    )
  }

  const handleNewsletterSignup = async () => {
    if (!email) return
    
    await trackEmailSignup(
      selectedPersona,
      'healthcare_newsletter',
      {
        custom_properties: {
          signup_source: 'homepage',
          interests: [selectedSpecialty],
          frequency_preference: 'weekly'
        }
      }
    )
    setEmail('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Healthcare Conversion Tracking Demo</h1>
        <p className="text-muted-foreground">
          HIPAA-compliant analytics for healthcare patient journey tracking
        </p>
      </div>

      {/* Persona and Specialty Selection */}
      <Card>
        <CardHeader>
          <CardTitle>User Context</CardTitle>
          <CardDescription>
            Set patient persona and healthcare specialty for tracking context
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="persona">Patient Persona</Label>
            <Select value={selectedPersona} onValueChange={(value) => setSelectedPersona(value as PatientPersona)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="provider">Healthcare Provider</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="researcher">Researcher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Healthcare Specialty</Label>
            <Select value={selectedSpecialty} onValueChange={(value) => setSelectedSpecialty(value as HealthcareSpecialty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_medicine">General Medicine</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="oncology">Oncology</SelectItem>
                <SelectItem value="neurology">Neurology</SelectItem>
                <SelectItem value="endocrinology">Endocrinology</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Awareness Stage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Awareness Stage
          </CardTitle>
          <CardDescription>
            Track content engagement and healthcare resource views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleContentView}
            disabled={isTracking}
            className="w-full"
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            View Healthcare Guide
          </Button>
          
          <Button 
            onClick={handleWhitepaperDownload}
            disabled={isTracking}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Clinical Whitepaper
          </Button>
        </CardContent>
      </Card>

      {/* Consideration Stage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Consideration Stage
          </CardTitle>
          <CardDescription>
            Track email signups and deeper engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email for newsletter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={handleNewsletterSignup}
              disabled={isTracking || !email}
            >
              <Mail className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Stage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Consultation Stage
          </CardTitle>
          <CardDescription>
            Track consultation requests and appointment bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConsultationRequest}
            disabled={isTracking}
            className="w-full"
            variant="outline"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Request Consultation
          </Button>
          
          <Button 
            onClick={handleClinicalTrialInquiry}
            disabled={isTracking}
            className="w-full"
            variant="outline"
          >
            <Activity className="h-4 w-4 mr-2" />
            Clinical Trial Inquiry
          </Button>
        </CardContent>
      </Card>

      {/* Analytics Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Integration</CardTitle>
          <CardDescription>
            How conversion tracking integrates with healthcare analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Patient Journey Mapping</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Awareness:</strong> Content views, resource downloads</p>
              <p><strong>Consideration:</strong> Email signups, webinar registrations</p>
              <p><strong>Consultation:</strong> Appointment requests, trial inquiries</p>
              <p><strong>Advocacy:</strong> Referrals, feedback submissions</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">HIPAA Compliance Features</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>✓ Automatic PII scrubbing and anonymization</p>
              <p>✓ Region-level geographic data (no city/ZIP)</p>
              <p>✓ Configurable data retention policies</p>
              <p>✓ Healthcare-specific event categorization</p>
              <p>✓ Patient persona segmentation</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Multi-Touch Attribution</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Tracks complete patient journey from awareness to conversion</p>
              <p>• Maps content touchpoints and engagement patterns</p>
              <p>• Identifies high-value conversion paths</p>
              <p>• Measures time-to-conversion by specialty</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Example</CardTitle>
          <CardDescription>
            How to integrate conversion tracking into your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Import the hook
import { useConversionTracking } from '@/hooks/use-conversion-tracking'

// In your component
const { trackConsultationRequest } = useConversionTracking()

// Track conversion on button click
const handleScheduleAppointment = async () => {
  await trackConsultationRequest(
    'cardiology',
    'high',
    'patient',
    {
      custom_properties: {
        appointment_type: 'initial_consultation',
        preferred_time: 'morning'
      }
    }
  )
  
  // Continue with actual appointment scheduling logic
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}