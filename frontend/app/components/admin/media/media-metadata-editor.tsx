'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  X, 
  Tag, 
  Info, 
  Shield, 
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MediaMetadata {
  id: string
  filename: string
  alt_text: string
  caption: string
  description: string
  tags: string[]
  category: string
  usage_rights: 'public' | 'restricted' | 'internal'
  license_type?: string
  attribution?: string
  medical_accuracy_verified: boolean
  hipaa_compliant: boolean
  ai_generated: boolean
  created_by: string
  created_at: string
  updated_at: string
  exif_data?: Record<string, any>
  custom_metadata?: Record<string, any>
}

interface MediaMetadataEditorProps {
  media: MediaMetadata
  onSave: (metadata: Partial<MediaMetadata>) => Promise<void>
  onCancel?: () => void
  categories?: string[]
  suggestedTags?: string[]
}

export function MediaMetadataEditor({
  media,
  onSave,
  onCancel,
  categories = [],
  suggestedTags = []
}: MediaMetadataEditorProps) {
  const [metadata, setMetadata] = useState<MediaMetadata>(media)
  const [tagInput, setTagInput] = useState('')
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (metadata.custom_metadata) {
      setCustomFields(
        Object.entries(metadata.custom_metadata).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      )
    }
  }, [metadata.custom_metadata])

  const handleSave = async () => {
    setIsSaving(true)
    setSavedStatus('saving')
    
    try {
      const customMetadata = customFields.reduce((acc, field) => {
        if (field.key && field.value) {
          acc[field.key] = field.value
        }
        return acc
      }, {} as Record<string, string>)

      await onSave({
        ...metadata,
        custom_metadata: customMetadata,
        updated_at: new Date().toISOString()
      })
      
      setSavedStatus('saved')
      setTimeout(() => setSavedStatus('idle'), 2000)
    } catch (error) {
      setSavedStatus('error')
      setTimeout(() => setSavedStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata({
        ...metadata,
        tags: [...metadata.tags, tag]
      })
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter(t => t !== tag)
    })
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }])
  }

  const updateCustomField = (index: number, field: { key: string; value: string }) => {
    const updated = [...customFields]
    updated[index] = field
    setCustomFields(updated)
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Media Metadata</CardTitle>
          <div className="flex items-center gap-2">
            {savedStatus === 'saved' && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            {savedStatus === 'error' && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="tags">Tags & Categories</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={metadata.filename}
                onChange={(e) => setMetadata({ ...metadata, filename: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="alt_text">Alt Text</Label>
              <Input
                id="alt_text"
                value={metadata.alt_text}
                onChange={(e) => setMetadata({ ...metadata, alt_text: e.target.value })}
                placeholder="Descriptive text for accessibility"
              />
            </div>

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={metadata.caption}
                onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                placeholder="Short caption for display"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                placeholder="Detailed description"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(tagInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {metadata.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      className="ml-2 hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {suggestedTags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags
                      .filter(tag => !metadata.tags.includes(tag))
                      .map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => addTag(tag)}
                        >
                          + {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={metadata.category}
                onValueChange={(value) => setMetadata({ ...metadata, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="usage_rights">Usage Rights</Label>
              <Select
                value={metadata.usage_rights}
                onValueChange={(value) => setMetadata({ 
                  ...metadata, 
                  usage_rights: value as MediaMetadata['usage_rights'] 
                })}
              >
                <SelectTrigger id="usage_rights">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="internal">Internal Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="medical_accuracy">Medical Accuracy Verified</Label>
                </div>
                <Switch
                  id="medical_accuracy"
                  checked={metadata.medical_accuracy_verified}
                  onCheckedChange={(checked) => setMetadata({ 
                    ...metadata, 
                    medical_accuracy_verified: checked 
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="hipaa">HIPAA Compliant</Label>
                </div>
                <Switch
                  id="hipaa"
                  checked={metadata.hipaa_compliant}
                  onCheckedChange={(checked) => setMetadata({ 
                    ...metadata, 
                    hipaa_compliant: checked 
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="ai_generated">AI Generated</Label>
                </div>
                <Switch
                  id="ai_generated"
                  checked={metadata.ai_generated}
                  onCheckedChange={(checked) => setMetadata({ 
                    ...metadata, 
                    ai_generated: checked 
                  })}
                />
              </div>

              <div>
                <Label htmlFor="license_type">License Type</Label>
                <Input
                  id="license_type"
                  value={metadata.license_type || ''}
                  onChange={(e) => setMetadata({ ...metadata, license_type: e.target.value })}
                  placeholder="e.g., CC BY 4.0, Proprietary"
                />
              </div>

              <div>
                <Label htmlFor="attribution">Attribution</Label>
                <Input
                  id="attribution"
                  value={metadata.attribution || ''}
                  onChange={(e) => setMetadata({ ...metadata, attribution: e.target.value })}
                  placeholder="Credit or source information"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>File Information</Label>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span>{metadata.created_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(metadata.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(metadata.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Custom Metadata</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomField}
                >
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, { 
                        ...field, 
                        key: e.target.value 
                      })}
                    />
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, { 
                        ...field, 
                        value: e.target.value 
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {metadata.exif_data && (
              <div>
                <Label>EXIF Data</Label>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(metadata.exif_data, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Metadata
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}