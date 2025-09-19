'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  X, 
  Plus, 
  Trash2,
  Target,
  Activity,
  Users,
  MapPin,
  Calendar,
  Filter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { EmailSegment, SegmentCriteria } from '@/types/email-campaigns'

interface EmailSegmentBuilderProps {
  segment?: EmailSegment | null
  onSave: (segment: EmailSegment) => void
  onCancel: () => void
}

const segmentTypes = [
  { 
    value: 'healthcare_specialty', 
    label: 'Healthcare Specialty', 
    icon: Target,
    description: 'Segment by medical specialty or profession'
  },
  { 
    value: 'patient_condition', 
    label: 'Patient Condition', 
    icon: Activity,
    description: 'Segment by patient medical conditions'
  },
  { 
    value: 'engagement_level', 
    label: 'Engagement Level', 
    icon: Users,
    description: 'Segment by email engagement behavior'
  },
  { 
    value: 'geographic', 
    label: 'Geographic', 
    icon: MapPin,
    description: 'Segment by location or region'
  },
  { 
    value: 'demographic', 
    label: 'Demographic', 
    icon: Users,
    description: 'Segment by age, gender, or other demographics'
  },
  { 
    value: 'behavioral', 
    label: 'Behavioral', 
    icon: Activity,
    description: 'Segment by user behavior patterns'
  },
]

const healthcareSpecialties = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Hematology', 'Infectious Disease', 'Nephrology', 'Neurology',
  'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Urology'
]

const patientConditions = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Cancer',
  'Arthritis', 'Asthma', 'Depression', 'Anxiety',
  'Obesity', 'High Cholesterol', 'Chronic Pain', 'Alzheimer\'s'
]

const engagementLevels = [
  'High Engagement', 'Medium Engagement', 'Low Engagement', 'Inactive'
]

const geographicRegions = [
  'North America', 'South America', 'Europe', 'Asia',
  'Africa', 'Oceania', 'United States', 'Canada',
  'United Kingdom', 'Germany', 'France', 'Australia'
]

export function EmailSegmentBuilder({ segment, onSave, onCancel }: EmailSegmentBuilderProps) {
  const [formData, setFormData] = useState<Partial<EmailSegment>>({
    name: '',
    description: '',
    segment_type: 'healthcare_specialty',
    criteria: {},
    healthcare_type: 'professional',
    is_active: true
  })
  const [criteria, setCriteria] = useState<SegmentCriteria[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (segment) {
      setFormData(segment)
      if (segment.criteria) {
        setCriteria(Array.isArray(segment.criteria) ? segment.criteria : [])
      }
    }
  }, [segment])

  const addCriteria = () => {
    setCriteria([...criteria, {
      field: '',
      operator: 'equals',
      value: '',
      logic: 'AND'
    }])
  }

  const updateCriteria = (index: number, field: keyof SegmentCriteria, value: any) => {
    const newCriteria = [...criteria]
    newCriteria[index] = { ...newCriteria[index], [field]: value }
    setCriteria(newCriteria)
  }

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const getFieldOptions = (segmentType: string) => {
    switch (segmentType) {
      case 'healthcare_specialty':
        return healthcareSpecialties.map(specialty => ({ value: specialty, label: specialty }))
      case 'patient_condition':
        return patientConditions.map(condition => ({ value: condition, label: condition }))
      case 'engagement_level':
        return engagementLevels.map(level => ({ value: level, label: level }))
      case 'geographic':
        return geographicRegions.map(region => ({ value: region, label: region }))
      default:
        return []
    }
  }

  const getOperatorOptions = () => [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ]

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Segment name is required',
        variant: 'destructive'
      })
      return
    }

    if (criteria.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one criteria is required',
        variant: 'destructive'
      })
      return
    }

    const segmentData: EmailSegment = {
      id: formData.id,
      name: formData.name || '',
      description: formData.description || '',
      segment_type: formData.segment_type || 'healthcare_specialty',
      criteria: criteria,
      healthcare_type: formData.healthcare_type || 'professional',
      contact_count: formData.contact_count || 0,
      is_active: formData.is_active ?? true,
      created_at: formData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave(segmentData)
  }

  const getTypeInfo = (type: string) => {
    return segmentTypes.find(t => t.value === type) || segmentTypes[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {segment ? 'Edit Segment' : 'Create New Segment'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Define targeting criteria for your contact segment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Segment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="criteria">Criteria</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Information</CardTitle>
              <CardDescription>
                Basic information about your contact segment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Segment Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter segment name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment_type">Segment Type</Label>
                  <Select
                    value={formData.segment_type || 'healthcare_specialty'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, segment_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select segment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {segmentTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this segment"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="healthcare_type">Healthcare Type</Label>
                  <Select
                    value={formData.healthcare_type || 'professional'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, healthcare_type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select healthcare type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Healthcare Professional</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="general">General Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active Segment</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criteria */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Targeting Criteria</CardTitle>
              <CardDescription>
                Define the conditions that contacts must meet to be included in this segment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {criteria.map((criterion, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Criterion {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriteria(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={criterion.field}
                        onValueChange={(value) => updateCriteria(index, 'field', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFieldOptions(formData.segment_type || 'healthcare_specialty').map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={criterion.operator}
                        onValueChange={(value) => updateCriteria(index, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        value={criterion.value}
                        onChange={(e) => updateCriteria(index, 'value', e.target.value)}
                        placeholder="Enter value"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Logic</Label>
                      <Select
                        value={criterion.logic}
                        onValueChange={(value) => updateCriteria(index, 'logic', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select logic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button onClick={addCriteria} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Criterion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Preview</CardTitle>
              <CardDescription>
                Preview your segment configuration and estimated contact count
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Segment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {formData.name || 'Untitled Segment'}</div>
                    <div><strong>Type:</strong> {getTypeInfo(formData.segment_type || 'healthcare_specialty').label}</div>
                    <div><strong>Healthcare Type:</strong> {formData.healthcare_type || 'professional'}</div>
                    <div><strong>Description:</strong> {formData.description || 'No description'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Targeting Criteria</h4>
                  {criteria.length > 0 ? (
                    <div className="space-y-2">
                      {criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{criterion.field}</Badge>
                          <span>{criterion.operator}</span>
                          <Badge variant="secondary">{criterion.value}</Badge>
                          {index < criteria.length - 1 && (
                            <Badge variant="outline">{criterion.logic}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No criteria defined</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Estimated Contact Count</h4>
                  <div className="text-2xl font-bold text-primary">
                    {formData.contact_count || 0} contacts
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is an estimate based on your criteria
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
