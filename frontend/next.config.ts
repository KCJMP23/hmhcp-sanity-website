/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Disable linting and type checking for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // domains deprecated - using remotePatterns instead
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false, // Enable image optimization for better performance
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance optimizations (swcMinify is now default in Next.js 15)
  
  // Output configuration
  output: 'standalone',
  
  // Trailing slash for better SEO
  trailingSlash: false,
  
  // Generate sitemap and robots.txt
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Module transpilation
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'lucide-react',
    ],
    scrollRestoration: true,
  },
  
  // Turbopack configuration (moved to separate config)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Enhanced webpack configuration for production
  webpack: (config, { dev, isServer }) => {
    // Fix jest-worker issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      worker_threads: false,
    };

    // Ignore worker thread modules that cause issues
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('worker_threads');
    }

    // Handle binary .node files and server-only modules
    if (!isServer) {
      // Make server-only modules external for client builds
      config.externals = config.externals || [];
      config.externals.push({
        'cpu-features': 'commonjs cpu-features',
        'ssh2': 'commonjs ssh2',
        'dockerode': 'commonjs dockerode',
        'docker-modem': 'commonjs docker-modem',
      });
      
      // Ignore .node files completely for client builds
      config.module.rules.push({
        test: /\.node$/,
        use: 'ignore-loader',
      });
      
      // Ignore entire plugin system for client builds
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/plugins/sandbox-manager': false,
        '@/lib/plugins/sandbox': false,
        '@/lib/plugins/lifecycle-manager': false,
        '@/lib/plugins/installation-service': false,
        '@/lib/plugins/dependency-manager': false,
        '@/lib/plugins/backup-service': false,
      };
    }
    
    // For both server and client, ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

          // Apply optimizations for both development and production
          if (!isServer) {
            // Production client optimizations
            config.optimization = {
              ...config.optimization,
              splitChunks: {
                chunks: 'all',
                maxSize: 20000, // 20KB max chunk size
                minSize: 2000, // 2KB min chunk size
                maxAsyncRequests: 30, // Reasonable async chunks
                maxInitialRequests: 20, // Reasonable initial chunks
                enforceSizeThreshold: 5000, // Enforce size threshold
                cacheGroups: {
                  // Critical React libraries - load immediately
                  react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    chunks: 'all',
                    priority: 50,
                    maxSize: 30000,
                    minSize: 1000,
                  },
                  // Next.js framework - load immediately
                  nextjs: {
                    test: /[\\/]node_modules[\\/]next[\\/]/,
                    name: 'nextjs',
                    chunks: 'all',
                    priority: 45,
                    maxSize: 25000,
                    minSize: 1000,
                  },
                  // UI libraries - lazy load
                  radix: {
                    test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                    name: 'radix',
                    chunks: 'async',
                    priority: 40,
                    maxSize: 15000,
                    minSize: 500,
                  },
                  // Icons - lazy load
                  icons: {
                    test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                    name: 'icons',
                    chunks: 'async',
                    priority: 35,
                    maxSize: 10000,
                    minSize: 500,
                  },
                  // Supabase - async only
                  supabase: {
                    test: /[\\/]node_modules[\\/]@supabase[\\/]/,
                    name: 'supabase',
                    chunks: 'async',
                    priority: 30,
                    maxSize: 20000,
                    minSize: 500,
                  },
                  // Admin components - lazy load
                  admin: {
                    test: /[\\/]components[\\/]admin[\\/]/,
                    name: 'admin',
                    chunks: 'async',
                    priority: 25,
                    maxSize: 15000,
                    minSize: 500,
                  },
                  // Blog components - lazy load
                  blog: {
                    test: /[\\/]components[\\/]blog[\\/]/,
                    name: 'blog',
                    chunks: 'async',
                    priority: 20,
                    maxSize: 12000,
                    minSize: 500,
                  },
                  // Other vendors
                  vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'async',
                    priority: 10,
                    maxSize: 25000,
                    minSize: 1000,
                  },
                  // Common chunks
                  common: {
                    name: 'common',
                    minChunks: 2,
                    chunks: 'all',
                    priority: 5,
                    maxSize: 8000,
                    minSize: 1000,
                  },
                  // Micro chunks for better TBT
                  micro: {
                    name: 'micro',
                    minChunks: 1,
                    chunks: 'async',
                    priority: 1,
                    maxSize: 1000,
                    minSize: 100,
                  },
                  // Ultra micro chunks for critical TBT reduction
                  ultraMicro: {
                    name: 'ultra-micro',
                    minChunks: 1,
                    chunks: 'async',
                    priority: 0,
                    maxSize: 500,
                    minSize: 50,
                  },
                },
              },
              // Enable module concatenation for better performance
              concatenateModules: true,
            };
          }
    
    return config;
  },
  
  // Output optimization
  output: 'standalone',
  
  // Security headers and performance optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_BASE_URL || '*' : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Image optimization caching
      {
        source: '/_next/image/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets caching - simplified regex
      {
        source: '/:path*\\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
