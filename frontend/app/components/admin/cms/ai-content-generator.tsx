'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Shield, 
  Settings,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Lightbulb,
  Target,
  Search,
  FileText,
  Zap
} from 'lucide-react'
import { AIGenerationRequest, AIGenerationResponse } from '@/lib/types/cms-types'
import { BMAD_AGENTS, getRecommendedAgents, getPrimaryAgent } from '@/lib/bmad/agent-router'

interface AIContentGeneratorProps {
  contentType?: string
  currentContent?: any
  onGenerate: (response: AIGenerationResponse) => void
  onCancel: () => void
}

export function AIContentGenerator({ 
  contentType = 'blog-post', 
  currentContent,
  onGenerate, 
  onCancel 
}: AIContentGeneratorProps) {
  const [selectedAgent, setSelectedAgent] = useState(getPrimaryAgent(contentType))
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'technical' | 'medical'>('professional')
  const [targetLength, setTargetLength] = useState<number>(500)
  const [audience, setAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIGenerationResponse | null>(null)
  const [activeTab, setActiveTab] = useState('generate')
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set())

  const recommendedAgents = getRecommendedAgents(contentType)
  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal, authoritative tone for healthcare professionals' },
    { value: 'friendly', label: 'Friendly', description: 'Approachable, warm tone for patient-facing content' },
    { value: 'technical', label: 'Technical', description: 'Detailed, precise tone for technical documentation' },
    { value: 'medical', label: 'Medical', description: 'Clinical, evidence-based tone for medical content' }
  ]

  const audienceOptions = [
    'Healthcare Professionals',
    'Clinical Researchers',
    'Healthcare Administrators',
    'Pharmaceutical Companies',
    'Patients and Families',
    'Regulatory Bodies',
    'Healthcare IT Professionals',
    'Medical Device Companies'
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a prompt for content generation.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const request: AIGenerationRequest = {
        content_type: contentType,
        agent_type: selectedAgent as any,
        prompt: prompt.trim(),
        context: currentContent,
        target_length: targetLength,
        tone,
        audience: audience || undefined
      }

      const response = await fetch('/api/admin/cms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const result: AIGenerationResponse = await response.json()
      setResponse(result)
      setActiveTab('result')

    } catch (error) {
      console.error('Content generation failed:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSections(prev => new Set(prev).add(section))
      setTimeout(() => {
        setCopiedSections(prev => {
          const next = new Set(prev)
          next.delete(section)
          return next
        })
      }, 2000)
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy content to clipboard',
        variant: 'destructive'
      })
    }
  }

  const handleUseGenerated = () => {
    if (response) {
      onGenerate(response)
    }
  }

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30'
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
    }
  }

  return (
    <div className="max-h-[80vh] overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!response} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generated Content
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 h-full overflow-y-auto">
          <TabsContent value="generate" className="space-y-4">
            {/* Agent Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  BMAD Agent Selection
                </CardTitle>
                <CardDescription>
                  Choose the AI agent best suited for your content type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {recommendedAgents.map((agentKey) => {
                    const agent = BMAD_AGENTS[agentKey]
                    const isSelected = selectedAgent === agentKey
                    const isPrimary = agentKey === recommendedAgents[0]
                    
                    return (
                      <Card 
                        key={agentKey}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                            : 'hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedAgent(agentKey)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{agent.name}</h3>
                                {isPrimary && <Badge variant="secondary">Recommended</Badge>}
                                {agent.healthcare_compliant && (
                                  <Badge variant="outline">
                                    <Shield className="w-3 h-3 mr-1" />
                                    HIPAA Compliant
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {agent.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {agent.capabilities.slice(0, 3).map((capability) => (
                                  <Badge key={capability} variant="outline" className="text-xs">
                                    {capability}
                                  </Badge>
                                ))}
                                {agent.capabilities.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{agent.capabilities.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`} />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Generation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Generation Parameters
                </CardTitle>
                <CardDescription>
                  Configure your content generation request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Content Prompt *</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what content you want to generate. Be specific about the topic, key points, and any requirements..."
                    rows={4}
                    className="mt-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific about your requirements. The AI agent will use healthcare industry context.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={(value) => setTone(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target_length">Target Length (words)</Label>
                    <Input
                      id="target_length"
                      type="number"
                      value={targetLength}
                      onChange={(e) => setTargetLength(parseInt(e.target.value) || 500)}
                      min={50}
                      max={5000}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience..." />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentContent && (
                  <div>
                    <Label>Current Content Context</Label>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(currentContent, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {response && (
              <>
                {/* Generated Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generated Content
                    </CardTitle>
                    <CardDescription>
                      Content generated by {BMAD_AGENTS[selectedAgent]?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyToClipboard(response.content, 'content')}
                      >
                        {copiedSections.has('content') ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <ScrollArea className="h-64">
                        <div className="whitespace-pre-wrap text-sm pr-12">
                          {response.content}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {response.suggestions && response.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {response.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <Lightbulb className="w-4 h-4 mt-0.5 text-blue-500" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SEO Recommendations */}
                {response.seo_recommendations && response.seo_recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        SEO Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {response.seo_recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <Target className={`w-4 h-4 mt-0.5 ${
                              rec.impact === 'high' ? 'text-red-500' :
                              rec.impact === 'medium' ? 'text-yellow-500' : 'text-green-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium capitalize">{rec.type}</span>
                                <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                                  {rec.impact} impact
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{rec.suggestion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compliance Notes */}
                {response.compliance_notes && response.compliance_notes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Compliance Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {response.compliance_notes.map((note, index) => (
                          <div 
                            key={index} 
                            className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(note.severity)}`}
                          >
                            {getSeverityIcon(note.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium uppercase text-xs">{note.type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {note.severity}
                                </Badge>
                              </div>
                              <div className="text-sm mb-2">{note.issue}</div>
                              <div className="text-sm text-muted-foreground">
                                <strong>Recommendation:</strong> {note.recommendation}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('generate')}>
                    Generate Again
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleUseGenerated}>
                      <Check className="w-4 h-4 mr-2" />
                      Use This Content
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}