"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"

interface PlatformImageProps {
  image: string
  alt: string
  deviceImage: string
  deviceAlt: string
}

export function PlatformImage({ image, alt, deviceImage, deviceAlt }: PlatformImageProps) {
  const [deviceImageError, setDeviceImageError] = useState(false)
  const [mainImageError, setMainImageError] = useState(false)

  // Fallback images
  const fallbackMainImage = "/healthcare-platforms-hero.png"
  const fallbackDeviceImage = "/placeholder.svg"

  return (
    <div className="relative">
      <div className="relative h-[500px] overflow-hidden shadow-2xl">
        <Image
          src={mainImageError ? fallbackMainImage : image}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
          className="object-cover"
          onError={() => setMainImageError(true)}
        />
      </div>
      {!deviceImageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute -bottom-8 -right-8 w-32 h-40"
        >
          <Image
            src={deviceImageError ? fallbackDeviceImage : deviceImage}
            alt={deviceAlt}
            width={128}
            height={160}
            className="object-contain"
            onError={() => setDeviceImageError(true)}
          />
        </motion.div>
      )}
    </div>
  )
}