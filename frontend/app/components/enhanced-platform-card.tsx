"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Typography } from "@/components/ui/apple-typography"
import type { ReactNode } from "react"

interface EnhancedPlatformCardProps {
  name: string
  description: string
  image: string
  features: string[]
  icon: ReactNode
  link: string
  index?: number
}

export function EnhancedPlatformCard({
  name,
  description,
  image,
  features,
  icon,
  link,
  index = 0,
}: EnhancedPlatformCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <div className="group h-full overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500">
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-2 shadow-sm">
            {icon}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>

        <div className="p-8 flex flex-col flex-grow">
          <Typography
            as="h3"
            variant="heading3"
            className="mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
          >
            {name}
          </Typography>

          <Typography as="p" className="text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </Typography>

          <div className="mt-2 mb-6">
            <Typography as="h4" className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Key Features
            </Typography>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 mr-2"></span>
                  <Typography as="span" className="text-gray-700 dark:text-gray-200">
                    {feature}
                  </Typography>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto">
            <Link
              href={link}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors group/link"
            >
              <span>Explore {name}</span>
              <motion.div className="ml-2" initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
