"use client"

import React from 'react'
import Image from 'next/image'
import { FrostedGlassCard } from '@/components/frosted-glass-card-simple'
import { typography } from '@/lib/constants/typography'
import { FadeIn } from '@/components/animations-simple'

interface TeamMemberCardProps {
  name: string
  role: string
  description: string
  image?: string
  delay?: number
}

export function TeamMemberCard({
  name,
  role,
  description,
  image,
  delay = 0
}: TeamMemberCardProps) {
  return (
    <FadeIn delay={delay}>
      <FrostedGlassCard hoverEffect className="p-8 text-center h-full flex flex-col">
        {/* Member Image */}
        {image && (
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20">
            <Image
              src={image}
              alt={name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-full flex items-center justify-center text-3xl font-light text-blue-600 dark:text-blue-400';
                  placeholder.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase();
                  target.parentElement.appendChild(placeholder);
                }
              }}
            />
          </div>
        )}
        
        {/* If no image, show initials */}
        {!image && (
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
            <span className="text-2xl font-light text-blue-600 dark:text-blue-400">
              {name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Member Info */}
        <h3 className={typography.cardTitle + " mb-2"}>
          {name}
        </h3>
        <p className="font-text text-base text-blue-600 dark:text-blue-400 mb-4">
          {role}
        </p>
        <p className={typography.body}>
          {description}
        </p>
      </FrostedGlassCard>
    </FadeIn>
  )
}