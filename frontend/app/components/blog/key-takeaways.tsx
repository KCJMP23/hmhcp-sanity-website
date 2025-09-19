'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, CheckCircle } from 'lucide-react'

interface KeyTakeawaysProps {
  takeaways: string[]
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Key Takeaways</h3>
        </div>
        
        <ul className="space-y-3">
          {takeaways.map((takeaway, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{takeaway}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}