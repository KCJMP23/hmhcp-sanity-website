"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { typography, spacing, animations, colors } from '@/lib/constants/typography'

interface ServiceCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  backgroundImage: string
  ctaText?: string
  features?: string[]
  overlayGradient?: string
}

export function ServiceCard({
  title,
  description,
  href,
  icon: Icon,
  backgroundImage,
  ctaText = "Learn More",
  features,
  overlayGradient = "from-blue-900/60 via-blue-800/50 to-indigo-900/65"
}: ServiceCardProps) {
  return (
    <Card className={`group border border-gray-200 dark:border-gray-700 ${animations.cardHover} relative overflow-hidden h-full flex flex-col`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${overlayGradient}`}></div>
        <img 
          src={backgroundImage}
          alt={`${title} background`}
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      
      <CardHeader className="text-center relative z-10 flex-shrink-0">
        {/* Glass Icon Container - matches homepage pattern */}
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/30" 
             style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="font-display text-xl font-medium text-white mb-2">
          {title}
        </CardTitle>
        <CardDescription className="font-text text-white/90 text-sm leading-relaxed min-h-[3rem]">
          {description}
        </CardDescription>
      </CardHeader>
      
      <div className="flex-grow relative z-10">
        {features && features.length > 0 && (
          <div className="px-6 pb-2">
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="text-xs text-white/80 flex items-start">
                  <span className="block w-1.5 h-1.5 bg-white/60 rounded-full mt-1 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <CardContent className="pt-4 pb-6 relative z-10 mt-auto">
        <Link href={href} className="block">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-full transition-colors duration-200">
            {ctaText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}