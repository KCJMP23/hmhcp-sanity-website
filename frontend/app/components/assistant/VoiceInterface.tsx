/**
 * Voice Interface Component
 * Speech-to-text and text-to-speech for AI assistant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Languages,
  Zap
} from 'lucide-react';

interface VoiceInterfaceProps {
  onTranscript: (transcript: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  language?: string;
  enabled?: boolean;
}

interface VoiceState {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  language: string;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
}

export function VoiceInterface({
  onTranscript,
  isListening,
  onListeningChange,
  language = 'en-US',
  enabled = true
}: VoiceInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isSupported: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    language,
    voices: [],
    currentVoice: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize voice interface
  useEffect(() => {
    initializeVoiceInterface();
    return () => {
      cleanup();
    };
  }, []);

  // Update listening state
  useEffect(() => {
    onListeningChange(voiceState.isListening);
  }, [voiceState.isListening, onListeningChange]);

  const initializeVoiceInterface = async () => {
    try {
      // Check browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const SpeechSynthesis = window.speechSynthesis;
      
      if (!SpeechRecognition || !SpeechSynthesis) {
        setVoiceState(prev => ({
          ...prev,
          isSupported: false,
          error: 'Voice interface not supported in this browser'
        }));
        return;
      }

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: true,
          error: null
        }));
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setVoiceState(prev => ({
          ...prev,
          transcript: finalTranscript || interimTranscript,
          confidence: maxConfidence
        }));

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: `Recognition error: ${event.error}`
        }));
      };

      recognition.onend = () => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false
        }));
      };

      recognitionRef.current = recognition;

      // Initialize speech synthesis
      synthesisRef.current = SpeechSynthesis;

      // Load voices
      const loadVoices = () => {
        const voices = SpeechSynthesis.getVoices();
        const filteredVoices = voices.filter(voice => 
          voice.lang.startsWith(language.split('-')[0])
        );
        
        setVoiceState(prev => ({
          ...prev,
          voices: filteredVoices,
          currentVoice: filteredVoices[0] || null,
          isSupported: true
        }));
      };

      if (SpeechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        SpeechSynthesis.onvoiceschanged = loadVoices;
      }

    } catch (error) {
      console.error('Failed to initialize voice interface:', error);
      setVoiceState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Failed to initialize voice interface'
      }));
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || voiceState.isListening) return;

    try {
      setVoiceState(prev => ({
        ...prev,
        transcript: '',
        confidence: 0,
        error: null
      }));
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      setVoiceState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition'
      }));
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !voiceState.isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const speak = (text: string) => {
    if (!synthesisRef.current || voiceState.isSpeaking) return;

    try {
      // Stop any current speech
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voiceState.currentVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = language;

      utterance.onstart = () => {
        setVoiceState(prev => ({
          ...prev,
          isSpeaking: true,
          error: null
        }));
      };

      utterance.onend = () => {
        setVoiceState(prev => ({
          ...prev,
          isSpeaking: false
        }));
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setVoiceState(prev => ({
          ...prev,
          isSpeaking: false,
          error: `Synthesis error: ${event.error}`
        }));
      };

      utteranceRef.current = utterance;
      synthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('Failed to speak:', error);
      setVoiceState(prev => ({
        ...prev,
        error: 'Failed to generate speech'
      }));
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  const toggleListening = () => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  if (!enabled || !voiceState.isSupported) {
    return (
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="flex items-center space-x-2 text-gray-500">
          <MicOff className="h-4 w-4" />
          <span className="text-sm">
            {!voiceState.isSupported ? 'Voice not supported' : 'Voice disabled'}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              Voice Interface
            </span>
            <Badge variant="secondary" className="text-xs">
              {language}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            {voiceState.isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSpeaking}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <VolumeX className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-500"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            voiceState.isListening ? 'bg-green-500 animate-pulse' : 
            voiceState.isSpeaking ? 'bg-blue-500 animate-pulse' :
            'bg-gray-300'
          }`} />
          <span className="text-xs text-gray-600">
            {voiceState.isListening ? 'Listening...' :
             voiceState.isSpeaking ? 'Speaking...' :
             'Ready'}
          </span>
          {voiceState.confidence > 0 && (
            <Badge variant="outline" className="text-xs">
              {Math.round(voiceState.confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {/* Transcript */}
        {voiceState.transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-2 bg-white rounded border border-gray-200"
          >
            <div className="text-xs text-gray-600 mb-1">Transcript:</div>
            <div className="text-sm text-gray-900">{voiceState.transcript}</div>
          </motion.div>
        )}

        {/* Error */}
        {voiceState.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded text-red-700"
          >
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">{voiceState.error}</span>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleListening}
            disabled={voiceState.isSpeaking}
            className={`flex-1 ${
              voiceState.isListening 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {voiceState.isListening ? (
              <>
                <MicOff className="h-3 w-3 mr-1" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1" />
                Start Listening
              </>
            )}
          </Button>
          
          <Button
            onClick={() => speak('Hello, I am your AI assistant. How can I help you today?')}
            disabled={voiceState.isListening || voiceState.isSpeaking}
            variant="outline"
            size="sm"
          >
            <Volume2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Voice Settings */}
        {voiceState.voices.length > 0 && (
          <div className="text-xs text-gray-500">
            Voice: {voiceState.currentVoice?.name || 'Default'}
          </div>
        )}
      </div>
    </Card>
  );
}
