'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { SEOService } from '@/services/cms/seoService'
import { SCHEMA_TEMPLATES } from '@/types/seo'
import type { CMSPage } from '@/types/cms-content'
import type { SchemaMarkup } from '@/types/cms-content'
import { Code, Copy, Check, AlertCircle } from 'lucide-react'

interface SchemaEditorProps {
  page: CMSPage
  onChange: (schema: SchemaMarkup) => void
  disabled?: boolean
}

export function SchemaEditor({ page, onChange, disabled }: SchemaEditorProps) {
  const [schemaType, setSchemaType] = useState<string>('article')
  const [schemaJson, setSchemaJson] = useState<string>('')
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateSchema = useCallback(async (type: string) => {
    try {
      const data = {
        title: page.seo?.metaTitle || page.title,
        description: page.seo?.metaDescription || page.excerpt || '',
        slug: page.slug,
        publishedAt: (page as any).publishedAt || new Date().toISOString(),
        updatedAt: (page as any).updatedAt || new Date().toISOString(),
        authorName: (page as any).author?.name || 'HM Healthcare Partners Team',
        featuredImage: page.seo?.openGraphImage || '',
        // Add more fields as needed based on schema type
      }

      const schema = await SEOService.generateSchemaMarkup(data, type)
      setSchemaJson(JSON.stringify(schema, null, 2))
      setIsValid(true)
      setError('')
      onChange(schema)
    } catch (error) {
      setError('Failed to generate schema')
      setIsValid(false)
    }
  }, [page, onChange])

  useEffect(() => {
    // Check if page has any schema data in seo metadata
    if (page.seo && (page.seo as any).structuredData) {
      setSchemaJson(JSON.stringify((page.seo as any).structuredData, null, 2))
    } else {
      generateSchema(schemaType)
    }
  }, [page.seo, schemaType, generateSchema])

  const handleSchemaTypeChange = (type: string) => {
    setSchemaType(type)
    generateSchema(type)
  }

  const handleJsonChange = (value: string) => {
    setSchemaJson(value)
    
    try {
      const parsed = JSON.parse(value)
      setIsValid(true)
      setError('')
      onChange(parsed)
    } catch (e) {
      setIsValid(false)
      setError('Invalid JSON format')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(schemaJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      toast({
        title: 'Copied to clipboard',
        description: 'Schema markup has been copied',
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const validateSchema = async () => {
    try {
      const parsed = JSON.parse(schemaJson)
      
      // Basic validation
      if (!parsed['@context'] || !parsed['@type']) {
        throw new Error('Missing required @context or @type')
      }
      
      toast({
        title: 'Schema is valid',
        description: 'Your structured data is properly formatted',
      })
    } catch (error) {
      toast({
        title: 'Schema validation failed',
        description: error instanceof Error ? error.message : 'Invalid schema format',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Structured Data (Schema.org)
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isValid && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Invalid
              </Badge>
            )}
            {isValid && schemaJson && (
              <Badge variant="default" className="bg-blue-100 text-blue-600">
                Valid
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schema Type Selector */}
        <div>
          <Label htmlFor="schema-type">Schema Type</Label>
          <Select
            value={schemaType}
            onValueChange={handleSchemaTypeChange}
            disabled={disabled}
          >
            <SelectTrigger id="schema-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
              <SelectItem value="localBusiness">Local Business</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="faq">FAQ Page</SelectItem>
              <SelectItem value="breadcrumb">Breadcrumb</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* JSON Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="schema-json">JSON-LD Markup</Label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                disabled={!schemaJson || disabled}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={validateSchema}
                disabled={!schemaJson || disabled}
              >
                Validate
              </Button>
            </div>
          </div>
          
          <Textarea
            id="schema-json"
            value={schemaJson}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder="Enter or generate JSON-LD markup"
            className={cn(
              'font-mono text-sm min-h-[300px]',
              !isValid && 'border-red-500'
            )}
            disabled={disabled}
          />
          
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>

        {/* Preview */}
        <div>
          <Label>Preview</Label>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 mt-2">
            <code className="text-xs">
              <pre className="whitespace-pre-wrap break-all">
                {`<script type="application/ld+json">\n${schemaJson}\n</script>`}
              </pre>
            </code>
          </div>
        </div>

        {/* Schema Templates Reference */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Available Variables
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            The following variables are automatically populated:
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1">
            <li>• Title, Description, URL</li>
            <li>• Published/Modified dates</li>
            <li>• Author information</li>
            <li>• Featured image</li>
            <li>• Organization details</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}