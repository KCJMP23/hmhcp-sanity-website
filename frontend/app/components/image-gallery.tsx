"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: {
    src: string
    alt: string
    width?: number
    height?: number
  }[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % images.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox()
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
  }

  return (
    <>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {images.map((image, index) => (
          <motion.div
            key={index}
            className="premium-card overflow-hidden cursor-pointer image-hover"
            whileHover={{ y: -5 }}
            onClick={() => openLightbox(index)}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              width={image.width || 400}
              height={image.height || 300}
              className="w-full h-auto object-cover"
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <motion.button
              className="absolute top-4 right-4 text-white p-2 bg-black/20 hover:bg-black/40 transition-colors"
              onClick={closeLightbox}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.button>

            <motion.button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/20 hover:bg-black/40 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ChevronLeft className="h-8 w-8" />
            </motion.button>

            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/20 hover:bg-black/40 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ChevronRight className="h-8 w-8" />
            </motion.button>

            <div className="relative max-w-5xl max-h-[80vh] px-10" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <Image
                    src={images[selectedIndex].src || "/placeholder.svg"}
                    alt={images[selectedIndex].alt}
                    width={1200}
                    height={800}
                    className="max-h-[80vh] w-auto object-contain mx-auto"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2  transition-colors ${
                    index === selectedIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
