'use client'

import React from 'react'

interface DiffViewerProps {
  oldContent: any
  newContent: any
  oldVersion: number
  newVersion: number
  oldAuthor: string
  newAuthor: string
  viewMode?: string
  className?: string
}

export function DiffViewer({ 
  oldContent, 
  newContent, 
  oldVersion, 
  newVersion, 
  oldAuthor, 
  newAuthor, 
  viewMode = "split",
  className 
}: DiffViewerProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Version {oldVersion}</span> by {oldAuthor}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Version {newVersion}</span> by {newAuthor}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Previous Version</h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
            {typeof oldContent === 'string' ? oldContent : JSON.stringify(oldContent, null, 2)}
          </pre>
        </div>
        <div className="border p-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Current Version</h4>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
            {typeof newContent === 'string' ? newContent : JSON.stringify(newContent, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}