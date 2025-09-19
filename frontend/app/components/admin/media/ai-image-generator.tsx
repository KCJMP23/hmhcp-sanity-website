'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Wand2,
  Heart,
  Users,
  Stethoscope,
  Brain
} from 'lucide-react'
import Image from 'next/image'

interface GeneratedImage {
  id: string
  url: string
  media: {
    id: string
    filename: string
    cdn_url: string
    ai_prompt: string
  }
}

interface AIImageGeneratorProps {
  onImageGenerated?: (images: GeneratedImage[]) => void
  defaultStyle?: string
}

const STYLE_OPTIONS = [
  { 
    value: 'medical-illustration',
    label: 'Medical Illustration',
    icon: <Stethoscope className="h-4 w-4" />,
    description: 'Clean, anatomically accurate medical diagrams'
  },
  { 
    value: 'healthcare-professional',
    label: 'Healthcare Professional',
    icon: <Users className="h-4 w-4" />,
    description: 'Professional healthcare settings and workers'
  },
  { 
    value: 'patient-education',
    label: 'Patient Education',
    icon: <Heart className="h-4 w-4" />,
    description: 'Simple, friendly educational materials'
  },
  { 
    value: 'custom',
    label: 'Custom Style',
    icon: <Wand2 className="h-4 w-4" />,
    description: 'Define your own style and approach'
  }
]

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1792x1024', label: 'Landscape (1792x1024)' },
  { value: '1024x1792', label: 'Portrait (1024x1792)' }
]

const PROMPT_TEMPLATES = {
  'medical-illustration': [
    'Anatomical diagram of the human {organ} showing {detail}',
    'Medical infographic explaining {condition} with clear labels',
    'Cross-section view of {body_part} highlighting {feature}'
  ],
  'healthcare-professional': [
    'Healthcare team discussing {topic} in modern medical facility',
    'Doctor explaining {procedure} to patient in clinical setting',
    'Medical professional using {technology} for patient care'
  ],
  'patient-education': [
    'Simple illustration showing {health_tip} for patients',
    'Friendly diagram explaining {medical_concept} in plain language',
    'Step-by-step guide for {self_care_activity}'
  ]
}

export function AIImageGenerator({ onImageGenerated, defaultStyle = 'custom' }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState(defaultStyle)
  const [size, setSize] = useState('1024x1024')
  const [count, setCount] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('generate')

  const handleGenerate = async () => {
    if (prompt.length < 10) {
      setError('Please provide a more detailed prompt (at least 10 characters)')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/admin/media/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          size,
          count
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate images')
      }

      const data = await response.json()
      setGeneratedImages(data.images)
      
      if (onImageGenerated) {
        onImageGenerated(data.images)
      }

      // Switch to gallery tab to show results
      setActiveTab('gallery')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images')
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  const handleTemplateClick = (template: string) => {
    // Replace placeholders with example values
    const examplePrompt = template
      .replace('{organ}', 'heart')
      .replace('{detail}', 'blood flow patterns')
      .replace('{condition}', 'hypertension')
      .replace('{body_part}', 'knee joint')
      .replace('{feature}', 'ligament structure')
      .replace('{topic}', 'treatment options')
      .replace('{procedure}', 'minimally invasive surgery')
      .replace('{technology}', 'AI-assisted diagnostics')
      .replace('{health_tip}', 'proper medication adherence')
      .replace('{medical_concept}', 'blood pressure management')
      .replace('{self_care_activity}', 'home glucose monitoring')
    
    setPrompt(examplePrompt)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Failed to download:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Image Generator
        </CardTitle>
        <CardDescription>
          Generate HIPAA-compliant healthcare images using AI with medical accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="gallery">
              Gallery {generatedImages.length > 0 && `(${generatedImages.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Style Template</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Templates */}
            {style !== 'custom' && PROMPT_TEMPLATES[style as keyof typeof PROMPT_TEMPLATES] && (
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_TEMPLATES[style as keyof typeof PROMPT_TEMPLATES].map((template, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant="outline"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Template {idx + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the healthcare image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about medical accuracy requirements and avoid any PHI
              </p>
            </div>

            {/* Image Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Image Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Images</Label>
                <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">2 Images</SelectItem>
                    <SelectItem value="3">3 Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress Bar */}
            {generating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating images...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={generating || prompt.length < 10}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Images
                </>
              )}
            </Button>

            {/* Cost Estimate */}
            <div className="text-center text-xs text-muted-foreground">
              Estimated cost: ${(count * 0.04).toFixed(2)} (DALL-E 3)
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            {generatedImages.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No images generated yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('generate')}
                >
                  Generate Your First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={image.media.ai_prompt}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black/50 text-white">
                          AI Generated
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {image.media.ai_prompt}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(image.url, image.id)}
                        >
                          {copiedId === image.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadImage(image.url, image.media.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}