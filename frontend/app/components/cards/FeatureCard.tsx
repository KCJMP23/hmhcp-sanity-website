"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { typography, animations } from '@/lib/constants/typography'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  variant?: 'default' | 'gradient' | 'glass'
  delay?: number
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  variant = 'default',
  delay = 0
}: FeatureCardProps) {
  const cardClass = variant === 'glass' 
    ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
    : "bg-white dark:bg-gray-800";
    
  return (
    <Card 
      className={`${cardClass} border border-gray-200 dark:border-gray-700 ${animations.cardHover} h-full flex flex-col`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex-shrink-0">
        {/* Icon Container - matches homepage pattern */}
        <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl mb-6 flex items-center justify-center shadow-sm">
          <div className="text-blue-600 dark:text-blue-400">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <CardTitle className={typography.cardTitle + " tracking-tight"}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className={typography.body + " leading-relaxed"}>
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}