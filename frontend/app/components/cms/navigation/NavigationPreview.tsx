'use client'

import React, { useState, useEffect, useRef } from 'react'
// import { NavigationItem } from '@/stores/navigationEditorStore'
import { cn } from '@/lib/utils'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { motion, AnimatePresence } from 'framer-motion'

// Temporary stub interface
interface NavigationItem {
  id: string
  title: string
  url?: string
  children?: NavigationItem[]
}

interface NavigationPreviewProps {
  items: NavigationItem[]
  mode: 'header' | 'mobile' | 'footer'
  fullscreen?: boolean
  onChange?: (mode: 'header' | 'mobile' | 'footer') => void
  onFullscreenToggle?: () => void
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'
type ThemeType = 'light' | 'dark'

const deviceConfigs = {
  desktop: {
    width: 1440,
    height: 900,
    scale: 0.7,
    icon: Monitor,
    name: 'Desktop'
  },
  tablet: {
    width: 768,
    height: 1024,
    scale: 0.6,
    icon: Tablet,
    name: 'Tablet'
  },
  mobile: {
    width: 375,
    height: 812,
    scale: 0.5,
    icon: Smartphone,
    name: 'Mobile'
  }
}

export function NavigationPreview({
  items,
  mode,
  fullscreen = false,
  onChange,
  onFullscreenToggle
}: NavigationPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [theme, setTheme] = useState<ThemeType>('light')
  const [zoom, setZoom] = useState(100)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const deviceConfig = deviceConfigs[device]
  const scale = (zoom / 100) * deviceConfig.scale

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_NAVIGATION',
        payload: {
          items,
          mode,
          theme
        }
      }, '*')
    }
  }, [items, mode, theme])

  const handleRefresh = () => {
    setIsRefreshing(true)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const getPreviewSrc = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/admin/navigation/preview-frame?mode=${mode}&theme=${theme}`
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-100 dark:bg-gray-900",
      fullscreen && "fixed inset-0 z-50"
    )}>
      {/* Preview Controls */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mode Selector */}
            <Select value={mode} onValueChange={(value) => onChange?.(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>

            {/* Device Selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1">
              {Object.entries(deviceConfigs).map(([key, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={key}
                    size="sm"
                    variant={device === key ? "default" : "ghost"}
                    className="h-8 w-8 p-0"
                    onClick={() => setDevice(key as DeviceType)}
                    title={config.name}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>

            {/* Theme Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-8 w-8 p-0"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="w-32">
                <Slider
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                  min={50}
                  max={150}
                  step={10}
                  className="cursor-pointer"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                {zoom}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>

            {/* Fullscreen Toggle */}
            {onFullscreenToggle && (
              <Button
                size="sm"
                variant="outline"
                onClick={onFullscreenToggle}
                className="h-8 w-8 p-0"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          animate={{
            width: deviceConfig.width * scale,
            height: mode === 'footer' ? 'auto' : deviceConfig.height * scale,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Device Frame (optional) */}
          {device !== 'desktop' && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-x-0 top-0 h-6 bg-gray-900 dark:bg-gray-700 -t-lg" />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gray-900 dark:bg-gray-700 -b-lg" />
              <div className="absolute inset-y-0 left-0 w-3 bg-gray-900 dark:bg-gray-700" />
              <div className="absolute inset-y-0 right-0 w-3 bg-gray-900 dark:bg-gray-700" />
            </div>
          )}

          {/* Preview Iframe */}
          <iframe
            ref={iframeRef}
            src={getPreviewSrc()}
            className="w-full h-full border-0"
            style={{
              width: deviceConfig.width,
              height: mode === 'footer' ? 'auto' : deviceConfig.height,
              minHeight: 200,
              pointerEvents: 'auto'
            }}
            sandbox="allow-scripts allow-same-origin"
            title="Navigation Preview"
          />
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-t px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {deviceConfig.name} • {deviceConfig.width} × {deviceConfig.height}
          </span>
          <span>
            {items.length} items • {mode} navigation
          </span>
        </div>
      </div>
    </div>
  )
}