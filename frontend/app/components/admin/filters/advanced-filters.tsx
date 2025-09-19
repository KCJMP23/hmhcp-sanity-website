'use client'

import { useState } from 'react'
import { Filter as FunnelIcon, X as XMarkIcon, Search as MagnifyingGlassIcon } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'range' | 'search'
  options?: FilterOption[]
  placeholder?: string
  value: any
}

interface AdvancedFiltersProps {
  filters: FilterGroup[]
  onFiltersChange: (filters: FilterGroup[]) => void
  onReset: () => void
  showSearch?: boolean
  searchPlaceholder?: string
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  showSearch = true,
  searchPlaceholder = 'Search...'
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterGroup[]>(filters)
  const [searchTerm, setSearchTerm] = useState('')

  const handleFilterChange = (filterId: string, value: any) => {
    const updatedFilters = localFilters.map(filter =>
      filter.id === filterId ? { ...filter, value } : filter
    )
    setLocalFilters(updatedFilters)
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters = localFilters.map(filter => ({
      ...filter,
      value: filter.type === 'multiselect' ? [] : filter.type === 'range' ? { min: '', max: '' } : ''
    }))
    setLocalFilters(resetFilters)
    onReset()
    setIsOpen(false)
  }

  const getActiveFiltersCount = () => {
    return localFilters.filter(filter => {
      if (filter.type === 'multiselect') {
        return Array.isArray(filter.value) && filter.value.length > 0
      } else if (filter.type === 'range') {
        return filter.value.min || filter.value.max
      } else {
        return filter.value && filter.value !== ''
      }
    }).length
  }

  const renderFilterInput = (filter: FilterGroup) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="">{filter.placeholder || 'Select...'}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(filter.value) && filter.value.includes(option.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(filter.value) ? filter.value : []
                    const newValue = e.target.checked
                      ? [...currentValue, option.value]
                      : currentValue.filter(v => v !== option.value)
                    handleFilterChange(filter.id, newValue)
                  }}
                  className="mr-2 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">
                  {option.label} {option.count ? `(${option.count})` : ''}
                </span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={filter.value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        )

      case 'range':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filter.value?.min || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...filter.value, min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filter.value?.max || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...filter.value, max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        )

      case 'search':
        return (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={filter.placeholder || 'Search...'}
              value={filter.value || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        )

      default:
        return null
    }
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
          activeFiltersCount > 0
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="-ml-1 mr-2 h-4 w-4" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-900">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            {showSearch && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {localFilters.map(filter => (
                <div key={filter.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset All
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
