'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Info,
  Edit3,
  Save,
  X,
  Copy,
  Eye,
  Download,
  Trash2,
  Calendar,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
  Camera,
  Settings,
  Tag,
  Folder,
  User,
  Clock,
  Ruler,
  Palette,
  Zap,
  HardDrive,
  Globe,
  Link2,
  Heart,
  Star,
  BarChart3,
  TrendingUp,
  MapPin,
  Aperture,
  Flashlight,
  Focus,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Hash,
  Database,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Maximize2,
  RotateCw,
  Crop,
  Filter as FilterIcon,
  Sliders
} from 'lucide-react'
import SeoFields, { MediaSeoData } from '@/components/admin/media/SeoFields'

interface MediaItem {
  id: string
  filename: string
  original_filename: string
  file_path: string
  mime_type: string
  file_size: number
  alt_text?: string
  caption?: string
  uploaded_by: string
  created_at: string
  updated_at: string
  width?: number
  height?: number
  duration?: number
  folder?: string
  tags?: string[]
  favorites?: boolean
  downloads?: number
  views?: number
  exif_data?: any
  color_profile?: string
  dominant_colors?: string[]
  blur_hash?: string
  usage_count?: number
  last_accessed?: string
  file_hash?: string
  compression_ratio?: number
  optimization_applied?: boolean
}

interface MediaUsage {
  page_title: string
  page_url: string
  usage_type: 'hero' | 'content' | 'thumbnail' | 'background' | 'icon'
  last_used: string
}

interface MediaDetailsUpdate {
  alt_text?: string
  caption?: string
  folder?: string
  tags?: string[]
  favorites?: boolean
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  og_title?: string
  og_description?: string
  twitter_title?: string
  twitter_description?: string
}

interface MediaDetailsPanelProps {
  item: MediaItem | null
  open: boolean
  onClose: () => void
  onUpdate?: (id: string, updates: MediaDetailsUpdate) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDownload?: (item: MediaItem) => void
  onEdit?: (item: MediaItem) => void
  onViewFullSize?: (item: MediaItem) => void
  availableFolders?: string[]
  availableTags?: string[]
  className?: string
  showAdvanced?: boolean
  showUsageTracking?: boolean
  showOptimizationInfo?: boolean
}

export default function MediaDetailsPanel({
  item,
  open,
  onClose,
  onUpdate,
  onDelete,
  onDownload,
  onEdit,
  onViewFullSize,
  availableFolders = [],
  availableTags = [],
  className = '',
  showAdvanced = true,
  showUsageTracking = true,
  showOptimizationInfo = true
}: MediaDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedData, setEditedData] = useState<MediaDetailsUpdate>({})
  const [activeTab, setActiveTab] = useState('details')
  const [exifExpanded, setExifExpanded] = useState(false)
  const [colorAnalysisExpanded, setColorAnalysisExpanded] = useState(false)
  const [usageData, setUsageData] = useState<MediaUsage[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  
  const { toast } = useToast()

  // Reset editing state when item changes
  useEffect(() => {
    if (item) {
      setEditedData({
        alt_text: item.alt_text || '',
        caption: item.caption || '',
        folder: item.folder || '',
        tags: item.tags || [],
        favorites: item.favorites || false,
        seo_title: (item as any).seo_title || '',
        seo_description: (item as any).seo_description || '',
        seo_keywords: (item as any).seo_keywords || [],
        og_title: (item as any).og_title || '',
        og_description: (item as any).og_description || '',
        twitter_title: (item as any).twitter_title || '',
        twitter_description: (item as any).twitter_description || ''
      })
      setIsEditing(false)
      setActiveTab('details')
    }
  }, [item])

  // Load usage data
  useEffect(() => {
    if (item && showUsageTracking && activeTab === 'usage') {
      loadUsageData()
    }
  }, [item, activeTab, showUsageTracking])

  const loadUsageData = async () => {
    if (!item) return

    setLoadingUsage(true)
    try {
      const response = await fetch(`/api/admin/media/${item.id}/usage`)
      if (response.ok) {
        const data = await response.json()
        setUsageData(data.usage || [])
      }
    } catch (error) {
      console.error('Failed to load usage data:', error)
    } finally {
      setLoadingUsage(false)
    }
  }

  const handleSave = async () => {
    if (!item) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      })
      if (!res.ok) throw new Error('Failed to update media')
      await onUpdate?.(item.id, editedData)
      setIsEditing(false)
      toast({ title: 'Success', description: 'Media details updated successfully' })
    } catch (error) {
      console.error('Failed to update media:', error)
      toast({ title: 'Error', description: 'Failed to update media details', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete media')
      await onDelete?.(item.id)
      onClose()
      toast({ title: 'Success', description: 'Media file deleted successfully' })
    } catch (error) {
      console.error('Failed to delete media:', error)
      toast({ title: 'Error', description: 'Failed to delete media file', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyUrl = useCallback(() => {
    if (!item) return
    
    const url = getPublicUrl(item)
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'Copied',
        description: 'File URL copied to clipboard'
      })
    })
  }, [item, toast])

  // Align with gallery naming to avoid any cross-file confusion during HMR
  function inferMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getFileIcon = (type: string, className = "h-5 w-5") => {
    switch (type) {
      case 'image': return <FileImage className={className} />
      case 'video': return <FileVideo className={className} />
      case 'audio': return <FileAudio className={className} />
      case 'document': return <FileText className={className} />
      default: return <File className={className} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPublicUrl = (item: MediaItem) => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const path = item.file_path || item.filename
    return `${base}/storage/v1/object/public/media/${path?.replace(/^media\//, '')}`
  }

  const getDimensions = (item: MediaItem) => {
    if (item.width && item.height) {
      const megapixels = (item.width * item.height / 1000000).toFixed(1)
      return `${item.width} × ${item.height} (${megapixels}MP)`
    }
    return 'Unknown'
  }

  const getAspectRatio = (item: MediaItem) => {
    if (!item.width || !item.height) return 'Unknown'
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(item.width, item.height)
    const ratioW = item.width / divisor
    const ratioH = item.height / divisor
    
    return `${ratioW}:${ratioH}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const parseExifValue = (key: string, value: any) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch (key.toLowerCase()) {
      case 'datetime':
      case 'datetimeoriginal':
      case 'datetimedigitized':
        try {
          return new Date(value).toLocaleString()
        } catch {
          return value.toString()
        }
      case 'fnumber':
        return `f/${value}`
      case 'exposuretime':
        if (value < 1) {
          return `1/${Math.round(1/value)}`
        }
        return `${value}s`
      case 'iso':
      case 'isospeedratings':
        return `ISO ${value}`
      case 'focallength':
        return `${value}mm`
      case 'flash':
        const flashModes = ['No flash', 'Flash', 'Flash (no return)', 'Flash (return)', 'Flash (auto)', 'No flash (auto)', 'Red-eye reduction']
        return flashModes[value] || `Flash mode ${value}`
      case 'whitebalance':
        const wbModes = ['Auto', 'Manual']
        return wbModes[value] || `WB ${value}`
      case 'meteringmode':
        const meteringModes = ['Unknown', 'Average', 'Center-weighted', 'Spot', 'Multi-spot', 'Pattern', 'Partial']
        return meteringModes[value] || `Metering ${value}`
      case 'orientation':
        const orientations = ['', 'Normal', 'Flip horizontal', 'Rotate 180', 'Flip vertical', 'Transpose', 'Rotate 90', 'Transverse', 'Rotate 270']
        return orientations[value] || `Orientation ${value}`
      case 'colorspace':
        return value === 1 ? 'sRGB' : value === 65535 ? 'Uncalibrated' : `Color space ${value}`
      case 'exposureprogram':
        const programs = ['Not defined', 'Manual', 'Auto', 'Aperture priority', 'Shutter priority', 'Creative', 'Action', 'Portrait', 'Landscape']
        return programs[value] || `Program ${value}`
      default:
        if (typeof value === 'number') {
          return value.toLocaleString()
        }
        return value.toString()
    }
  }

  const exifCategories = useMemo(() => {
    if (!item?.exif_data) return []
    
    const categories = {
      camera: {
        title: 'Camera Information',
        icon: <Camera className="h-4 w-4" />,
        fields: ['make', 'model', 'software', 'artist', 'copyright']
      },
      exposure: {
        title: 'Exposure Settings',
        icon: <Aperture className="h-4 w-4" />,
        fields: ['fnumber', 'exposuretime', 'iso', 'isospeedratings', 'exposureprogram', 'exposurebias', 'meteringmode', 'flash']
      },
      lens: {
        title: 'Lens Information',
        icon: <Focus className="h-4 w-4" />,
        fields: ['focallength', 'focallength35mm', 'maxaperturevalue', 'lensmake', 'lensmodel']
      },
      image: {
        title: 'Image Properties',
        icon: <ImageIcon className="h-4 w-4" />,
        fields: ['colorspace', 'whitebalance', 'orientation', 'compression', 'photometricinterpretation', 'samplesperpixel', 'bitspersample']
      },
      location: {
        title: 'Location Data',
        icon: <MapPin className="h-4 w-4" />,
        fields: ['gpslatitude', 'gpslongitude', 'gpsaltitude', 'gpstimestamp', 'gpssatellites', 'gpsmapsdatum']
      },
      datetime: {
        title: 'Date & Time',
        icon: <Clock className="h-4 w-4" />,
        fields: ['datetime', 'datetimeoriginal', 'datetimedigitized', 'subsectime', 'offsettime']
      }
    }

    return Object.entries(categories).map(([key, category]) => ({
      key,
      ...category,
      data: category.fields.reduce((acc, field) => {
        const value = item.exif_data[field] || item.exif_data[field.toLowerCase()] || item.exif_data[field.toUpperCase()]
        if (value !== undefined && value !== null) {
          acc[field] = value
        }
        return acc
      }, {} as Record<string, any>)
    })).filter(category => Object.keys(category.data).length > 0)
  }, [item?.exif_data])

  if (!item) return null

  const itemType = inferMediaType(item.mime_type)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className={`w-[500px] sm:w-[600px] overflow-hidden ${className}`}>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 font-display">
              {getFileIcon(itemType)}
              <span className="truncate">{item.original_filename}</span>
              {item.favorites && <Heart className="h-4 w-4 text-red-500 fill-current" />}
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedData({
                        alt_text: item.alt_text || '',
                        caption: item.caption || '',
                        folder: item.folder || '',
                        tags: item.tags || [],
                        favorites: item.favorites || false
                      })
                    }}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <SheetDescription className="font-text">
            View and edit media file details and metadata
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            {showUsageTracking && <TabsTrigger value="usage">Usage</TabsTrigger>}
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-6 pr-4">
              {/* Preview */}
              <Card>
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden border">
                    {itemType === 'image' ? (
                      <img
                        src={getPublicUrl(item)}
                        alt={item.alt_text || item.original_filename}
                        className="w-full h-full object-contain"
                      />
                    ) : itemType === 'video' ? (
                      <video
                        src={getPublicUrl(item)}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          {getFileIcon(itemType, "h-16 w-16 text-gray-400")}
                          <p className="text-sm text-gray-600 mt-2 font-text">
                            {item.mime_type}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewFullSize?.(item)}
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Full Size
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getPublicUrl(item), '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <TabsContent value="details" className="mt-0 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Info className="h-5 w-5 text-blue-600" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 font-text">File Name</Label>
                        <p className="text-sm text-gray-900 break-all font-text">{item.original_filename}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 font-text">File Size</Label>
                        <p className="text-sm text-gray-900 font-text">{formatFileSize(item.file_size)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 font-text">File Type</Label>
                        <Badge variant="outline" className="font-text">{item.mime_type}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 font-text">Upload Date</Label>
                        <p className="text-sm text-gray-900 font-text">{formatDate(item.created_at)}</p>
                      </div>
                      {itemType === 'image' && (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 font-text">Dimensions</Label>
                            <p className="text-sm text-gray-900 font-text">{getDimensions(item)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 font-text">Aspect Ratio</Label>
                            <p className="text-sm text-gray-900 font-text">{getAspectRatio(item)}</p>
                          </div>
                        </>
                      )}
                      {(itemType === 'video' || itemType === 'audio') && item.duration && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 font-text">Duration</Label>
                          <p className="text-sm text-gray-900 font-text">{formatDuration(item.duration)}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Editable Fields */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="alt-text" className="font-text">Alt Text</Label>
                        {isEditing ? (
                          <Input
                            id="alt-text"
                            placeholder="Describe the image for accessibility"
                            value={editedData.alt_text || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, alt_text: e.target.value }))}
                            className="mt-1 font-text"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1 font-text">
                            {item.alt_text || <span className="text-gray-400 italic">Not set</span>}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="caption" className="font-text">Caption</Label>
                        {isEditing ? (
                          <Textarea
                            id="caption"
                            placeholder="Add a caption for this file"
                            value={editedData.caption || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, caption: e.target.value }))}
                            className="mt-1 font-text"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1 font-text">
                            {item.caption || <span className="text-gray-400 italic">No caption</span>}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="folder" className="font-text">Folder</Label>
                        {isEditing ? (
                          <div className="mt-1">
                            <Input
                              id="folder"
                              placeholder="e.g., blog-images, documents"
                              value={editedData.folder || ''}
                              onChange={(e) => setEditedData(prev => ({ ...prev, folder: e.target.value }))}
                              className="font-text"
                              list="folders"
                            />
                            <datalist id="folders">
                              {availableFolders.map(folder => (
                                <option key={folder} value={folder} />
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            {item.folder ? (
                              <>
                                <Folder className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900 font-text">{item.folder}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-sm font-text">No folder</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="tags" className="font-text">Tags</Label>
                        {isEditing ? (
                          <div className="mt-1">
                            <Input
                              id="tags"
                              placeholder="e.g., hero, banner, medical"
                              value={editedData.tags?.join(', ') || ''}
                              onChange={(e) => setEditedData(prev => ({ 
                                ...prev, 
                                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                              }))}
                              className="font-text"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            {item.tags && item.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm font-text">No tags</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* URL & Sharing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Link2 className="h-5 w-5 text-blue-600" />
                      URL & Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="font-text">Public URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={getPublicUrl(item)}
                            readOnly
                            className="font-mono text-xs bg-gray-50 font-text"
                          />
                          <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {item.file_hash && (
                        <div>
                          <Label className="font-text">File Hash</Label>
                          <Input
                            value={item.file_hash}
                            readOnly
                            className="font-mono text-xs bg-gray-50 mt-1 font-text"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-6">
                <SeoFields
                  value={{
                    seo_title: editedData.seo_title,
                    seo_description: editedData.seo_description,
                    seo_keywords: editedData.seo_keywords,
                    og_title: editedData.og_title,
                    og_description: editedData.og_description,
                    twitter_title: editedData.twitter_title,
                    twitter_description: editedData.twitter_description
                  }}
                  editable={isEditing}
                  onChange={(v: MediaSeoData) => setEditedData(prev => ({ ...prev, ...v }))}
                />
              </TabsContent>

              <TabsContent value="technical" className="mt-0 space-y-6">
                {/* Technical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Technical Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-text">File ID:</span>
                        <span className="font-mono text-xs font-text">{item.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-text">Storage Path:</span>
                        <span className="font-mono text-xs truncate font-text">{item.file_path}</span>
                      </div>
                      {item.color_profile && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-text">Color Profile:</span>
                          <span className="font-text">{item.color_profile}</span>
                        </div>
                      )}
                      {showOptimizationInfo && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-text">Optimized:</span>
                            <Badge variant={item.optimization_applied ? "default" : "secondary"} className="text-xs">
                              {item.optimization_applied ? "Yes" : "No"}
                            </Badge>
                          </div>
                          {item.compression_ratio && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-text">Compression:</span>
                              <span className="font-text">{(item.compression_ratio * 100).toFixed(1)}%</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-text">Views:</span>
                        <span className="font-text">{item.views || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-text">Downloads:</span>
                        <span className="font-text">{item.downloads || 0}</span>
                      </div>
                      {item.last_accessed && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-600 font-text">Last Accessed:</span>
                          <span className="font-text">{formatDate(item.last_accessed)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Color Analysis */}
                {itemType === 'image' && item.dominant_colors && (
                  <Card>
                    <CardHeader>
                      <CardTitle 
                        className="flex items-center justify-between cursor-pointer font-display"
                        onClick={() => setColorAnalysisExpanded(!colorAnalysisExpanded)}
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-blue-600" />
                          Color Analysis
                        </div>
                        <motion.div
                          animate={{ rotate: colorAnalysisExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RotateCw className="h-4 w-4" />
                        </motion.div>
                      </CardTitle>
                    </CardHeader>
                    <AnimatePresence>
                      {colorAnalysisExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <Label className="font-text">Dominant Colors</Label>
                                <div className="flex gap-2 mt-2">
                                  {item.dominant_colors.map((color, index) => (
                                    <div key={index} className="text-center">
                                      <div
                                        className="w-8 h-8 rounded border border-gray-200"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                      <span className="text-xs text-gray-600 font-mono mt-1 block font-text">
                                        {color}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {item.blur_hash && (
                                <div>
                                  <Label className="font-text">Blur Hash</Label>
                                  <Input
                                    value={item.blur_hash}
                                    readOnly
                                    className="font-mono text-xs bg-gray-50 mt-1 font-text"
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )}

                {/* EXIF Data */}
                {itemType === 'image' && exifCategories.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle 
                        className="flex items-center justify-between cursor-pointer font-display"
                        onClick={() => setExifExpanded(!exifExpanded)}
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="h-5 w-5 text-blue-600" />
                          EXIF Data ({exifCategories.length} categories)
                        </div>
                        <motion.div
                          animate={{ rotate: exifExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RotateCw className="h-4 w-4" />
                        </motion.div>
                      </CardTitle>
                    </CardHeader>
                    <AnimatePresence>
                      {exifExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <CardContent>
                            <div className="space-y-6">
                              {exifCategories.map(category => (
                                <div key={category.key}>
                                  <div className="flex items-center gap-2 mb-3">
                                    {category.icon}
                                    <h4 className="font-medium font-display">{category.title}</h4>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 pl-6">
                                    {Object.entries(category.data).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-gray-600 capitalize font-text">
                                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                                        </span>
                                        <span className="text-gray-900 font-text">
                                          {parseExifValue(key, value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )}
              </TabsContent>

              {showUsageTracking && (
                <TabsContent value="usage" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg font-display">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Usage Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600 font-display">{item.views || 0}</div>
                          <div className="text-sm text-gray-600 font-text">Views</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 font-display">{item.downloads || 0}</div>
                          <div className="text-sm text-gray-600 font-text">Downloads</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600 font-display">{item.usage_count || 0}</div>
                          <div className="text-sm text-gray-600 font-text">Used In</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg font-display">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Where It's Used
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingUsage ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : usageData.length > 0 ? (
                        <div className="space-y-3">
                          {usageData.map((usage, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium font-text">{usage.page_title}</p>
                                <p className="text-sm text-gray-600 font-text">{usage.page_url}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {usage.usage_type}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600 font-text">
                                  {formatDate(usage.last_used)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-text">This file is not currently used on your site</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="actions" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-display">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => onViewFullSize?.(item)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Size
                    </Button>
                    
                    <Button
                      onClick={() => onDownload?.(item)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download File
                    </Button>
                    
                    <Button
                      onClick={handleCopyUrl}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    
                    {itemType === 'image' && onEdit && (
                      <Button
                        onClick={() => onEdit(item)}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Crop className="mr-2 h-4 w-4" />
                        Edit Image
                      </Button>
                    )}
                    
                    <Separator />
                    
                    <Button
                      onClick={handleDelete}
                      className="w-full justify-start"
                      variant="destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete File
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}