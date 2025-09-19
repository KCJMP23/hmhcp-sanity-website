'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ServiceCardProps {
  title: string
  description: string
  icon: string
  href: string
  className?: string
}

export function ServiceCard({
  title,
  description,
  icon,
  href,
  className = ''
}: ServiceCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group ${className}`}>
      <div className="text-4xl mb-4">{icon}</div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 leading-relaxed">
        {description}
      </p>
      
      <Link 
        href={href}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group-hover:translate-x-1 transition-transform"
      >
        Learn more
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  )
}
