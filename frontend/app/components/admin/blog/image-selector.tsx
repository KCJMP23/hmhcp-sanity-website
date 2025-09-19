'use client'

import { useState, useRef } from 'react'
import { X as XMarkIcon, Search as MagnifyingGlassIcon, Image as PhotoIcon, Upload as ArrowUpTrayIcon } from 'lucide-react'

interface ImageSelectorProps {
  onSelect: (imageUrl: string) => void
  onClose: () => void
}

interface ImageItem {
  id: string
  url: string
  alt: string
  tags: string[]
  uploadedAt: string
}

export default function ImageSelector({ onSelect, onClose }: ImageSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock image data - replace with real data from API
  const mockImages: ImageItem[] = [
    {
      id: '1',
      url: '/images/healthcare-innovation.jpg',
      alt: 'Healthcare Innovation',
      tags: ['healthcare', 'innovation', 'technology'],
      uploadedAt: '2024-01-15'
    },
    {
      id: '2',
      url: '/images/digital-transformation.jpg',
      alt: 'Digital Transformation',
      tags: ['digital', 'transformation', 'healthcare'],
      uploadedAt: '2024-01-14'
    },
    {
      id: '3',
      url: '/images/patient-engagement.jpg',
      alt: 'Patient Engagement',
      tags: ['patient', 'engagement', 'care'],
      uploadedAt: '2024-01-13'
    },
    {
      id: '4',
      url: '/images/medical-technology.jpg',
      alt: 'Medical Technology',
      tags: ['medical', 'technology', 'innovation'],
      uploadedAt: '2024-01-12'
    }
  ]

  const filteredImages = mockImages.filter(image => {
    const matchesSearch = image.alt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filter === 'all' || image.tags.includes(filter)
    return matchesSearch && matchesFilter
  })

  const handleImageSelect = (imageUrl: string) => {
    onSelect(imageUrl)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('image', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/admin/blog/upload-image', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        console.log('Image uploaded successfully:', result.imageUrl)
        
        // Add the new image to the list (in a real app, this would refresh from the API)
        // For now, we'll just close the modal and let the parent handle it
        onSelect(result.imageUrl)
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="all">All tags</option>
                <option value="healthcare">Healthcare</option>
                <option value="technology">Technology</option>
                <option value="innovation">Innovation</option>
                <option value="patient">Patient</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={triggerFileUpload}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Image Grid/List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by uploading an image.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={`group relative cursor-pointer rounded-lg border-2 border-transparent hover:border-gray-300 transition-all ${
                    viewMode === 'list' ? 'flex items-center space-x-3 p-3 bg-gray-50' : ''
                  }`}
                  onClick={() => handleImageSelect(image.url)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all">
                          <button className="px-3 py-1 bg-white text-gray-900 rounded-md text-sm font-medium shadow-sm">
                            Select
                          </button>
                        </div>
                      </div>
                      
                      {/* Image info */}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{image.alt}</p>
                        <p className="text-xs text-gray-500">{image.uploadedAt}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{image.alt}</p>
                        <p className="text-xs text-gray-500">{image.uploadedAt}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {image.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{image.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

