'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Languages, 
  Upload, 
  Download, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Users
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

export default function LanguagesDashboard() {
  const { localization, analytics, systemMonitoring } = useCoreIntegration();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Mock data for demonstration
  const [languages] = useState([
    {
      code: 'en',
      name: 'English',
      native_name: 'English',
      is_default: true,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 100,
      content_count: 1247,
      user_count: 342
    },
    {
      code: 'es',
      name: 'Spanish',
      native_name: 'Español',
      is_default: false,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 85,
      content_count: 1059,
      user_count: 156
    },
    {
      code: 'fr',
      name: 'French',
      native_name: 'Français',
      is_default: false,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 78,
      content_count: 972,
      user_count: 89
    },
    {
      code: 'de',
      name: 'German',
      native_name: 'Deutsch',
      is_default: false,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 72,
      content_count: 897,
      user_count: 67
    },
    {
      code: 'zh',
      name: 'Chinese',
      native_name: '中文',
      is_default: false,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 65,
      content_count: 810,
      user_count: 45
    },
    {
      code: 'ar',
      name: 'Arabic',
      native_name: 'العربية',
      is_default: false,
      is_active: true,
      direction: 'rtl',
      translation_coverage: 58,
      content_count: 723,
      user_count: 34
    },
    {
      code: 'ja',
      name: 'Japanese',
      native_name: '日本語',
      is_default: false,
      is_active: true,
      direction: 'ltr',
      translation_coverage: 52,
      content_count: 648,
      user_count: 28
    },
    {
      code: 'pt',
      name: 'Portuguese',
      native_name: 'Português',
      is_default: false,
      is_active: false,
      direction: 'ltr',
      translation_coverage: 45,
      content_count: 560,
      user_count: 23
    }
  ]);

  const [translationStats] = useState({
    totalLanguages: 8,
    activeLanguages: 7,
    totalTranslations: 15678,
    pendingTranslations: 234,
    translationQuality: 94.2,
    thisMonth: 89,
    lastMonth: 76
  });

  const [recentTranslations] = useState([
    { id: 1, key: 'welcome_message', language: 'Spanish', status: 'completed', translator: 'AI System', time: '2 minutes ago', quality: 4.8 },
    { id: 2, key: 'healthcare_tips', language: 'French', status: 'completed', translator: 'AI System', time: '5 minutes ago', quality: 4.6 },
    { id: 3, key: 'patient_guidelines', language: 'German', status: 'completed', translator: 'AI System', time: '8 minutes ago', quality: 4.7 },
    { id: 4, key: 'medical_news', language: 'Chinese', status: 'processing', translator: 'AI System', time: '1 minute ago', quality: 0 }
  ]);

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/admin/languages');
    analytics.trackEvent('languages_dashboard_viewed', { section: 'multi_language' });
  }, [analytics]);

  const handleTranslateContent = async (languageCode: string) => {
    setIsTranslating(true);
    setSelectedLanguage(languageCode);
    
    // Simulate translation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsTranslating(false);
    
    // Log translation
    await systemMonitoring.logMetric('content_translated', 1, 'admin');
  };

  const handleAddLanguage = () => {
    // Implementation for adding new language
    console.log('Adding new language');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <Typography variant="display" className="text-gray-900">Multi-language Support</Typography>
          <Typography variant="body" className="text-gray-600">
            Manage content localization, translations, and language preferences for global accessibility
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline" onClick={handleAddLanguage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </AppleButton>
          <AppleButton>
            <Languages className="h-4 w-4 mr-2" />
            Bulk Translate
          </AppleButton>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Globe className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {translationStats.totalLanguages}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Languages</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              {translationStats.activeLanguages} active
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Languages className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {translationStats.totalTranslations.toLocaleString()}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Translations</Typography>
            <Progress value={80} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              +{translationStats.thisMonth} this month
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {translationStats.translationQuality}%
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Translation Quality</Typography>
            <Progress value={translationStats.translationQuality} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              High accuracy rate
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {translationStats.pendingTranslations}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Pending Translations</Typography>
            <Progress value={25} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Requires attention
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Language Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Language Management
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language) => (
            <motion.div
              key={language.code}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <FrostedCard className="hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Globe className="h-6 w-6 text-blue-600" />
                        <Typography variant="heading4" className="text-gray-900">
                          {language.native_name}
                        </Typography>
                        {language.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <Typography variant="body" className="text-gray-600 mb-4">
                        {language.name} • {language.direction.toUpperCase()}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Translation Coverage</span>
                        <span>{language.translation_coverage}%</span>
                      </div>
                      <Progress value={language.translation_coverage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <Typography variant="display" className="text-lg font-light text-blue-600">
                          {language.content_count}
                        </Typography>
                        <Typography variant="small" className="text-blue-600">Content</Typography>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <Typography variant="display" className="text-lg font-light text-green-600">
                          {language.user_count}
                        </Typography>
                        <Typography variant="small" className="text-green-600">Users</Typography>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <AppleButton 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleTranslateContent(language.code)}
                      disabled={isTranslating}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      Translate
                    </AppleButton>
                    <AppleButton variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </AppleButton>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={language.is_active ? 'default' : 'secondary'}>
                      {language.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit className="h-3 w-3 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </FrostedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Translation Progress */}
      {isTranslating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FrostedCard className="border-blue-200 bg-blue-50/50">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Languages className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <Typography variant="heading4" className="text-gray-900">
                    Translating Content...
                  </Typography>
                  <Typography variant="small" className="text-gray-600">
                    AI is translating content to {languages.find(l => l.code === selectedLanguage)?.native_name}. 
                    This may take a few moments.
                  </Typography>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>Processing...</span>
                </div>
                <Progress value={100} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Language: {languages.find(l => l.code === selectedLanguage)?.native_name}</span>
                  <span>Estimated time: 1-2 minutes</span>
                </div>
              </div>
            </div>
          </FrostedCard>
        </motion.div>
      )}

      {/* Recent Translations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Recent Translations
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {recentTranslations.map((translation) => (
                <div key={translation.id} className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(translation.status)}
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {translation.key.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {translation.language} • {translation.translator} • {translation.time}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Typography variant="small" className="text-gray-600">
                          Quality: {translation.quality > 0 ? translation.quality.toFixed(1) : 'N/A'}
                        </Typography>
                      </div>
                    </div>
                    <Badge className={getStatusColor(translation.status)}>
                      {translation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Translation Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Translation Tools
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Import Translations
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Upload CSV or JSON files with translation keys and values
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Download className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Export Translations
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Download translations in various formats for external editing
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Settings className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Translation Settings
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Configure AI translation models and quality thresholds
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}

