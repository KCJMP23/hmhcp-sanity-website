'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EnhancedMediaGallery } from './enhanced-media-gallery/enhanced-media-gallery-refactored'
import { UsageTracker } from './usage-tracker'
import { AIImageGenerator } from './ai-image-generator'
import { ChunkedUploader } from './chunked-uploader'
import { 
  Images, 
  Upload, 
  Sparkles, 
  BarChart3,
  Settings,
  FileUp
} from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  cdn_url: string
  mime_type: string
  file_size: number
  [key: string]: unknown
}

interface MediaLibraryEnhancedProps {
  onMediaSelect?: (media: MediaItem) => void
  defaultTab?: string
}

export function MediaLibraryEnhanced({ 
  onMediaSelect, 
  defaultTab = 'library' 
}: MediaLibraryEnhancedProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [showUsageDialog, setShowUsageDialog] = useState(false)
  const [_uploadedMediaItems, setUploadedMediaItems] = useState<MediaItem[]>([])
  const [_generatedImages, setGeneratedImages] = useState<MediaItem[]>([])

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMediaId(media.id)
    if (onMediaSelect) {
      onMediaSelect(media)
    }
  }

  const handleViewUsage = (mediaId: string) => {
    setSelectedMediaId(mediaId)
    setShowUsageDialog(true)
  }

  const handleChunkedUploadComplete = (media: MediaItem) => {
    setUploadedMediaItems(prev => [...prev, media])
    // Switch to library tab to show the new upload
    setActiveTab('library')
  }

  const handleAIGenerated = (images: MediaItem[]) => {
    setGeneratedImages(prev => [...prev, ...images])
    // Optionally switch to library tab
    setActiveTab('library')
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="library" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Images className="h-4 w-4 mr-2" />
              Media Library
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger 
              value="chunked" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Large Files
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="library" className="flex-1 mt-0">
          <EnhancedMediaGallery />
        </TabsContent>

        <TabsContent value="upload" className="flex-1 mt-0 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Upload</CardTitle>
              <CardDescription>
                Upload images and files up to 10MB. Files are automatically optimized for web delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports JPG, PNG, GIF, WebP, PDF (max 10MB)
                </p>
                <Button>
                  Select Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunked" className="flex-1 mt-0 p-6">
          <ChunkedUploader onUploadComplete={handleChunkedUploadComplete} />
        </TabsContent>

        <TabsContent value="generate" className="flex-1 mt-0 p-6">
          <AIImageGenerator onImageGenerated={handleAIGenerated} />
        </TabsContent>

        <TabsContent value="usage" className="flex-1 mt-0 p-6">
          {selectedMediaId ? (
            <UsageTracker 
              mediaId={selectedMediaId}
              onNavigate={(type, id) => {
                console.log('Navigate to:', type, id)
                // Implement navigation logic
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Select Media to View Usage</p>
                <p className="text-sm text-muted-foreground">
                  Choose a media item from the library to see where it's being used
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('library')}
                >
                  Go to Library
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0 p-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>
                  Configure automatic image optimization and processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-optimize uploads</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically compress and generate responsive versions
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">WebP generation</p>
                    <p className="text-sm text-muted-foreground">
                      Create WebP versions for modern browsers
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AVIF generation</p>
                    <p className="text-sm text-muted-foreground">
                      Create AVIF versions for next-gen compression
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Healthcare Compliance</CardTitle>
                <CardDescription>
                  HIPAA and medical accuracy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">PHI detection</p>
                    <p className="text-sm text-muted-foreground">
                      Scan images for potential Protected Health Information
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Watermarking</p>
                    <p className="text-sm text-muted-foreground">
                      Add copyright watermarks to proprietary content
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Medical accuracy review</p>
                    <p className="text-sm text-muted-foreground">
                      Require review for medical illustrations
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CDN Settings</CardTitle>
                <CardDescription>
                  Content delivery network configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Vercel Image Optimization</p>
                    <p className="text-sm text-muted-foreground">
                      Use Vercel's built-in image optimization
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">CloudFlare CDN</p>
                    <p className="text-sm text-muted-foreground">
                      Distribute media through CloudFlare's global network
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Usage Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Usage Analytics</DialogTitle>
          </DialogHeader>
          {selectedMediaId && (
            <UsageTracker 
              mediaId={selectedMediaId}
              onNavigate={(type, id) => {
                console.log('Navigate to:', type, id)
                setShowUsageDialog(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}