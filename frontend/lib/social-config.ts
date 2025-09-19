/**
 * Social Media Configuration
 * Centralized configuration for all social media links across the application
 */

export interface SocialLink {
  name: string
  url: string
  enabled: boolean
  icon: string
}

export const socialMediaConfig: Record<string, SocialLink> = {
  facebook: {
    name: 'Facebook',
    url: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_FACEBOOK_URL,
    icon: 'Facebook'
  },
  twitter: {
    name: 'Twitter',
    url: process.env.NEXT_PUBLIC_TWITTER_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_TWITTER_URL,
    icon: 'Twitter'
  },
  linkedin: {
    name: 'LinkedIn',
    url: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_LINKEDIN_URL,
    icon: 'Linkedin'
  },
  instagram: {
    name: 'Instagram',
    url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    icon: 'Instagram'
  },
  youtube: {
    name: 'YouTube',
    url: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_YOUTUBE_URL,
    icon: 'Youtube'
  }
}

/**
 * Get all enabled social media links
 */
export function getEnabledSocialLinks(): SocialLink[] {
  return Object.values(socialMediaConfig).filter(link => link.enabled)
}

/**
 * Get a specific social media link
 */
export function getSocialLink(platform: string): SocialLink | null {
  return socialMediaConfig[platform] || null
}

/**
 * Check if any social media links are configured
 */
export function hasSocialMediaLinks(): boolean {
  return getEnabledSocialLinks().length > 0
}