"use client"

import { useState, useEffect } from 'react'
import { Typography } from '@/components/ui/apple-typography'
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button'
import { ContactForm } from '@/components/forms/ContactForm'
import { fetchWithBackup } from '@/lib/cms/fetch-with-backup'
import { FadeIn } from '@/components/animations-simple'
import { AppleStyleHero } from '@/components/apple-style-hero-simple'
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react'

// TypeScript interfaces for contact page data structure
interface ContactHero {
  title: string
  subtitle: string
}

interface ContactInfo {
  email: string
  phone: string
  address: string
}

interface ContactForm {
  title: string
  subtitle?: string
}

interface ContactPageData {
  _id: string
  _type: 'contactPage'
  hero: ContactHero
  contactInfo: ContactInfo
  form: ContactForm
}

// Static fallback data function
function getContactStaticFallback(): ContactPageData {
  return {
    _id: 'contact-fallback',
    _type: 'contactPage',
    hero: {
      title: "Get in Touch",
      subtitle: "Let's discuss how we can transform healthcare together"
    },
    contactInfo: {
      email: "contact@hmhealthcare.com",
      phone: "1-800-555-0123",
      address: "123 Healthcare Innovation Drive, Tech City, TC 12345"
    },
    form: {
      title: "Contact Form",
      subtitle: "We'd love to hear from you. Send us a message and we'll respond as soon as possible."
    }
  }
}

export default function ContactPage() {
  const [pageData, setPageData] = useState<ContactPageData>(getContactStaticFallback())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setLoading(true)
        const data = await fetchWithBackup<ContactPageData>('/api/cms/pages/contact', 'contact')
        setPageData(data)
      } catch (error) {
        console.error('Error fetching contact data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch contact data')
        setPageData(getContactStaticFallback())
      } finally {
        setLoading(false)
      }
    }
    fetchContactData()
  }, [])

  if (loading && !pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
            Loading contact...
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Full-Screen Hero Section with Chicago Background */}
      <AppleStyleHero
        title={pageData.hero.title}
        subtitle={pageData.hero.subtitle}
        backgroundImage="/chicago-skyline.jpg"
        height="full"
        overlayColor="from-blue-600/60 via-blue-700/60 to-blue-800/60"
        primaryCTA={{
          text: "Schedule Consultation",
          href: "#contact-form",
        }}
        secondaryCTA={{
          text: "View Our Location",
          href: "#contact-info",
        }}
      />
      
      {/* Contact Information */}
      <section id="contact-info" className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0.1}>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <Typography as="h3" variant="heading3" className="mb-2">
                  Email Us
                </Typography>
                <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                  {pageData.contactInfo.email}
                </Typography>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <Typography as="h3" variant="heading3" className="mb-2">
                  Call Us
                </Typography>
                <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                  {pageData.contactInfo.phone}
                </Typography>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <Typography as="h3" variant="heading3" className="mb-2">
                  Visit Us
                </Typography>
                <Typography as="p" variant="body" className="text-gray-600 dark:text-gray-400">
                  {pageData.contactInfo.address}
                </Typography>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
      
      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto">
          <FadeIn delay={0.2}>
            <ContactForm 
              className="mx-auto"
              onSuccess={() => {
                // Optional: Add analytics tracking or redirect
                console.log('Contact form submitted successfully')
              }}
            />
          </FadeIn>
        </div>
      </section>
    </div>
  );
}