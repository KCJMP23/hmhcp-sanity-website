"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

interface DynamicBodyWrapperProps {
  children: React.ReactNode
  className?: string
}

export function DynamicBodyWrapper({ children, className = "" }: DynamicBodyWrapperProps) {
  const pathname = usePathname()
  
  // Define pages with dark hero backgrounds that need transparent body background
  const darkBackgroundPages = [
    "/", 
    "/about",
    "/platforms",
    "/platforms/intellic-edc", 
    "/platforms/mybc-health",
    "/research",
    "/research/clinical-studies",
    "/research/publications", 
    "/research/qa-qi",
    "/services",
    "/education",
    "/blog",
    "/contact",
    "/case-studies",
    "/careers",
    "/leadership",
    "/partners",
    "/publications",
    "/webinars",
    "/faq",
    "/accessibility",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy"
  ]
  
  // Also check if it's a blog post page (starts with /blog/)
  const isBlogPost = pathname.startsWith('/blog/') && pathname !== '/blog/'
  const isDarkBackgroundPage = darkBackgroundPages.includes(pathname) || isBlogPost
  
  // Pages with light backgrounds that need the default body background
  const lightBackgroundPages = [
    "/admin",
    "/admin/login"
  ]
  
  const isLightBackgroundPage = lightBackgroundPages.includes(pathname) || pathname.startsWith("/admin/")
  
  // Determine body background class
  const bodyBackgroundClass = isDarkBackgroundPage ? "" : "bg-background text-foreground"
  
  useEffect(() => {
    // Apply the background class directly to the body element
    const body = document.body
    
    // Remove any existing background classes
    body.classList.remove("bg-background", "text-foreground")
    
    // Apply the appropriate classes
    if (!isDarkBackgroundPage) {
      body.classList.add("bg-background", "text-foreground")
    }
    
    // Apply other base classes
    const baseClasses = className.split(" ").filter(cls => cls.trim())
    baseClasses.forEach(cls => {
      if (cls.trim() && !body.classList.contains(cls)) {
        body.classList.add(cls)
      }
    })
    
    return () => {
      // Cleanup - restore default background when component unmounts
      body.classList.add("bg-background", "text-foreground")
    }
  }, [pathname, isDarkBackgroundPage, className])
  
  return <body>{children}</body>
}