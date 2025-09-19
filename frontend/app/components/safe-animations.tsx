"use client"

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Create safe dynamic imports for animation components
export const SafeFadeIn = dynamic(
  () => import('./animations').then(mod => ({ default: mod.FadeIn })),
  {
    ssr: true,
    loading: () => <div className="opacity-0">Loading...</div>
  }
)

export const SafeStaggerContainer = dynamic(
  () => import('./animations').then(mod => ({ default: mod.StaggerContainer })),
  {
    ssr: true,
    loading: () => <div>Loading...</div>
  }
)

export const SafeStaggerItem = dynamic(
  () => import('./animations').then(mod => ({ default: mod.StaggerItem })),
  {
    ssr: true,
    loading: () => <div>Loading...</div>
  }
)

export const SafeParallax = dynamic(
  () => import('./animations').then(mod => ({ default: mod.Parallax })),
  {
    ssr: true,
    loading: () => <div>Loading...</div>
  }
)

// Export with original names for easy replacement
export { SafeFadeIn as FadeIn, SafeStaggerContainer as StaggerContainer, SafeStaggerItem as StaggerItem, SafeParallax as Parallax }