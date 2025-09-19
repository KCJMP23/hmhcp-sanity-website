/**
 * Conversation Interface Component
 * Natural language chat interface for AI assistant
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bot, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

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

interface ConversationInterfaceProps {
  messages: AssistantMessage[];
  isLoading: boolean;
  error: string | null;
  onSuggestionClick: (suggestion: string) => void;
  onActionClick: (action: any) => void;
}

export function ConversationInterface({
  messages,
  isLoading,
  error,
  onSuggestionClick,
  onActionClick
}: ConversationInterfaceProps) {
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: AssistantMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          
          {/* Message Content */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <Card className={`p-3 ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-50 text-gray-900'
            }`}>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap m-0">{message.content}</p>
              </div>
            </Card>
            
            {/* Timestamp */}
            <span className="text-xs text-gray-500 mt-1">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {/* Actions */}
            {message.actions && message.actions.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.actions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    variant="outline"
                    size="sm"
                    onClick={() => onActionClick(action)}
                    className="text-xs"
                  >
                    {action.type === 'navigate' && <ArrowRight className="h-3 w-3 mr-1" />}
                    {action.type === 'create' && <Sparkles className="h-3 w-3 mr-1" />}
                    {action.type === 'analyze' && <ExternalLink className="h-3 w-3 mr-1" />}
                    {action.type.charAt(0).toUpperCase() + action.type.slice(1)} {action.target}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSuggestions = (suggestions: string[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
    >
      <div className="flex items-center space-x-2 mb-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI Assistant
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              I'm here to help you with your healthcare workflow. Ask me anything about content creation, 
              compliance, analytics, or any other platform features.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                {renderMessage(message, index)}
                {message.suggestions && message.suggestions.length > 0 && 
                 message.role === 'assistant' && 
                 renderSuggestions(message.suggestions)}
              </div>
            ))}
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </motion.div>
        )}
        
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
