'use client'

import { Building2, Cross, Microscope, Pill } from 'lucide-react'

export function TrustBar() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Trusted by healthcare professionals worldwide
          </p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            {/* Placeholder trust indicators */}
            <div className="text-gray-400 dark:text-gray-500"><Building2 className="w-8 h-8" /></div>
            <div className="text-gray-400 dark:text-gray-500"><Cross className="w-8 h-8" /></div>
            <div className="text-gray-400 dark:text-gray-500"><Microscope className="w-8 h-8" /></div>
            <div className="text-gray-400 dark:text-gray-500"><Pill className="w-8 h-8" /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
