interface PullQuoteProps {
  quote: string
  author?: string
  role?: string
  variant?: "default" | "bordered" | "gradient"
  className?: string
}

export function PullQuote({ quote, author, role, variant = "default", className }: PullQuoteProps) {
  // This component has been removed as per client request to remove all testimonials
  return null
}
