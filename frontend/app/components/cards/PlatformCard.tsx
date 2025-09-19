"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { LucideIcon, CheckCircle } from 'lucide-react'
import { typography, spacing, animations } from '@/lib/constants/typography'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface PlatformFeature {
  title: string
}

interface PlatformStats {
  [key: string]: string
}

interface PlatformCardProps {
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  features: PlatformFeature[]
  stats?: PlatformStats
  href: string
  backgroundImage?: string
  ctaText?: string
}

export function PlatformCard({
  name,
  tagline,
  description,
  icon: Icon,
  features,
  stats,
  href,
  backgroundImage,
  ctaText = "Explore Platform"
}: PlatformCardProps) {
  return (
    <Card className={`group border border-gray-200 dark:border-gray-700 ${animations.cardHover} relative overflow-hidden h-full flex flex-col`}>
      {/* Optional Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/85 dark:from-gray-900/95 dark:to-gray-800/85"></div>
          <img 
            src={backgroundImage}
            alt={`${name} background`}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      )}
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center shadow-sm">
            <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          {tagline && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              {tagline}
            </span>
          )}
        </div>
        
        <CardTitle className={typography.cardTitle + " mb-3"}>
          {name}
        </CardTitle>
        <CardDescription className={typography.body}>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 flex flex-col flex-grow">
        <div className="flex-grow space-y-6">
          {/* Features List */}
          {features && features.length > 0 && (
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className={typography.small}>
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Stats Grid */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {Object.entries(stats).map(([key, value], index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* CTA Button - Always at bottom */}
        <div className="mt-6">
          <Link href={href} className="block">
            <LiquidGlassButton 
              variant="primary" 
              size="md"
              className="w-full"
            >
              {ctaText}
            </LiquidGlassButton>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}