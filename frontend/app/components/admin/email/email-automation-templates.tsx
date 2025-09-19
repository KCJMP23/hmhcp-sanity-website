'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, 
  Download, 
  Plus,
  Eye,
  Copy,
  Star,
  Users,
  Clock,
  Mail,
  Target,
  Heart,
  Calendar,
  Stethoscope,
  GraduationCap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'welcome' | 'appointment' | 'follow_up' | 'educational' | 're_engagement' | 'seasonal'
  steps_count: number
  estimated_duration: string
  target_audience: string
  healthcare_focus: string[]
  is_premium: boolean
  rating: number
  usage_count: number
  created_by: string
  created_at: string
  tags: string[]
}

const templateCategories = [
  { value: 'welcome', label: 'Welcome Series', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { value: 'appointment', label: 'Appointment Reminders', icon: Calendar, color: 'bg-blue-100 text-blue-800' },
  { value: 'follow_up', label: 'Follow-up Series', icon: Target, color: 'bg-green-100 text-green-800' },
  { value: 'educational', label: 'Educational Content', icon: GraduationCap, color: 'bg-purple-100 text-purple-800' },
  { value: 're_engagement', label: 'Re-engagement', icon: Users, color: 'bg-orange-100 text-orange-800' },
  { value: 'seasonal', label: 'Seasonal Campaigns', icon: Stethoscope, color: 'bg-cyan-100 text-cyan-800' }
]

const healthcareFocuses = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Hematology', 'Infectious Disease', 'Nephrology', 'Neurology',
  'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Urology'
]

export function EmailAutomationTemplates() {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [focusFilter, setFocusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popular')
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email/automation-templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      } else {
        throw new Error(data.error || 'Failed to load templates')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load automation templates',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/email/automation-templates/${templateId}/use`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Template applied successfully'
        })
      } else {
        throw new Error('Failed to use template')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to use template',
        variant: 'destructive'
      })
    }
  }

  const handlePreviewTemplate = (templateId: string) => {
    // Handle template preview
    toast({
      title: 'Preview',
      description: 'Template preview functionality coming soon'
    })
  }

  const getCategoryInfo = (category: string) => {
    return templateCategories.find(c => c.value === category) || templateCategories[0]
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    const matchesFocus = focusFilter === 'all' || template.healthcare_focus.includes(focusFilter)
    return matchesSearch && matchesCategory && matchesFocus
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.usage_count - a.usage_count
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Templates</h2>
          <p className="text-muted-foreground">
            Pre-built automation sequences for healthcare organizations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Find the perfect automation template for your needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {templateCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={focusFilter} onValueChange={setFocusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Healthcare Focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {healthcareFocuses.map((focus) => (
                  <SelectItem key={focus} value={focus}>
                    {focus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedTemplates.map((template) => {
          const categoryInfo = getCategoryInfo(template.category)
          const CategoryIcon = categoryInfo.icon
          
          return (
            <Card key={template.id} className="relative">
              {template.is_premium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                    <Badge className={categoryInfo.color}>
                      {categoryInfo.label}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {template.steps_count} steps
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {template.estimated_duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {template.usage_count} uses
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(template.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({template.rating.toFixed(1)})
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Healthcare Focus:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.healthcare_focus.slice(0, 3).map((focus) => (
                      <Badge key={focus} variant="outline" className="text-xs">
                        {focus}
                      </Badge>
                    ))}
                    {template.healthcare_focus.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.healthcare_focus.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Target Audience:</div>
                  <div className="text-sm text-muted-foreground">
                    {template.target_audience}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template.id)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms to find more templates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
