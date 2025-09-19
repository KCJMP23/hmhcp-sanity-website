'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Link2, Check, X } from 'lucide-react'

interface CanonicalURLEditorProps {
  value: string
  slug: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CanonicalURLEditor({ value, slug, onChange, disabled }: CanonicalURLEditorProps) {
  const [url, setUrl] = useState(value)
  const [isValid, setIsValid] = useState(true)
  const [suggestion, setSuggestion] = useState('')
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmhealthcarepartners.com'
  const defaultCanonical = `${baseUrl}/${slug}`
  
  useEffect(() => {
    // Validate URL format
    if (url) {
      try {
        new URL(url)
        setIsValid(true)
      } catch {
        setIsValid(false)
      }
    } else {
      setIsValid(true)
    }
    
    // Generate suggestion if URL is different from default
    if (!url || url === defaultCanonical) {
      setSuggestion('')
    } else {
      setSuggestion(defaultCanonical)
    }
  }, [url, defaultCanonical])
  
  const handleUseDefault = () => {
    setUrl(defaultCanonical)
    onChange(defaultCanonical)
  }
  
  const handleUseSuggestion = () => {
    setUrl(suggestion)
    onChange(suggestion)
    setSuggestion('')
  }
  
  const handleChange = (value: string) => {
    setUrl(value)
    onChange(value)
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Canonical URL
          </CardTitle>
          {url && url !== defaultCanonical && (
            <Badge variant="outline" className="text-blue-600">
              Custom
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="canonical-url">Canonical URL</Label>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 relative">
              <Input
                id="canonical-url"
                value={url}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={defaultCanonical}
                disabled={disabled}
                className={!isValid ? 'border-red-500' : ''}
              />
              {!isValid && (
                <X className="absolute right-2 top-2.5 w-5 h-5 text-red-500" />
              )}
              {isValid && url && (
                <Check className="absolute right-2 top-2.5 w-5 h-5 text-blue-600" />
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleUseDefault}
              disabled={disabled || url === defaultCanonical}
            >
              Use Default
            </Button>
          </div>
          
          {!isValid && (
            <p className="text-sm text-red-600 mt-1">
              Please enter a valid URL
            </p>
          )}
          
          {!url && (
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to use the default canonical URL
            </p>
          )}
        </div>
        
        {suggestion && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Suggested canonical URL
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {suggestion}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUseSuggestion}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                  disabled={disabled}
                >
                  Use suggestion
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            What is a canonical URL?
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A canonical URL tells search engines which version of a page is the primary one
            when multiple URLs have similar content. This helps prevent duplicate content issues.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
            <li>• Use when this page is a duplicate of another</li>
            <li>• Point to the original/primary version</li>
            <li>• Leave empty for unique content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}