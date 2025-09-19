'use client'

import { useState, ReactNode } from 'react'
import { Check as CheckIcon, ChevronRight as ChevronRightIcon } from 'lucide-react'

interface Step {
  id: string
  title: string
  description: string
  component: ReactNode
  validation?: () => boolean
}

interface MultiStepFormProps {
  steps: Step[]
  onComplete: (data: any) => void
  onCancel: () => void
  title?: string
  showProgress?: boolean
}

export default function MultiStepForm({ 
  steps, 
  onComplete, 
  onCancel, 
  title = 'Multi-Step Form',
  showProgress = true 
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]

  const updateFormData = (data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const validateCurrentStep = () => {
    if (currentStepData.validation) {
      return currentStepData.validation()
    }
    return true
  }

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      
      if (isLastStep) {
        onComplete(formData)
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) {
      return 'completed'
    } else if (stepIndex === currentStep) {
      return 'current'
    } else {
      return 'upcoming'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="px-6 py-4 border-b border-gray-200">
            <nav aria-label="Progress">
              <ol className="flex items-center space-x-4">
                {steps.map((step, stepIndex) => {
                  const status = getStepStatus(stepIndex)
                  
                  return (
                    <li key={step.id} className="flex items-center">
                      <button
                        onClick={() => goToStep(stepIndex)}
                        disabled={status === 'upcoming'}
                        className={`flex items-center space-x-2 ${
                          status === 'upcoming' ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          status === 'completed'
                            ? 'bg-gray-900 border-gray-900'
                            : status === 'current'
                            ? 'border-gray-900 bg-white'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {status === 'completed' ? (
                            <CheckIcon className="w-5 h-5 text-white" />
                          ) : (
                            <span className={`text-sm font-medium ${
                              status === 'current' ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {stepIndex + 1}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-left">
                          <p className={`text-sm font-medium ${
                            status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                      </button>
                      
                      {stepIndex < steps.length - 1 && (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Step {currentStep + 1} of {steps.length}: {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-600">{currentStepData.description}</p>
          </div>
          
          <div className="min-h-[300px]">
            {currentStepData.component}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            {!isFirstStep && (
              <button
                onClick={goToPreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={goToNextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800"
            >
              {isLastStep ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
