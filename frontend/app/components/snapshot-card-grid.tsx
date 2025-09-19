'use client'

import type { PlatformCapability } from '@/lib/supabase-content'
import { Building2 } from 'lucide-react'

interface SnapshotCardGridProps {
  title: string
  subtitle: string
  capabilities?: PlatformCapability[]
}

export function SnapshotCardGrid({ title, subtitle, capabilities = [] }: SnapshotCardGridProps) {
  const loading = capabilities.length === 0

  return (
    <section className="section-padding bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </>
          ) : (
            capabilities.slice(0, 6).map((capability, index) => (
              <div key={capability.id || index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">
                    {capability.icon || <Building2 className="w-6 h-6" />}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {capability.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {capability.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
