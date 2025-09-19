'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Heart, Activity, Users, ArrowRight } from 'lucide-react'

export function InteractivePhoneShowcase() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      id: 0,
      title: 'Patient Monitoring',
      description: 'Real-time health tracking and monitoring through our integrated platform.',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      stats: '24/7 Monitoring'
    },
    {
      id: 1,
      title: 'Clinical Analytics',
      description: 'Advanced analytics and insights to improve patient outcomes and care quality.',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      stats: '95% Accuracy'
    },
    {
      id: 2,
      title: 'Team Collaboration',
      description: 'Seamless communication and collaboration between healthcare teams.',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      stats: '500+ Teams'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ONEHealth Ecosystem Platform
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Integrated digital health solutions connecting patients, providers, and researchers
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Phone Mockup */}
          <motion.div
            className="relative flex justify-center"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="w-80 h-[600px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-gray-50">
                    <span className="text-sm font-medium">9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">100%</span>
                  </div>

                  {/* App Content */}
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeFeature}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                      >
                        <div className={`w-16 h-16 ${features[activeFeature].bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                          {(() => {
                            const IconComponent = features[activeFeature].icon;
                            return <IconComponent className={`h-8 w-8 ${features[activeFeature].color}`} />;
                          })()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {features[activeFeature].title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {features[activeFeature].description}
                        </p>
                        <div className="text-2xl font-bold text-gray-900">
                          {features[activeFeature].stats}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* Feature List */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                  activeFeature === index 
                    ? 'bg-white shadow-lg border-2 border-blue-200' 
                    : 'bg-white/50 hover:bg-white hover:shadow-md'
                }`}
                onClick={() => setActiveFeature(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {(() => {
                      const IconComponent = feature.icon;
                      return <IconComponent className={`h-6 w-6 ${feature.color}`} />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                  {activeFeature === index && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            <motion.div
              className="pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Request Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
