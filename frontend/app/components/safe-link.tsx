"use client"

import { forwardRef } from "react"

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
}

const SafeLink = forwardRef<HTMLAnchorElement, SafeLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    return (
      <a 
        ref={ref}
        href={href}
        className={className}
        {...props}
      >
        {children}
      </a>
    )
  }
)

SafeLink.displayName = "SafeLink"

export { SafeLink }