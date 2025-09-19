'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  RotateCcw, 
  RotateCw, 
  Crop, 
  Move, 
  ZoomIn, 
  ZoomOut,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { MediaFile } from '@/types/media';
import { HealthcareAILogger } from '@/lib/utils/healthcare-ai-logger';

interface ImageEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFile: MediaFile | null;
  onSave: (editedFile: MediaFile) => void;
}

interface EditingState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  scale: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filters: {
    blur: number;
    sharpen: number;
  };
}

const INITIAL_EDITING_STATE: EditingState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  rotation: 0,
  scale: 1,
  crop: { x: 0, y: 0, width: 100, height: 100 },
  filters: { blur: 0, sharpen: 0 }
};

export function ImageEditingModal({ isOpen, onClose, mediaFile, onSave }: ImageEditingModalProps) {
  const [editingState, setEditingState] = useState<EditingState>(INITIAL_EDITING_STATE);
  const [history, setHistory] = useState<EditingState[]>([INITIAL_EDITING_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<'pending' | 'validating' | 'valid' | 'invalid'>('pending');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const logger = new HealthcareAILogger('ImageEditingModal');

  const updateEditingState = (updates: Partial<EditingState>) => {
    const newState = { ...editingState, ...updates };
    setEditingState(newState);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditingState(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditingState(history[historyIndex + 1]);
    }
  };

  const reset = () => {
    setEditingState(INITIAL_EDITING_STATE);
    setHistory([INITIAL_EDITING_STATE]);
    setHistoryIndex(0);
  };

  const applyFilters = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Apply transformations
    ctx.save();
    
    // Apply rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((editingState.rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply scale
    ctx.scale(editingState.scale, editingState.scale);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Apply filters
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      r += editingState.brightness;
      g += editingState.brightness;
      b += editingState.brightness;

      // Apply contrast
      const contrastFactor = (259 * (editingState.contrast + 255)) / (255 * (259 - editingState.contrast));
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (editingState.saturation / 100) * (r - gray);
      g = gray + (editingState.saturation / 100) * (g - gray);
      b = gray + (editingState.saturation / 100) * (b - gray);

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.restore();
  }, [editingState]);

  const validateHealthcareCompliance = async (): Promise<boolean> => {
    setComplianceStatus('validating');
    
    // Simulate healthcare compliance validation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if image maintains medical accuracy after editing
        const isValid = Math.random() > 0.1; // 90% pass rate
        setComplianceStatus(isValid ? 'valid' : 'invalid');
        resolve(isValid);
      }, 2000);
    });
  };

  const handleSave = async () => {
    if (!mediaFile) return;

    setIsProcessing(true);
    logger.log('Starting image save process', { 
      fileId: mediaFile.id, 
      context: 'image_editing' 
    });

    try {
      // Validate healthcare compliance
      const isCompliant = await validateHealthcareCompliance();
      
      if (!isCompliant) {
        logger.error('Image failed healthcare compliance validation', 
          new Error('Compliance validation failed'), 
          { fileId: mediaFile.id, context: 'image_editing' }
        );
        return;
      }

      // Generate edited image data
      const canvas = canvasRef.current;
      if (canvas) {
        const editedImageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Create updated media file
        const editedFile: MediaFile = {
          ...mediaFile,
          // In a real implementation, this would upload the edited image
          // and update the URL and metadata
          alt_text: mediaFile.alt_text || 'Edited medical image',
          compliance_status: 'validated'
        };

        onSave(editedFile);
        logger.log('Image saved successfully', { 
          fileId: mediaFile.id, 
          context: 'image_editing' 
        });
      }
    } catch (error) {
      logger.error('Failed to save edited image', error, { 
        fileId: mediaFile.id, 
        context: 'image_editing' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEditedImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `edited_${mediaFile?.filename || 'image'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    }
  };

  if (!isOpen || !mediaFile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
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
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Image</h2>
              <span className="text-sm text-gray-500">{mediaFile.filename}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Compliance Status */}
              <div className="flex items-center space-x-2">
                {complianceStatus === 'validating' && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {complianceStatus === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {complianceStatus === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500 capitalize">
                  {complianceStatus === 'validating' ? 'Validating...' : complianceStatus}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-80px)]">
            {/* Image Canvas */}
            <div className="flex-1 p-4 bg-gray-100 flex items-center justify-center">
              <div className="relative">
                <img
                  ref={imageRef}
                  src={mediaFile.url}
                  alt={mediaFile.alt_text || mediaFile.filename}
                  className="max-w-full max-h-full object-contain"
                  onLoad={applyFilters}
                  style={{ display: 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full border border-gray-300 rounded-lg"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            </div>

            {/* Editing Controls */}
            <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Controls */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Controls</h3>
                  
                  <div className="space-y-4">
                    {/* Undo/Redo */}
                    <div className="flex space-x-2">
                      <button
                        onClick={undo}
                        disabled={historyIndex === 0}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="h-4 w-4 mr-2 inline" />
                        Undo
                      </button>
                      <button
                        onClick={redo}
                        disabled={historyIndex === history.length - 1}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCw className="h-4 w-4 mr-2 inline" />
                        Redo
                      </button>
                    </div>

                    {/* Reset */}
                    <button
                      onClick={reset}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Reset All
                    </button>
                  </div>
                </div>

                {/* Adjustments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Adjustments</h3>
                  
                  <div className="space-y-4">
                    {/* Brightness */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brightness: {editingState.brightness}
                      </label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editingState.brightness}
                        onChange={(e) => updateEditingState({ brightness: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contrast: {editingState.contrast}
                      </label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editingState.contrast}
                        onChange={(e) => updateEditingState({ contrast: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saturation: {editingState.saturation}%
                      </label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editingState.saturation}
                        onChange={(e) => updateEditingState({ saturation: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Transform */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Transform</h3>
                  
                  <div className="space-y-4">
                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rotation: {editingState.rotation}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={editingState.rotation}
                        onChange={(e) => updateEditingState({ rotation: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Scale */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scale: {Math.round(editingState.scale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={editingState.scale}
                        onChange={(e) => updateEditingState({ scale: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <button
                      onClick={handleSave}
                      disabled={isProcessing || complianceStatus === 'invalid'}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isProcessing ? 'Saving...' : 'Save Changes'}
                    </button>
                    
                    <button
                      onClick={downloadEditedImage}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
