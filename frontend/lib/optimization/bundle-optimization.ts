/**
 * Bundle Optimization Configuration
 * 
 * Advanced bundle optimization for Next.js marketing website
 * Includes code splitting, tree shaking, and chunk optimization
 */

import type { NextConfig } from 'next'

export interface BundleOptimizationConfig {
  enableAnalyzer?: boolean
  compressionLevel?: number
  minimumChunkSize?: number
  maxAsyncRequests?: number
  maxInitialRequests?: number
  splitChunks?: boolean
  runtimeChunk?: boolean | 'single'
  removeConsole?: boolean
  reactStrictMode?: boolean
  swcMinify?: boolean
}

/**
 * Default bundle optimization settings
 */
export const defaultBundleConfig: BundleOptimizationConfig = {
  enableAnalyzer: false,
  compressionLevel: 9,
  minimumChunkSize: 20000, // 20KB
  maxAsyncRequests: 30,
  maxInitialRequests: 25,
  splitChunks: true,
  runtimeChunk: 'single',
  removeConsole: true,
  reactStrictMode: false, // Disable in production for performance
  swcMinify: true
}

/**
 * Generate optimized webpack configuration
 */
export function generateWebpackConfig(
  config: BundleOptimizationConfig = defaultBundleConfig
) {
  return (webpackConfig: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Production optimizations only
    if (!dev) {
      // Enable module concatenation
      webpackConfig.optimization.concatenateModules = true
      
      // Configure split chunks
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        minSize: config.minimumChunkSize,
        maxAsyncRequests: config.maxAsyncRequests,
        maxInitialRequests: config.maxInitialRequests,
        cacheGroups: {
          // Framework chunks
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            name: 'framework',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Library chunks
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module: any) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1]
              
              // Group similar libraries
              if (packageName?.startsWith('@radix-ui')) return 'radix-ui'
              if (packageName?.startsWith('@supabase')) return 'supabase'
              if (packageName?.startsWith('framer')) return 'framer'
              if (packageName?.startsWith('three')) return 'three'
              
              return `npm.${packageName?.replace('@', '')}`
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true
          },
          
          // Shared components
          shared: {
            test: /[\\/]components[\\/]/,
            name: 'components',
            priority: 20,
            minChunks: 2,
            reuseExistingChunk: true
          },
          
          // Common utilities
          common: {
            test: /[\\/](lib|utils|hooks)[\\/]/,
            name: 'common',
            priority: 15,
            minChunks: 2,
            reuseExistingChunk: true
          },
          
          // Default chunk
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }

      // Configure runtime chunk
      if (config.runtimeChunk) {
        webpackConfig.optimization.runtimeChunk = config.runtimeChunk
      }

      // Minimize bundle size
      webpackConfig.optimization.minimize = true
      webpackConfig.optimization.usedExports = true
      webpackConfig.optimization.sideEffects = false

      // Add compression plugin
      if (!isServer) {
        const CompressionPlugin = require('compression-webpack-plugin')
        webpackConfig.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192, // 8KB
            minRatio: 0.8,
            compressionOptions: { level: config.compressionLevel }
          }),
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
            compressionOptions: { level: 11 }
          })
        )
      }

      // Remove console logs in production
      if (config.removeConsole) {
        webpackConfig.optimization.minimizer.forEach((minimizer: any) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true,
                drop_debugger: true
              }
            }
          }
        })
      }
    }

    // Add bundle analyzer
    if (config.enableAnalyzer && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      webpackConfig.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          openAnalyzer: false
        })
      )
    }

    return webpackConfig
  }
}

/**
 * Generate optimized Next.js configuration
 */
export function generateNextConfig(
  customConfig: Partial<NextConfig> = {},
  bundleConfig: BundleOptimizationConfig = defaultBundleConfig
): NextConfig {
  return {
    // Enable SWC minification
    swcMinify: bundleConfig.swcMinify,
    
    // React configuration
    reactStrictMode: bundleConfig.reactStrictMode,
    
    // Production optimizations
    productionBrowserSourceMaps: false,
    
    // Compression
    compress: true,
    
    // PoweredBy header
    poweredByHeader: false,
    
    // Generate build ID
    generateBuildId: async () => {
      return `build-${Date.now()}`
    },
    
    // Image optimization
    images: {
      domains: [
        'hmhcp.com',
        'cdn.hmhcp.com',
        'images.unsplash.com',
        'res.cloudinary.com'
      ],
      deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2560],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 31536000, // 1 year
      dangerouslyAllowSVG: true,
      contentDispositionType: 'attachment',
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
    },
    
    // Headers
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin'
            }
          ]
        },
        // Cache static assets
        {
          source: '/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        },
        // Cache images
        {
          source: '/images/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        },
        // Cache fonts
        {
          source: '/fonts/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ]
        }
      ]
    },
    
    // Redirects
    async redirects() {
      return []
    },
    
    // Rewrites
    async rewrites() {
      return []
    },
    
    // Webpack configuration
    webpack: generateWebpackConfig(bundleConfig),
    
    // Experimental features
    experimental: {
      optimizeCss: true,
      scrollRestoration: true,
      optimizePackageImports: [
        '@radix-ui/react-accordion',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-navigation-menu',
        '@radix-ui/react-tabs',
        'framer-motion',
        'lucide-react',
        'recharts'
      ]
    },
    
    // Output configuration
    output: 'standalone',
    
    // Trailing slash
    trailingSlash: false,
    
    // Skip validation
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
    
    // Custom configuration
    ...customConfig
  }
}

/**
 * Dynamic imports configuration for code splitting
 */
export const dynamicImports = {
  // Admin components - lazy load
  AdminDashboard: () => import('../../components/admin/wordpress-dashboard'),
  AdminAnalytics: () => import('../../components/admin/analytics/analytics-dashboard'),
  AdminMedia: () => import('../../components/admin/advanced-media-gallery'),
  
  // Heavy components - lazy load
  ThreeJSModel: () => import('../../components/platform-3d-model'),
  VideoPlayer: () => import('../../components/media/VideoPlayer'),
  RichTextEditor: () => import('../../components/ui/rich-text-editor'),
  
  // Charts - lazy load
  BarChart: () => import('../../components/charts/BarChartComponent'),
  LineChart: () => import('../../components/charts/LineChartComponent'),
  PieChart: () => import('../../components/charts/PieChartComponent'),
  
  // Modals - lazy load
  SearchModal: () => import('../../components/modals/SearchModal'),
  NewsletterModal: () => import('../../components/newsletter/NewsletterModal')
}

/**
 * Preload critical chunks
 */
export function preloadCriticalChunks(): void {
  if (typeof window !== 'undefined') {
    // Preload framework chunks
    const frameworkChunk = document.createElement('link')
    frameworkChunk.rel = 'preload'
    frameworkChunk.as = 'script'
    frameworkChunk.href = '/_next/static/chunks/framework.js'
    document.head.appendChild(frameworkChunk)
    
    // Preload main chunks
    const mainChunk = document.createElement('link')
    mainChunk.rel = 'preload'
    mainChunk.as = 'script'
    mainChunk.href = '/_next/static/chunks/main.js'
    document.head.appendChild(mainChunk)
    
    // Preload component chunks
    const componentChunk = document.createElement('link')
    componentChunk.rel = 'preload'
    componentChunk.as = 'script'
    componentChunk.href = '/_next/static/chunks/components.js'
    document.head.appendChild(componentChunk)
  }
}

/**
 * Prefetch route chunks
 */
export function prefetchRouteChunks(routes: string[]): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach(route => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.as = 'script'
        link.href = `/_next/static/chunks/pages${route}.js`
        document.head.appendChild(link)
      })
    })
  }
}