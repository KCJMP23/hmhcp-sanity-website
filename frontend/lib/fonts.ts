import { Inter } from 'next/font/google'

// SF Pro Display for headings (Apple-inspired)
export const sfProDisplay = {
  className: 'font-sf-display',
  style: { 
    fontFamily: '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    letterSpacing: '-0.005em'
  },
  variable: '--font-sf-pro-display'
}

// SF Pro Text for body text (Apple-inspired)
export const sfProText = {
  className: 'font-sf-text',
  style: { 
    fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    letterSpacing: '-0.01em'
  },
  variable: '--font-sf-pro-text'
}

// Fallback Inter font for compatibility
export const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})