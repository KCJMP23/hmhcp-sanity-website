'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CustomLinkFormProps } from './types'

export function CustomLinkForm({ onAdd }: CustomLinkFormProps) {
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')

  const handleSubmit = () => {
    if (url && label) {
      onAdd(url, label)
      setUrl('')
      setLabel('')
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div>
        <Label className="text-xs">Link Text</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Menu item label"
        />
      </div>
      <Button onClick={handleSubmit} size="sm" className="w-full">
        Add to Menu
      </Button>
    </div>
  )
}