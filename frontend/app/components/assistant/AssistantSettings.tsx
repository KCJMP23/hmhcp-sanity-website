/**
 * Assistant Settings Component
 * Personalization and preference management for AI assistant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Save, 
  RotateCcw, 
  User, 
  Shield, 
  Volume2, 
  Eye, 
  Keyboard,
  Globe,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AssistantSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  medicalSpecialty: string;
  complianceLevel: string;
  onSettingsChange: (settings: any) => void;
}

interface AssistantSettingsData {
  healthcareRole: string;
  medicalSpecialty: string;
  complianceLevel: string;
  language: string;
  timezone: string;
  accessibility: {
    voiceEnabled: boolean;
    screenReaderSupport: boolean;
    keyboardNavigation: boolean;
    highContrast: boolean;
  };
  voice: {
    enabled: boolean;
    language: string;
    rate: number;
    pitch: number;
    volume: number;
  };
  ui: {
    theme: string;
    fontSize: string;
    compactMode: boolean;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

const healthcareRoles = [
  { value: 'physician', label: 'Physician', description: 'Clinical decision support and medical expertise' },
  { value: 'nurse', label: 'Nurse', description: 'Patient care protocols and nursing workflows' },
  { value: 'administrator', label: 'Administrator', description: 'Compliance reporting and management' },
  { value: 'researcher', label: 'Researcher', description: 'Literature reviews and data analysis' }
];

const medicalSpecialties = [
  { value: 'general', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'pharmacy', label: 'Pharmacy' }
];

const complianceLevels = [
  { value: 'institutional', label: 'Institutional', description: 'Basic institutional policies' },
  { value: 'fda', label: 'FDA', description: 'FDA advertising and labeling requirements' },
  { value: 'hipaa', label: 'HIPAA', description: 'Healthcare privacy and security standards' }
];

const languages = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' }
];

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }
];

export function AssistantSettings({
  isOpen,
  onClose,
  userRole,
  medicalSpecialty,
  complianceLevel,
  onSettingsChange
}: AssistantSettingsProps) {
  const [settings, setSettings] = useState<AssistantSettingsData>({
    healthcareRole: userRole,
    medicalSpecialty: medicalSpecialty,
    complianceLevel: complianceLevel,
    language: 'en-US',
    timezone: 'UTC',
    accessibility: {
      voiceEnabled: true,
      screenReaderSupport: true,
      keyboardNavigation: true,
      highContrast: false
    },
    voice: {
      enabled: true,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    ui: {
      theme: 'light',
      fontSize: 'medium',
      compactMode: false
    },
    notifications: {
      enabled: true,
      sound: true,
      desktop: false
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Mark as dirty when settings change
  useEffect(() => {
    setIsDirty(true);
  }, [settings]);

  const loadSettings = async () => {
    try {
      // In a real implementation, this would load from the API
      // For now, we'll use the passed props
      setSettings(prev => ({
        ...prev,
        healthcareRole: userRole,
        medicalSpecialty: medicalSpecialty,
        complianceLevel: complianceLevel
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // In a real implementation, this would save to the API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSaveStatus('saved');
      setIsDirty(false);
      onSettingsChange(settings);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      healthcareRole: userRole,
      medicalSpecialty: medicalSpecialty,
      complianceLevel: complianceLevel,
      language: 'en-US',
      timezone: 'UTC',
      accessibility: {
        voiceEnabled: true,
        screenReaderSupport: true,
        keyboardNavigation: true,
        highContrast: false
      },
      voice: {
        enabled: true,
        language: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      },
      ui: {
        theme: 'light',
        fontSize: 'medium',
        compactMode: false
      },
      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      }
    });
    setIsDirty(false);
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as any;
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assistant Settings</h2>
                <p className="text-sm text-gray-500">Customize your AI assistant experience</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Healthcare Role & Specialty */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Healthcare Profile</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="healthcare-role">Healthcare Role</Label>
                    <Select
                      value={settings.healthcareRole}
                      onValueChange={(value) => updateSetting('healthcareRole', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {healthcareRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="medical-specialty">Medical Specialty</Label>
                    <Select
                      value={settings.medicalSpecialty}
                      onValueChange={(value) => updateSetting('medicalSpecialty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {medicalSpecialties.map((specialty) => (
                          <SelectItem key={specialty.value} value={specialty.value}>
                            {specialty.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="compliance-level">Compliance Level</Label>
                  <Select
                    value={settings.complianceLevel}
                    onValueChange={(value) => updateSetting('complianceLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {complianceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Accessibility Settings */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Accessibility</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-enabled">Voice Interface</Label>
                      <p className="text-xs text-gray-500">Enable voice input and output</p>
                    </div>
                    <Switch
                      checked={settings.accessibility.voiceEnabled}
                      onCheckedChange={(checked) => updateSetting('accessibility.voiceEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="screen-reader">Screen Reader Support</Label>
                      <p className="text-xs text-gray-500">Optimize for screen readers</p>
                    </div>
                    <Switch
                      checked={settings.accessibility.screenReaderSupport}
                      onCheckedChange={(checked) => updateSetting('accessibility.screenReaderSupport', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
                      <p className="text-xs text-gray-500">Full keyboard accessibility</p>
                    </div>
                    <Switch
                      checked={settings.accessibility.keyboardNavigation}
                      onCheckedChange={(checked) => updateSetting('accessibility.keyboardNavigation', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-xs text-gray-500">Enhanced visual contrast</p>
                    </div>
                    <Switch
                      checked={settings.accessibility.highContrast}
                      onCheckedChange={(checked) => updateSetting('accessibility.highContrast', checked)}
                    />
                  </div>
                </div>
              </Card>

              {/* Voice Settings */}
              {settings.accessibility.voiceEnabled && (
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Voice Settings</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="voice-language">Voice Language</Label>
                      <Select
                        value={settings.voice.language}
                        onValueChange={(value) => updateSetting('voice.language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="voice-rate">Speech Rate</Label>
                      <Input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.voice.rate}
                        onChange={(e) => updateSetting('voice.rate', parseFloat(e.target.value))}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {settings.voice.rate}x speed
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Language & Timezone */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Language & Region</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Interface Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => updateSetting('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Settings saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Failed to save</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={resetSettings}
                disabled={isLoading || !isDirty}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isLoading || !isDirty}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
