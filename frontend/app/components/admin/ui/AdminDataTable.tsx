/**
 * Enhanced AdminDataTable with Virtual Scrolling and Performance Optimization
 * Handles large datasets (100,000+ items) with smooth scrolling and memory efficiency
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useVirtualizer } from '@tanstack/react-virtual'

// Types
export interface ColumnDef<T = any> {
  id: string
  header: string
  accessorKey?: string
  accessorFn?: (item: T) => any
  cell?: (info: { getValue: () => any; row: { original: T } }) => React.ReactNode
  enableSorting?: boolean
  enableHiding?: boolean
  meta?: {
    className?: string
    width?: number
  }
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  cursors?: {
    before?: string
    after?: string
    current?: string
  }
}

export interface AdminDataTableProps<T = any> {
  columns: ColumnDef<T>[]
  data: T[]
  pagination: PaginationInfo
  loading?: boolean
  error?: string | null
  
  // Virtualization options
  enableVirtualization?: boolean
  estimatedRowHeight?: number
  overscanRowCount?: number
  
  // Selection
  enableRowSelection?: boolean
  selectedRows?: Set<string>
  onRowSelectionChange?: (selectedIds: Set<string>) => void
  getRowId?: (row: T) => string
  
  // Actions
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void
  onSearchChange?: (search: string) => void
  onRefresh?: () => void
  
  // Cursor pagination
  onCursorChange?: (cursor: string, direction: 'before' | 'after') => void
  
  // Bulk operations
  enableBulkOperations?: boolean
  bulkOperations?: Array<{
    label: string
    action: (selectedIds: string[]) => void
    variant?: 'default' | 'destructive' | 'outline'
  }>
  
  // Performance options
  enableInfiniteScroll?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  
  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean
}

// Memoized table row component for performance
const TableRowMemoized = memo<{
  row: any
  columns: ColumnDef[]
  isSelected: boolean
  onSelectionChange: (id: string, selected: boolean) => void
  getRowId: (row: any) => string
  enableSelection: boolean
  style?: React.CSSProperties
}>(({ row, columns, isSelected, onSelectionChange, getRowId, enableSelection, style }) => {
  const rowId = getRowId(row)
  
  const handleSelectionChange = useCallback((checked: boolean) => {
    onSelectionChange(rowId, checked)
  }, [rowId, onSelectionChange])

  return (
    <TableRow 
      key={rowId}
      className={cn(
        'hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
      style={style}
    >
      {enableSelection && (
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectionChange}
            aria-label={`Select row ${rowId}`}
          />
        </TableCell>
      )}
      {columns.map((column) => {
        const value = column.accessorFn 
          ? column.accessorFn(row)
          : column.accessorKey 
            ? row[column.accessorKey]
            : null

        return (
          <TableCell
            key={column.id}
            className={cn(column.meta?.className)}
            style={column.meta?.width ? { width: column.meta.width } : undefined}
          >
            {column.cell ? (
              column.cell({ 
                getValue: () => value, 
                row: { original: row } 
              })
            ) : (
              <span>{value}</span>
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
})

TableRowMemoized.displayName = 'TableRowMemoized'

// Main component
export const AdminDataTable = <T,>({
  columns,
  data,
  pagination,
  loading = false,
  error = null,
  enableVirtualization = false,
  estimatedRowHeight = 60,
  overscanRowCount = 5,
  enableRowSelection = false,
  selectedRows = new Set(),
  onRowSelectionChange,
  getRowId = (row: any) => row.id || row._id || JSON.stringify(row),
  onPageChange,
  onLimitChange,
  onSortChange,
  onSearchChange,
  onRefresh,
  onCursorChange,
  enableBulkOperations = false,
  bulkOperations = [],
  enableInfiniteScroll = false,
  onLoadMore,
  hasMore = false,
  className,
  tableClassName,
  compact = false
}: AdminDataTableProps<T>) => {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Refs for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: overscanRowCount,
    enabled: enableVirtualization
  })

  // Effects
  useEffect(() => {
    if (onSearchChange && debouncedSearchTerm !== undefined) {
      onSearchChange(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, onSearchChange])

  // Infinite scroll detection
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore || !hasMore) return

    const handleScroll = () => {
      const container = tableContainerRef.current
      if (!container) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100

      if (scrolledToBottom && !loading) {
        onLoadMore()
      }
    }

    const container = tableContainerRef.current
    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [enableInfiniteScroll, onLoadMore, hasMore, loading])

  // Handlers
  const handleSort = useCallback((columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(columnId)
    setSortDirection(newDirection)
    onSortChange?.(columnId, newDirection)
  }, [sortColumn, sortDirection, onSortChange])

  const handleRowSelection = useCallback((rowId: string, selected: boolean) => {
    if (!onRowSelectionChange) return
    
    const newSelectedRows = new Set(selectedRows)
    if (selected) {
      newSelectedRows.add(rowId)
    } else {
      newSelectedRows.delete(rowId)
    }
    onRowSelectionChange(newSelectedRows)
  }, [selectedRows, onRowSelectionChange])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onRowSelectionChange) return
    
    const newSelectedRows = new Set<string>()
    if (checked) {
      data.forEach(row => {
        newSelectedRows.add(getRowId(row))
      })
    }
    onRowSelectionChange(newSelectedRows)
  }, [data, getRowId, onRowSelectionChange])

  const handleBulkOperation = useCallback((operation: typeof bulkOperations[0]) => {
    const selectedIds = Array.from(selectedRows)
    if (selectedIds.length === 0) return
    operation.action(selectedIds)
  }, [selectedRows, bulkOperations])

  // Computed values
  const allSelected = useMemo(() => {
    return data.length > 0 && data.every(row => selectedRows.has(getRowId(row)))
  }, [data, selectedRows, getRowId])

  const someSelected = useMemo(() => {
    return selectedRows.size > 0 && !allSelected
  }, [selectedRows, allSelected])

  // Render functions
  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {enableRowSelection && (
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected
              }}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
        )}
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={cn(
              column.enableSorting !== false && 'cursor-pointer select-none hover:bg-muted',
              column.meta?.className
            )}
            style={column.meta?.width ? { width: column.meta.width } : undefined}
            onClick={() => {
              if (column.enableSorting !== false) {
                handleSort(column.id)
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <span>{column.header}</span>
              {column.enableSorting !== false && (
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              )}
              {sortColumn === column.id && (
                <div className="text-primary">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </div>
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )

  const renderTableRows = () => {
    if (enableVirtualization) {
      const virtualItems = virtualizer.getVirtualItems()
      
      return (
        <TableBody
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative'
          }}
        >
          {virtualItems.map((virtualItem) => {
            const row = data[virtualItem.index]
            const rowId = getRowId(row)
            const isSelected = selectedRows.has(rowId)

            return (
              <TableRowMemoized
                key={rowId}
                row={row}
                columns={columns}
                isSelected={isSelected}
                onSelectionChange={handleRowSelection}
                getRowId={getRowId}
                enableSelection={enableRowSelection}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`
                }}
              />
            )
          })}
        </TableBody>
      )
    }

    // Standard non-virtualized rendering
    return (
      <TableBody>
        {data.map((row) => {
          const rowId = getRowId(row)
          const isSelected = selectedRows.has(rowId)

          return (
            <TableRowMemoized
              key={rowId}
              row={row}
              columns={columns}
              isSelected={isSelected}
              onSelectionChange={handleRowSelection}
              getRowId={getRowId}
              enableSelection={enableRowSelection}
            />
          )
        })}
      </TableBody>
    )
  }

  const renderPagination = () => {
    if (pagination.total === -1) {
      // Cursor-based pagination
      return (
        <div className="flex items-center justify-between space-x-6">
          <div className="text-sm text-muted-foreground">
            Showing {data.length} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCursorChange?.(pagination.cursors?.before || '', 'before')}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCursorChange?.(pagination.cursors?.after || '', 'after')}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    // Standard pagination
    return (
      <div className="flex items-center justify-between space-x-6">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => onLimitChange?.(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(Math.ceil(pagination.total / pagination.limit))}
              disabled={!pagination.hasNext}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 p-4 text-center">
        <p className="text-sm text-destructive">Error loading data: {error}</p>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search and bulk operations */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {onSearchChange && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          
          {enableBulkOperations && selectedRows.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedRows.size} selected
              </Badge>
              {bulkOperations.map((operation, index) => (
                <Button
                  key={index}
                  variant={operation.variant || 'outline'}
                  size="sm"
                  onClick={() => handleBulkOperation(operation)}
                >
                  {operation.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div
          ref={tableContainerRef}
          className={cn(
            'relative overflow-auto',
            enableVirtualization && 'max-h-[600px]'
          )}
        >
          <Table className={cn(compact && 'text-sm', tableClassName)}>
            {renderTableHeader()}
            {loading && data.length === 0 ? (
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {enableRowSelection && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : data.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              renderTableRows()
            )}
          </Table>
          
          {/* Loading indicator for infinite scroll */}
          {enableInfiniteScroll && loading && data.length > 0 && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!enableInfiniteScroll && renderPagination()}
    </div>
  )
}

AdminDataTable.displayName = 'AdminDataTable'

export default AdminDataTable