/**
 * Floating Assistant Panel Component
 * Microsoft Copilot-style floating AI assistant interface
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Mic, 
  MicOff, 
  Settings, 
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { ConversationInterface } from './ConversationInterface';
import { ContextAwareSuggestions } from './ContextAwareSuggestions';
import { VoiceInterface } from './VoiceInterface';
import { AssistantSettings } from './AssistantSettings';

interface FloatingAssistantPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: string;
  currentTask?: string;
  userRole?: string;
  medicalSpecialty?: string;
  complianceLevel?: string;
}

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    target: string;
    parameters: Record<string, any>;
  }>;
}

interface AssistantContext {
  currentPage: string;
  currentTask: string;
  userIntent: string;
  medicalContext: {
    specialty: string;
    complianceLevel: string;
    patientSafety: boolean;
  };
}

export function FloatingAssistantPanel({
  isOpen,
  onToggle,
  currentPage = '',
  currentTask = '',
  userRole = 'administrator',
  medicalSpecialty = 'general',
  complianceLevel = 'institutional'
}: FloatingAssistantPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<AssistantContext>({
    currentPage,
    currentTask,
    userIntent: '',
    medicalContext: {
      specialty: medicalSpecialty,
      complianceLevel,
      patientSafety: true
    }
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize assistant context
  useEffect(() => {
    updateContext();
  }, [currentPage, currentTask, medicalSpecialty, complianceLevel]);

  // Update context when props change
  const updateContext = async () => {
    try {
      const response = await fetch('/api/assistant/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPage,
          currentTask,
          medicalContext: {
            specialty: medicalSpecialty,
            complianceLevel,
            patientSafety: true
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionId(data.data.sessionId);
          setConversationId(data.data.conversationId);
          setContext(data.data.context);
        }
      }
    } catch (error) {
      console.error('Failed to update context:', error);
    }
  };

  // Send message to assistant
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: AssistantMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          sessionId,
          conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: AssistantMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
          suggestions: data.data.suggestions,
          actions: data.data.actions
        };

        setMessages(prev => [...prev, assistantMessage]);
        setSuggestions(data.data.suggestions || []);
        
        // Update context if provided
        if (data.data.contextUpdate) {
          setContext(prev => ({ ...prev, ...data.data.contextUpdate }));
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice input
  const handleVoiceInput = async (transcript: string) => {
    if (transcript.trim()) {
      await sendMessage(transcript);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion);
  };

  // Handle action execution
  const handleActionClick = async (action: any) => {
    // Implement action execution based on type
    console.log('Executing action:', action);
  };

  // Toggle voice interface
  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setSuggestions([]);
    setError(null);
  };

  // Get panel position based on screen size
  const getPanelPosition = () => {
    if (typeof window === 'undefined') return { bottom: '20px', right: '20px' };
    
    const isMobile = window.innerWidth < 768;
    return isMobile 
      ? { bottom: '10px', right: '10px', left: '10px' }
      : { bottom: '20px', right: '20px' };
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onToggle}
          size="lg"
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50"
        style={getPanelPosition()}
      >
        <Card className={`bg-white shadow-2xl border-0 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} transition-all duration-300`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-500">
                  {userRole} • {medicalSpecialty} • {complianceLevel}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className={isVoiceEnabled ? 'text-blue-600' : 'text-gray-400'}
              >
                {isVoiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Status Bar */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Active</span>
                    </div>
                    {currentPage && (
                      <Badge variant="secondary" className="text-xs">
                        {currentPage}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col h-[500px]">
                {/* Conversation */}
                <div className="flex-1 overflow-y-auto p-4">
                  <ConversationInterface
                    messages={messages}
                    isLoading={isLoading}
                    error={error}
                    onSuggestionClick={handleSuggestionClick}
                    onActionClick={handleActionClick}
                  />
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <ContextAwareSuggestions
                      suggestions={suggestions}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  </div>
                )}

                {/* Voice Interface */}
                {isVoiceEnabled && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <VoiceInterface
                      onTranscript={handleVoiceInput}
                      isListening={isListening}
                      onListeningChange={setIsListening}
                    />
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      placeholder="Ask me anything..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => {
                        if (inputRef.current) {
                          sendMessage(inputRef.current.value);
                          inputRef.current.value = '';
                        }
                      }}
                      disabled={isLoading}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Settings Modal */}
        <AssistantSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userRole={userRole}
          medicalSpecialty={medicalSpecialty}
          complianceLevel={complianceLevel}
          onSettingsChange={(newSettings) => {
            // Update settings
            console.log('Settings changed:', newSettings);
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
