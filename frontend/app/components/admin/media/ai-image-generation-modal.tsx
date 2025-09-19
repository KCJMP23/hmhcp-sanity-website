'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wand2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
  Settings,
  Save,
  Eye,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { AIImageGeneration } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface AIImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageData: {
    url: string;
    prompt: string;
    metadata: AIImageGeneration;
    healthcareCompliant: boolean;
  }) => void;
}

const HEALTHCARE_STYLES = [
  { value: 'medical_illustration', label: 'Medical Illustration', description: 'Detailed anatomical or medical diagrams' },
  { value: 'clinical_photo', label: 'Clinical Photo', description: 'Realistic medical photography style' },
  { value: 'diagram', label: 'Educational Diagram', description: 'Clear educational diagrams and charts' },
  { value: 'infographic', label: 'Medical Infographic', description: 'Informative visual representations' }
];

const HEALTHCARE_SIZES = [
  { value: 'square', label: 'Square (1024×1024)', description: 'Best for social media and thumbnails' },
  { value: 'landscape', label: 'Landscape (1792×1024)', description: 'Wide format for presentations' },
  { value: 'portrait', label: 'Portrait (1024×1792)', description: 'Tall format for detailed views' }
];

const MEDICAL_PROMPT_TEMPLATES = [
  {
    category: 'Anatomy',
    prompts: [
      'Detailed cross-section of human heart showing chambers and valves',
      'Anatomical illustration of brain with labeled regions',
      'Skeletal system diagram with major bones highlighted',
      'Muscular system showing major muscle groups'
    ]
  },
  {
    category: 'Procedures',
    prompts: [
      'Step-by-step surgical procedure illustration',
      'Medical device usage demonstration',
      'Patient examination technique diagram',
      'Therapeutic procedure visualization'
    ]
  },
  {
    category: 'Conditions',
    prompts: [
      'Medical condition visualization with symptoms',
      'Disease progression diagram',
      'Treatment comparison infographic',
      'Patient care pathway illustration'
    ]
  },
  {
    category: 'Equipment',
    prompts: [
      'Medical equipment technical diagram',
      'Device usage instruction illustration',
      'Equipment maintenance guide visualization',
      'Medical technology comparison chart'
    ]
  }
];

export function AIImageGenerationModal({ isOpen, onClose, onImageGenerated }: AIImageGenerationModalProps) {
  const [generationData, setGenerationData] = useState<AIImageGeneration>({
    prompt: '',
    style: 'medical_illustration',
    size: 'square',
    quality: 'standard',
    healthcare_context: '',
    compliance_validation: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string;
    url: string;
    prompt: string;
    metadata: AIImageGeneration;
    healthcareCompliant: boolean;
    complianceScore: number;
  }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logger = new HealthcareAILogger('AIImageGenerationModal');

  const handleGenerate = async () => {
    if (!generationData.prompt.trim()) return;

    setIsGenerating(true);
    logger.log('Starting AI image generation', { 
      prompt: generationData.prompt,
      style: generationData.style,
      context: 'ai_image_generation'
    });

    try {
      // Simulate AI image generation with DALL-E
      const generatedImage = await simulateDALLEGeneration(generationData);
      
      const newImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: generatedImage.url,
        prompt: generationData.prompt,
        metadata: { ...generationData },
        healthcareCompliant: generatedImage.healthcareCompliant,
        complianceScore: generatedImage.complianceScore
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      
      logger.log('AI image generated successfully', { 
        imageId: newImage.id,
        complianceScore: newImage.complianceScore,
        context: 'ai_image_generation'
      });
    } catch (error) {
      logger.error('AI image generation failed', error, { context: 'ai_image_generation' });
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateDALLEGeneration = async (data: AIImageGeneration): Promise<{
    url: string;
    healthcareCompliant: boolean;
    complianceScore: number;
  }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate healthcare compliance validation
    const complianceScore = Math.random() * 40 + 60; // 60-100 score
    const healthcareCompliant = complianceScore >= 75;

    // Generate a mock image URL (in real implementation, this would be from DALL-E)
    const mockImageUrl = `https://picsum.photos/1024/1024?random=${Math.random()}`;

    return {
      url: mockImageUrl,
      healthcareCompliant,
      complianceScore: Math.round(complianceScore)
    };
  };

  const handleUseTemplate = (template: string) => {
    setGenerationData(prev => ({ ...prev, prompt: template }));
    setSelectedTemplate(template);
  };

  const handleSaveImage = (image: typeof generatedImages[0]) => {
    logger.log('Saving AI generated image', { 
      imageId: image.id,
      context: 'ai_image_generation'
    });
    
    onImageGenerated({
      url: image.url,
      prompt: image.prompt,
      metadata: image.metadata,
      healthcareCompliant: image.healthcareCompliant
    });
  };

  const handleDownloadImage = (image: typeof generatedImages[0]) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `ai-generated-${image.id}.jpg`;
    link.click();
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
                AI Image Generation
              </h2>
              <span className="text-sm text-gray-500">Powered by DALL-E 3</span>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Generation Panel */}
            <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Prompt Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Image Prompt
                  </label>
                  <textarea
                    value={generationData.prompt}
                    onChange={(e) => setGenerationData(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="Describe the medical image you want to generate..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be specific about medical accuracy and healthcare context
                  </p>
                </div>

                {/* Healthcare Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Healthcare Context
                  </label>
                  <input
                    type="text"
                    value={generationData.healthcare_context}
                    onChange={(e) => setGenerationData(prev => ({ ...prev, healthcare_context: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Cardiology, Pediatrics, Emergency Medicine"
                  />
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Style
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {HEALTHCARE_STYLES.map((style) => (
                      <label key={style.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="style"
                          value={style.value}
                          checked={generationData.style === style.value}
                          onChange={(e) => setGenerationData(prev => ({ ...prev, style: e.target.value as any }))}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{style.label}</div>
                          <div className="text-xs text-gray-500">{style.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Size
                  </label>
                  <div className="space-y-2">
                    {HEALTHCARE_SIZES.map((size) => (
                      <label key={size.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="size"
                          value={size.value}
                          checked={generationData.size === size.value}
                          onChange={(e) => setGenerationData(prev => ({ ...prev, size: e.target.value as any }))}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{size.label}</div>
                          <div className="text-xs text-gray-500">{size.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="quality"
                        value="standard"
                        checked={generationData.quality === 'standard'}
                        onChange={(e) => setGenerationData(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Standard</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="quality"
                        value="hd"
                        checked={generationData.quality === 'hd'}
                        onChange={(e) => setGenerationData(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">HD</span>
                    </label>
                  </div>
                </div>

                {/* Compliance Validation */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compliance"
                    checked={generationData.compliance_validation}
                    onChange={(e) => setGenerationData(prev => ({ ...prev, compliance_validation: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="compliance" className="ml-2 text-sm text-gray-700">
                    Enable healthcare compliance validation
                  </label>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !generationData.prompt.trim()}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Medical Image'}
                </button>
              </div>

              {/* Prompt Templates */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Prompt Templates</h3>
                <div className="space-y-4">
                  {MEDICAL_PROMPT_TEMPLATES.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>
                      <div className="space-y-1">
                        {category.prompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleUseTemplate(prompt)}
                            className={`w-full text-left p-2 text-xs rounded border transition-colors ${
                              selectedTemplate === prompt
                                ? 'border-purple-300 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="w-1/2 p-6 overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Images</h3>
              
              {generatedImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No images generated yet</h4>
                  <p className="text-gray-600">
                    Generate your first AI medical image using the form on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedImages.map((image) => (
                    <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getComplianceIcon(image.healthcareCompliant)}
                          <span className={`text-sm font-medium ${getComplianceColor(image.complianceScore)}`}>
                            Compliance: {image.complianceScore}%
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSaveImage(image)}
                            className="text-green-600 hover:text-green-800"
                            title="Save to media library"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadImage(image)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Download image"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                      
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Prompt:</p>
                        <p className="text-xs">{image.prompt}</p>
                      </div>
                      
                      {!image.healthcareCompliant && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <AlertCircleIcon className="h-4 w-4 inline mr-1" />
                          This image may not meet healthcare compliance standards. Please review before use.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
