"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Typography } from "@/components/ui/apple-typography"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface VideoHeroAdvancedProps {
  title: string
  subtitle: string
  primaryCTA: {
    text: string
    href: string
  }
  secondaryCTA: {
    text: string
    href: string
  }
  videoSrc: string
  videoSources?: Array<{
    src: string
    type: string
    media?: string
  }>
  posterSrc: string
  enableAudioToggle?: boolean
  overlayVariant?: "gradient" | "mesh" | "aurora"
}

export function VideoHeroAdvanced({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  videoSrc,
  videoSources = [],
  posterSrc,
  enableAudioToggle = false,
  overlayVariant = "gradient"
}: VideoHeroAdvancedProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [videoError, setVideoError] = useState(false)
  const [networkSpeed, setNetworkSpeed] = useState<"fast" | "slow" | "unknown">("unknown")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  // Enhanced parallax transforms
  const videoScale = useTransform(scrollY, [0, 500], [1, 1.3])
  const overlayOpacity = useTransform(scrollY, [0, 300], [0.6, 0.85])
  const contentY = useTransform(scrollY, [0, 300], [0, -60])
  const contentScale = useTransform(scrollY, [0, 300], [1, 0.95])
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 100], [1, 0])
  
  // Network speed detection
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const updateNetworkSpeed = () => {
        if (connection.effectiveType === '4g' && connection.downlink > 5) {
          setNetworkSpeed('fast')
        } else if (connection.effectiveType === '3g' || connection.effectiveType === '2g') {
          setNetworkSpeed('slow')
        }
      }
      updateNetworkSpeed()
      connection.addEventListener('change', updateNetworkSpeed)
      return () => connection.removeEventListener('change', updateNetworkSpeed)
    }
  }, [])
  
  // Progressive video loading with quality selection
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const handleLoadStart = () => {
      // Show loading state
    }
    
    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      // Auto-play with error handling
      video.play().catch((error) => {
        console.warn('Autoplay failed:', error)
        setIsVideoPlaying(false)
      })
    }
    
    const handlePlay = () => setIsVideoPlaying(true)
    const handlePause = () => setIsVideoPlaying(false)
    const handleError = () => {
      setVideoError(true)
      console.error('Video loading error')
    }
    
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    
    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
    }
  }, [])
  
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    
    if (isVideoPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }
  
  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }
  
  // Gradient overlay variants
  const getOverlayGradient = () => {
    switch (overlayVariant) {
      case "mesh":
        return "bg-gradient-to-br from-blue-900/70 via-indigo-800/60 to-purple-900/50"
      case "aurora":
        return "bg-gradient-to-t from-blue-900/80 via-indigo-700/50 to-transparent"
      default:
        return "bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-indigo-900/50"
    }
  }
  
  return (
    <section 
      ref={containerRef}
      data-testid="video-hero-advanced"
      className="relative h-screen w-full overflow-hidden bg-black"
      aria-label="Hero section with video background"
    >
      {/* Video Background Layer */}
      <motion.div 
        style={{ scale: videoScale }}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Optimized Poster Frame with blur-up effect */}
        <motion.div 
          className={cn(
            "absolute inset-0 w-full h-full bg-cover bg-center",
            "transition-all duration-1000",
            isVideoLoaded ? "opacity-0 scale-105 blur-sm" : "opacity-100 scale-100 blur-0"
          )}
          style={{ backgroundImage: `url(${posterSrc})` }}
        />
        
        {/* Video Element with multiple sources */}
        {!videoError && (
          <video
            ref={videoRef}
            className={cn(
              "w-full h-full object-cover",
              "transition-opacity duration-1000",
              isVideoLoaded ? "opacity-100" : "opacity-0"
            )}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            poster={posterSrc}
            preload={networkSpeed === 'slow' ? 'metadata' : 'auto'}
          >
            {/* Primary source */}
            <source src={videoSrc} type="video/mp4" />
            
            {/* Additional format sources for better browser support */}
            {videoSources.map((source, index) => (
              <source
                key={index}
                src={source.src}
                type={source.type}
                media={source.media}
              />
            ))}
          </video>
        )}
        
        {/* Fallback for video error */}
        {videoError && (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${posterSrc})` }}
          />
        )}
      </motion.div>
      
      {/* Multi-layer Gradient Overlay */}
      <motion.div 
        style={{ opacity: overlayOpacity }}
        className={cn("absolute inset-0", getOverlayGradient())}
      >
        {/* Additional mesh texture overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </motion.div>
      
      {/* Content Layer */}
      <motion.div 
        style={{ 
          y: contentY,
          scale: contentScale
        }}
        className="relative z-10 flex items-center justify-center h-full px-6 text-center"
      >
        <div className="max-w-5xl mx-auto text-white">
          {/* Hero Title with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1, 
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <Typography 
              as="h1" 
              variant="heading1"
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-8 md:mb-10"
              style={{ 
                letterSpacing: '-0.02em',
                lineHeight: '1.05',
                fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              {title}
            </Typography>
          </motion.div>
          
          {/* Subtitle with stagger animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.5,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <Typography 
              as="p" 
              variant="body"
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light opacity-90 mb-12 md:mb-16 max-w-3xl mx-auto leading-relaxed"
              style={{ 
                letterSpacing: '-0.01em',
                fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif'
              }}
            >
              {subtitle}
            </Typography>
          </motion.div>
          
          {/* Enhanced CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.7,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Primary CTA with enhanced pulse animation */}
            <motion.a
              href={primaryCTA.href}
              data-testid="primary-cta-button"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)" 
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative inline-flex items-center justify-center",
                "px-10 sm:px-12 py-4 h-14 sm:h-16",
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-700 hover:to-indigo-700",
                "text-white font-medium text-base sm:text-lg",
                "rounded-full",
                "shadow-2xl",
                "transition-all duration-300",
                "border border-white/20",
                "overflow-hidden"
              )}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ opacity: 0.3 }}
              />
              
              {/* Button text with pulse */}
              <motion.span
                className="relative z-10"
                animate={{ 
                  textShadow: [
                    "0 0 20px rgba(59, 130, 246, 0)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 20px rgba(59, 130, 246, 0)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {primaryCTA.text}
              </motion.span>
            </motion.a>
            
            {/* Secondary CTA with glass morphism */}
            <motion.a
              href={secondaryCTA.href}
              data-testid="secondary-cta-button"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(20px)"
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "inline-flex items-center justify-center",
                "px-10 sm:px-12 py-4 h-14 sm:h-16",
                "bg-white/10 hover:bg-white/20",
                "backdrop-blur-md",
                "text-white font-medium text-base sm:text-lg",
                "rounded-full",
                "border border-white/30",
                "transition-all duration-300",
                "shadow-lg"
              )}
            >
              {secondaryCTA.text}
            </motion.a>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Video Controls */}
      <AnimatePresence>
        {isVideoLoaded && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-6 right-6 z-20 flex gap-2"
          >
            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className={cn(
                "w-12 h-12 rounded-lg",
                "bg-black/30 backdrop-blur-md",
                "text-white hover:bg-black/50",
                "transition-all duration-200",
                "border border-white/20",
                "flex items-center justify-center"
              )}
              aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
            >
              {isVideoPlaying ? (
                <Pause className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
              )}
            </motion.button>
            
            {/* Mute/Unmute Button */}
            {enableAudioToggle && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={cn(
                  "w-12 h-12 rounded-lg",
                  "bg-black/30 backdrop-blur-md",
                  "text-white hover:bg-black/50",
                  "transition-all duration-200",
                  "border border-white/20",
                  "flex items-center justify-center"
                )}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                )}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Scroll Indicator */}
      <motion.div
        style={{ opacity: scrollIndicatorOpacity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: [0.4, 0, 0.6, 1]
          }}
          className="relative"
        >
          {/* Mouse outline */}
          <div className="w-7 h-11 border-2 border-white/40 rounded-full flex justify-center">
            {/* Scroll wheel */}
            <motion.div 
              className="w-1.5 h-3 bg-white/60 rounded-full mt-2"
              animate={{ 
                y: [0, 16, 0],
                opacity: [1, 0.5, 1]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1]
              }}
            />
          </div>
          
          {/* Scroll text */}
          <motion.p
            className="text-white/60 text-xs mt-2 tracking-wide uppercase"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Scroll
          </motion.p>
        </motion.div>
      </motion.div>
      
      {/* Accessibility: Skip to content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-white text-blue-600 px-6 py-3 rounded-full focus:outline-none 
                   focus:ring-2 focus:ring-blue-500 font-medium shadow-lg z-30"
      >
        Skip to main content
      </a>
    </section>
  )
}