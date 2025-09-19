"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ExpandableContentProps {
  title: string
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
  icon?: React.ReactNode
}

export function ExpandableContent({ title, children, className, defaultOpen = false, icon }: ExpandableContentProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("premium-card overflow-hidden", className)}>
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center">
          {icon && <div className="mr-3">{icon}</div>}
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className={cn("transform transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TabsProps {
  tabs: {
    label: string
    content: React.ReactNode
    icon?: React.ReactNode
  }[]
  className?: string
  tabsClassName?: string
  contentClassName?: string
  variant?: "default" | "pills" | "underline"
}

export function Tabs({ tabs, className, tabsClassName, contentClassName, variant = "default" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className={cn("premium-card", className)}>
      <div
        className={cn(
          "flex",
          variant === "default" && "border-b border-gray-200 dark:border-gray-800",
          variant === "pills" && "p-1 bg-gray-100 dark:bg-gray-800 ",
          variant === "underline" && "border-b border-gray-200 dark:border-gray-800",
          tabsClassName,
        )}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium transition-colors",
              variant === "default" &&
                (activeTab === index
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
              variant === "pills" &&
                (activeTab === index
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm "
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
              variant === "underline" &&
                (activeTab === index
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn("p-4", contentClassName)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabs[activeTab].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

interface CardFlipProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  height?: number | string
}

export function CardFlip({ front, back, className, height = 300 }: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className={cn("relative cursor-pointer perspective", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "absolute w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped ? "rotate-y-180" : "",
        )}
      >
        <div className="absolute w-full h-full backface-hidden premium-card p-6">{front}</div>
        <div className="absolute w-full h-full backface-hidden rotate-y-180 premium-card p-6">{back}</div>
      </div>
    </div>
  )
}

interface HoverRevealProps {
  preview: React.ReactNode
  content: React.ReactNode
  className?: string
}

export function HoverReveal({ preview, content, className }: HoverRevealProps) {
  return (
    <div className={cn("relative group overflow-hidden premium-card", className)}>
      <div className="transition-opacity duration-300 group-hover:opacity-10">{preview}</div>
      <div className="absolute inset-0 flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {content}
      </div>
    </div>
  )
}
