'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie, Shield, BarChart, Settings } from 'lucide-react'
import { 
  getCookieConsent, 
  setCookieConsent, 
  updateCategoryConsent
} from '@/lib/analytics/cookies'
import { analyticsConfig, CookieConsent, ConsentCategory } from '@/lib/analytics/config'

interface CookieSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CategoryInfo {
  key: ConsentCategory
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  required: boolean
  examples: string[]
}

const cookieCategories: CategoryInfo[] = [
  {
    key: 'necessary',
    title: 'Necessary Cookies',
    description: 'Essential for the website to function properly. These cannot be disabled.',
    icon: Shield,
    required: true,
    examples: [
      'Session management',
      'Security tokens',
      'User authentication',
      'Load balancing'
    ]
  },
  {
    key: 'analytics',
    title: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our website.',
    icon: BarChart,
    required: false,
    examples: [
      'Google Analytics',
      'Page view tracking',
      'User behavior analysis',
      'Performance monitoring'
    ]
  },
  {
    key: 'marketing',
    title: 'Marketing Cookies',
    description: 'Used to track visitors and show personalized advertisements.',
    icon: Cookie,
    required: false,
    examples: [
      'Social media tracking',
      'Advertising targeting',
      'Cross-site tracking',
      'Conversion tracking'
    ]
  }
]

export function CookieSettingsModal({ isOpen, onClose }: CookieSettingsModalProps) {
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Load current consent on mount
  useEffect(() => {
    if (isOpen) {
      const currentConsent = getCookieConsent()
      setConsent(currentConsent)
      setHasChanges(false)
    }
  }, [isOpen])

  const handleCategoryToggle = (category: ConsentCategory, value: boolean) => {
    if (category === 'necessary') return // Cannot disable necessary cookies
    
    const newConsent = {
      ...consent,
      [category]: value
    }
    setConsent(newConsent)
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    setCookieConsent(consent)
    setHasChanges(false)
    onClose()
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    setCookieConsent(allAccepted)
    setConsent(allAccepted)
    setHasChanges(false)
    onClose()
  }

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    setCookieConsent(onlyNecessary)
    setConsent(onlyNecessary)
    setHasChanges(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cookie Settings
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We use cookies to enhance your experience, analyze traffic, and personalize content. 
                You can choose which types of cookies to allow below.
              </p>

              <div className="space-y-6">
                {cookieCategories.map((category) => {
                  const Icon = category.icon
                  const isEnabled = consent[category.key]
                  
                  return (
                    <div key={category.key} className="border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start">
                          <Icon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {category.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center ml-4">
                          {category.required ? (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Required
                            </span>
                          ) : (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handleCategoryToggle(category.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after: after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          )}
                        </div>
                      </div>
                      
                      <div className="pl-8">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Examples:
                        </h4>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {category.examples.map((example, index) => (
                            <li key={index}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={!hasChanges}
                  className={`px-4 py-2  transition-colors ${
                    hasChanges
                      ? 'bg-green-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  Save Settings
                </button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Your preferences will be saved for {analyticsConfig.cookieConsent.cookieExpiry} days.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}