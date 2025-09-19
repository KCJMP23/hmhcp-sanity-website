/**
 * Admin Table Hook
 * Manages table state, sorting, filtering, and pagination
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDebounce } from '../utils'

interface UseAdminTableOptions<T> {
  data: T[]
  pageSize?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  searchableFields?: string[]
  onPageChange?: (page: number) => void
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, any>) => void
}

interface UseAdminTableReturn<T> {
  // Data
  displayData: T[]
  totalRows: number
  totalPages: number
  
  // Pagination
  currentPage: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void
  canNextPage: boolean
  canPreviousPage: boolean
  
  // Sorting
  sortField: string | null
  sortDirection: 'asc' | 'desc'
  handleSort: (field: string) => void
  clearSort: () => void
  
  // Filtering
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: Record<string, any>
  setFilter: (field: string, value: any) => void
  clearFilters: () => void
  
  // Selection
  selectedRows: Set<string | number>
  isAllSelected: boolean
  toggleRowSelection: (id: string | number) => void
  toggleAllSelection: () => void
  clearSelection: () => void
}

/**
 * Hook for managing admin table state
 */
export function useAdminTable<T extends Record<string, any>>({
  data,
  pageSize: initialPageSize = 10,
  sortField: initialSortField,
  sortDirection: initialSortDirection = 'asc',
  searchableFields = [],
  onPageChange,
  onSort,
  onFilter,
}: UseAdminTableOptions<T>): UseAdminTableReturn<T> {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  
  // Sorting state
  const [sortField, setSortField] = useState<string | null>(initialSortField || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection)
  
  // Filtering state
  const [searchTerm, setSearchTermState] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let result = [...data]
    
    // Apply search filter
    if (debouncedSearchTerm && searchableFields.length > 0) {
      result = result.filter(row => {
        return searchableFields.some(field => {
          const value = row[field]
          if (value == null) return false
          return String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        })
      })
    }
    
    // Apply custom filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value != null && value !== '') {
        result = result.filter(row => {
          const rowValue = row[field]
          if (Array.isArray(value)) {
            return value.includes(rowValue)
          }
          if (typeof value === 'object' && value.min != null && value.max != null) {
            return rowValue >= value.min && rowValue <= value.max
          }
          return rowValue === value
        })
      }
    })
    
    return result
  }, [data, debouncedSearchTerm, searchableFields, filters])
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortField, sortDirection])
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSize])
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedData.length / pageSize)
  
  // Pagination helpers
  const canNextPage = currentPage < totalPages
  const canPreviousPage = currentPage > 1
  
  // Set page
  const setPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages || 1))
    setCurrentPage(newPage)
    onPageChange?.(newPage)
  }, [totalPages, onPageChange])
  
  // Set page size
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])
  
  // Navigate pages
  const nextPage = useCallback(() => {
    if (canNextPage) {
      setPage(currentPage + 1)
    }
  }, [canNextPage, currentPage, setPage])
  
  const previousPage = useCallback(() => {
    if (canPreviousPage) {
      setPage(currentPage - 1)
    }
  }, [canPreviousPage, currentPage, setPage])
  
  // Handle sorting
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
      setSortDirection(newDirection)
      onSort?.(field, newDirection)
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
      onSort?.(field, 'asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }, [sortField, sortDirection, onSort])
  
  // Clear sorting
  const clearSort = useCallback(() => {
    setSortField(null)
    setSortDirection('asc')
  }, [])
  
  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term)
    setCurrentPage(1) // Reset to first page when searching
  }, [])
  
  // Set filter
  const setFilter = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    setCurrentPage(1) // Reset to first page when filtering
    onFilter?.({ ...filters, [field]: value })
  }, [filters, onFilter])
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchTermState('')
    setCurrentPage(1)
    onFilter?.({})
  }, [onFilter])
  
  // Toggle row selection
  const toggleRowSelection = useCallback((id: string | number) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  // Toggle all selection
  const toggleAllSelection = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
    } else {
      const ids = paginatedData.map((row, index) => row.id || index)
      setSelectedRows(new Set(ids))
    }
  }, [paginatedData, selectedRows.size])
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
  }, [])
  
  // Check if all rows are selected
  const isAllSelected = selectedRows.size > 0 && selectedRows.size === paginatedData.length
  
  // Reset page when data changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])
  
  return {
    // Data
    displayData: paginatedData,
    totalRows: sortedData.length,
    totalPages,
    
    // Pagination
    currentPage,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    
    // Sorting
    sortField,
    sortDirection,
    handleSort,
    clearSort,
    
    // Filtering
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    
    // Selection
    selectedRows,
    isAllSelected,
    toggleRowSelection,
    toggleAllSelection,
    clearSelection,
  }
}