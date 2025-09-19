'use client'

import { useState } from 'react'
import { X as XMarkIcon, Sparkles as SparklesIcon } from 'lucide-react'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface ImageGeneratorProps {
  onGenerate: (imageUrl: string) => void
  onClose: () => void
}

// Mock generated images for demonstration
const MOCK_GENERATED_IMAGES = [
  {
    id: 1,
    url: '/images/hot-honey-desserts.png',
    prompt: 'Hot honey desserts in white ramekins'
  },
  {
    id: 2,
    url: '/images/july-4-hothoneyfever.png',
    prompt: 'July 4th hot honey fever with American flags'
  },
  {
    id: 3,
    url: '/images/hot-honey-bbq-feat.png',
    prompt: 'Hot honey BBQ with grilled meats and corn'
  },
  {
    id: 4,
    url: '/images/hot-honey-smoothies.png',
    prompt: 'Hot honey smoothies and drinks'
  },
  {
    id: 5,
    url: '/images/hot-honey-cocktails.png',
    prompt: 'Hot honey cocktails with lime and chili'
  },
  {
    id: 6,
    url: '/images/hot-honey-mothers-day.png',
    prompt: 'Hot honey gift basket for Mother\'s Day'
  }
]

export default function ImageGenerator({ onGenerate, onClose }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [followUpPrompt, setFollowUpPrompt] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    // Simulate AI image generation
    setTimeout(() => {
      // In production, this would call your AI image generation API
      const mockGeneratedUrl = '/images/generated-fall-scene.png'
      setGeneratedImage(mockGeneratedUrl)
      setIsGenerating(false)
    }, 3000)
  }

  const handleKeep = () => {
    if (generatedImage) {
      onGenerate(generatedImage)
    } else if (selectedImage) {
      const image = MOCK_GENERATED_IMAGES.find(img => img.id === selectedImage)
      if (image) {
        onGenerate(image.url)
      }
    }
  }

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim()) return
    
    setIsGenerating(true)
    
    // Simulate follow-up generation
    setTimeout(() => {
      const mockFollowUpUrl = '/images/generated-follow-up.png'
      setGeneratedImage(mockFollowUpUrl)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generate image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Main Image Generation Area */}
          <div className="mb-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Describe your image"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg"
              />
            </div>
            
            {/* Generate Button */}
            <div className="flex justify-center">
              <LiquidGlassButton
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                variant="primary"
                size="lg"
                className="text-lg"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
              </LiquidGlassButton>
            </div>
          </div>

          {/* Generated Image Display */}
          {isGenerating && (
            <div className="mb-6">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-8 text-center">
                <div className="text-2xl font-semibold text-gray-700 mb-2">Generating...</div>
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                </div>
                <p className="text-gray-600">Creating your image with AI</p>
              </div>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    // Fallback for missing images
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-lg font-medium text-gray-700">Generated Image</div>
                    <div className="text-sm text-gray-500">Hot honey on a fall day in an apple orchard</div>
                  </div>
                </div>
                
                {/* Follow-up Prompt */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ask a follow up"
                      value={followUpPrompt}
                      onChange={(e) => setFollowUpPrompt(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <LiquidGlassButton
                    onClick={handleFollowUp}
                    disabled={!followUpPrompt.trim()}
                    variant="secondary-light"
                    size="sm"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Refine
                  </LiquidGlassButton>
                </div>
              </div>
            </div>
          )}

          {/* Previous Generations */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Previous generations</h3>
            <div className="grid grid-cols-3 gap-4">
              {MOCK_GENERATED_IMAGES.map((image) => (
                <div
                  key={image.id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedImage === image.id
                      ? 'border-gray-900 ring-2 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImage(selectedImage === image.id ? null : image.id)}
                >
                  {/* Checkbox */}
                  <div className={`absolute top-2 left-2 w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedImage === image.id
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedImage === image.id && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="hidden w-full h-24 bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-400 text-xs text-center px-2">
                      {image.prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <LiquidGlassButton
            onClick={handleKeep}
            disabled={!generatedImage && !selectedImage}
            variant="primary"
            size="md"
          >
            Keep Image
          </LiquidGlassButton>
        </div>
      </div>
    </div>
  )
}

