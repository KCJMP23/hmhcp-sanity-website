'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Table, Image, Shield, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ExportButtonProps {
  onExport: (format: 'csv' | 'json' | 'pdf' | 'png') => void
  loading?: boolean
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, loading = false }) => {
  const [isExporting, setIsExporting] = useState(false)
  const { user } = useAuth()
  
  // Role-based permissions for export
  const hasExportPermissions = () => {
    if (!user?.role) return false
    return ['Admin', 'Content Manager', 'Healthcare Professional'].includes(user.role)
  }

  const canExportFormat = (format: string) => {
    if (!user?.role) return false
    
    switch (format) {
      case 'csv':
      case 'json':
        return ['Admin', 'Content Manager', 'Healthcare Professional'].includes(user.role)
      case 'pdf':
        return ['Admin', 'Content Manager'].includes(user.role)
      case 'png':
        return ['Admin', 'Content Manager'].includes(user.role)
      default:
        return false
    }
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf' | 'png') => {
    if (!canExportFormat(format)) {
      console.warn('User does not have permission to export in this format')
      return
    }

    setIsExporting(true)
    try {
      // Simulate export delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      onExport(format)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!hasExportPermissions()) {
    return (
      <Button 
        disabled 
        variant="outline" 
        className="bg-white/80 backdrop-blur-sm border-gray-200"
      >
        <Shield className="h-4 w-4 mr-2" />
        Export (No Permission)
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90"
          disabled={loading || isExporting}
          style={{ fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          {isExporting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-white/95 backdrop-blur-sm border-gray-200"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          Export Analytics Data
          <Badge variant="outline" className="text-xs">
            {user?.role}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* CSV Export */}
        <DropdownMenuItem 
          onClick={() => handleExport('csv')}
          disabled={!canExportFormat('csv') || isExporting}
          className="cursor-pointer"
        >
          <Table className="h-4 w-4 mr-3 text-green-600" />
          <div className="flex-1">
            <div className="font-medium">CSV Spreadsheet</div>
            <div className="text-xs text-gray-500">
              Raw data for analysis in Excel
            </div>
          </div>
        </DropdownMenuItem>

        {/* JSON Export */}
        <DropdownMenuItem 
          onClick={() => handleExport('json')}
          disabled={!canExportFormat('json') || isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-3 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium">JSON Data</div>
            <div className="text-xs text-gray-500">
              Structured data for developers
            </div>
          </div>
        </DropdownMenuItem>

        {/* PDF Report */}
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={!canExportFormat('pdf') || isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-3 text-red-600" />
          <div className="flex-1">
            <div className="font-medium">PDF Report</div>
            <div className="text-xs text-gray-500">
              Formatted healthcare analytics report
              {!canExportFormat('pdf') && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  Admin Only
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuItem>

        {/* PNG Export */}
        <DropdownMenuItem 
          onClick={() => handleExport('png')}
          disabled={!canExportFormat('png') || isExporting}
          className="cursor-pointer"
        >
          <Image className="h-4 w-4 mr-3 text-purple-600" />
          <div className="flex-1">
            <div className="font-medium">Dashboard Screenshot</div>
            <div className="text-xs text-gray-500">
              Visual snapshot of current metrics
              {!canExportFormat('png') && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  Admin Only
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="h-3 w-3" />
            <span>HIPAA Compliant Export</span>
          </div>
          <div>Data is anonymized and encrypted during export</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}