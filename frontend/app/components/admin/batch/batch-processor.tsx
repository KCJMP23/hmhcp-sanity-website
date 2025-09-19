'use client'

import { useState } from 'react'
import { Check as CheckIcon, X as XMarkIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'

interface BatchAction {
  id: string
  label: string
  description: string
  icon?: React.ReactNode
  action: (selectedIds: string[]) => Promise<{ success: boolean; message: string }>
  confirmation?: string
  destructive?: boolean
}

interface BatchProcessorProps {
  selectedItems: string[]
  availableActions: BatchAction[]
  onSelectionChange: (selectedIds: string[]) => void
  onActionComplete: () => void
  title?: string
  maxSelection?: number
}

export default function BatchProcessor({
  selectedItems,
  availableActions,
  onSelectionChange,
  onActionComplete,
  title = 'Batch Actions',
  maxSelection = 100
}: BatchProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<BatchAction | null>(null)
  const [results, setResults] = useState<{ success: boolean; message: string }[]>([])

  const selectedCount = selectedItems.length
  const hasSelection = selectedCount > 0
  const isMaxReached = selectedCount >= maxSelection

  const handleSelectAll = () => {
    // This would select all available items in the current view
    // For now, we'll just show a message
    alert('Select all functionality would be implemented here')
  }

  const handleClearSelection = () => {
    onSelectionChange([])
    setResults([])
  }

  const handleBatchAction = async (action: BatchAction) => {
    if (action.confirmation) {
      setShowConfirmation(action)
      return
    }

    await executeAction(action)
  }

  const executeAction = async (action: BatchAction) => {
    setIsProcessing(true)
    setCurrentAction(action.id)
    setResults([])

    try {
      const result = await action.action(selectedItems)
      setResults([result])
      
      if (result.success) {
        onActionComplete()
        // Clear selection after successful action
        onSelectionChange([])
      }
    } catch (error) {
      setResults([{
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }])
    } finally {
      setIsProcessing(false)
      setCurrentAction(null)
    }
  }

  const confirmAction = async () => {
    if (showConfirmation) {
      setShowConfirmation(null)
      await executeAction(showConfirmation)
    }
  }

  const cancelAction = () => {
    setShowConfirmation(null)
  }

  return (
    <>
      {/* Batch Actions Bar */}
      {hasSelection && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Selection Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-gray-900" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <button
                  onClick={handleClearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear selection
                </button>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center space-x-3">
                {availableActions.map(action => (
                  <LiquidGlassButton
                    key={action.id}
                    onClick={() => handleBatchAction(action)}
                    disabled={isProcessing}
                    variant={action.destructive ? "primary" : "primary"}
                    size="md"
                    className={action.destructive ? "!bg-red-600 hover:!bg-red-700" : ""}
                  >
                    {action.icon}
                    <span className="ml-2">
                      {isProcessing && currentAction === action.id ? 'Processing...' : action.label}
                    </span>
                  </LiquidGlassButton>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            disabled={isMaxReached}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select all
          </button>
          
          {hasSelection && (
            <button
              onClick={handleClearSelection}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          )}
        </div>

        {hasSelection && (
          <div className="text-sm text-gray-500">
            {selectedCount} of {maxSelection} items selected
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.success ? 'Action completed successfully' : 'Action failed'}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setResults(results.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm {showConfirmation.label}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {showConfirmation.confirmation}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This action will affect {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${
                  showConfirmation.destructive
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-500'
                }`}
              >
                {showConfirmation.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
