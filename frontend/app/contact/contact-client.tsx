"use client"

import { useState, useEffect } from "react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { EnhancedHero } from "@/components/enhanced-hero"
import { GlassmorphismCard } from "@/components/ui/global-styles"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations-simple"
import { Typography } from "@/components/ui/apple-typography"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Calendar,
  Users,
  Briefcase,
  Settings,
  Shield
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadReCaptcha, executeReCaptcha } from '@/lib/recaptcha'
import { useCSRFToken } from '@/lib/csrf-client'

interface ContactInfo {
  title: string
  iconType: string
  details: string[]
  description: string
}

interface ContactInfoSection {
  title: string
  description: string
  contactInfo: ContactInfo[]
}

interface Department {
  name: string
  iconType: string
  email: string
  description: string
}

interface DepartmentsSection {
  title: string
  description: string
  departments: Department[]
}

interface ContactFormSection {
  title: string
  description: string
  submitButtonText: string
  successMessage: {
    title: string
    message: string
  }
  departmentOptions: Array<{
    label: string
    value: string
  }>
}

interface Office {
  city: string
  address: string
  phone: string
  email?: string
  imageUrl: string
  mapUrl?: string
  timezone?: string
  businessHours?: string[]
}

interface OfficesSection {
  title: string
  description: string
  offices: Office[]
}

interface AdditionalInfo {
  emergencyContact?: {
    phone?: string
    email?: string
    description?: string
  }
  socialMedia?: Array<{
    platform: string
    url: string
  }>
  privacyPolicy?: {
    url?: string
    description?: string
  }
}

interface ContactPageClientProps {
  title: string
  subtitle: string
  heroImageUrl: string
  contactInfoSection: ContactInfoSection
  departmentsSection: DepartmentsSection
  contactFormSection: ContactFormSection
  officesSection: OfficesSection
  additionalInfo?: AdditionalInfo
}

export function ContactPageClient({
  title,
  subtitle,
  heroImageUrl,
  contactInfoSection,
  departmentsSection,
  contactFormSection,
  officesSection,
  additionalInfo
}: ContactPageClientProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    department: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [honeypot, setHoneypot] = useState('') // Honeypot field
  const csrf = useCSRFToken()

  // Load reCAPTCHA on component mount
  useEffect(() => {
    loadReCaptcha()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check honeypot
    if (honeypot) {
      console.warn('Bot detected via honeypot')
      setIsSubmitted(true) // Fake success for bots
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeReCaptcha('contact_form')
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: csrf.addToHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(csrf.addToBody({
          ...formData,
          recaptchaToken
        }))
      })

      const result = await response.json()
      
      if (response.ok) {
        setIsSubmitted(true)
      } else {
        alert('Failed to submit form. Please try again.')
      }
    } catch (error) {
      alert('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get icon component by type
  const getIconByType = (iconType: string, className = "w-6 h-6 text-blue-600 dark:text-blue-400") => {
    switch (iconType) {
      case 'phone':
        return <Phone className={className} />
      case 'mail':
        return <Mail className={className} />
      case 'map-pin':
        return <MapPin className={className} />
      case 'clock':
        return <Clock className={className} />
      case 'message-square':
        return <MessageSquare className={className} />
      case 'briefcase':
        return <Briefcase className={className} />
      case 'users':
        return <Users className={className} />
      case 'calendar':
        return <Calendar className={className} />
      case 'settings':
        return <Settings className={className} />
      case 'shield':
        return <Shield className={className} />
      default:
        return <MessageSquare className={className} />
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          </motion.div>
          <Typography as="h1" variant="heading2" className="mb-4">
            {contactFormSection.successMessage.title}
          </Typography>
          <Typography as="p" variant="body" className="mb-6">
            {contactFormSection.successMessage.message}
          </Typography>
          <Button 
            onClick={() => {
              setIsSubmitted(false)
              setFormData({
                name: "",
                email: "",
                organization: "",
                department: "",
                subject: "",
                message: ""
              })
              setHoneypot('')
            }}
          >
            Send Another Message
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <EnhancedHero
        title={title}
        subtitle={subtitle}
        imageSrc={heroImageUrl}
        buttons={{
          primary: {
            text: "Send Message",
            href: "#contact-form",
          },
          secondary: {
            text: "Schedule Call",
            href: "#departments",
          },
        }}
      />

      {/* Contact Information */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Typography as="h2" variant="heading2" className="mb-4">
              {contactInfoSection.title}
            </Typography>
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              {contactInfoSection.description}
            </Typography>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfoSection.contactInfo.map((info, index) => (
              <StaggerItem key={info.title}>
                <GlassmorphismCard className="text-center p-6 h-full" hoverEffect>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center mb-4"
                  >
                    {getIconByType(info.iconType)}
                  </motion.div>
                  <Typography as="h3" variant="heading3" className="mb-3">
                    {info.title}
                  </Typography>
                  <div className="space-y-1 mb-3">
                    {info.details.map((detail, detailIndex) => (
                      <Typography key={detailIndex} as="p" variant="body" className="font-semibold">
                        {detail}
                      </Typography>
                    ))}
                  </div>
                  <Typography as="p" variant="small" className="text-gray-600 dark:text-gray-400">
                    {info.description}
                  </Typography>
                </GlassmorphismCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Typography as="h2" variant="heading2" className="mb-4">
              {departmentsSection.title}
            </Typography>
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              {departmentsSection.description}
            </Typography>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {departmentsSection.departments.map((dept, index) => (
              <StaggerItem key={dept.name}>
                <GlassmorphismCard className="p-8 h-full" hoverEffect>
                  <div className="flex items-start space-x-4 min-w-0 overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      {getIconByType(dept.iconType, "w-8 h-8 text-blue-600 dark:text-blue-400")}
                    </motion.div>
                    <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                      <Typography as="h3" variant="heading3" className="mb-2">
                        {dept.name}
                      </Typography>
                      <Typography as="p" variant="body" className="mb-3">
                        {dept.description}
                      </Typography>
                      <a 
                        href={`mailto:${dept.email}`}
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {dept.email}
                      </a>
                    </div>
                  </div>
                </GlassmorphismCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Typography as="h2" variant="heading2" className="mb-4">
              {contactFormSection.title}
            </Typography>
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              {contactFormSection.description}
            </Typography>
          </FadeIn>

          <FadeIn>
            <GlassmorphismCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium mb-2">
                      Organization
                    </label>
                    <Input
                      id="organization"
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange("organization", e.target.value)}
                      placeholder="Your organization name"
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-2">
                      Department of Interest
                    </label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger id="department" aria-label="Select department of interest">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactFormSection.departmentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Please provide details about your inquiry, including any specific requirements or questions you may have..."
                  />
                </div>

                {/* Honeypot field - hidden from users */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="fax">Fax Number</label>
                  <Input
                    id="fax"
                    name="fax"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-full w-full py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent mr-2"
                        />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {contactFormSection.submitButtonText}
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </GlassmorphismCard>
          </FadeIn>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <Typography as="h2" variant="heading2" className="mb-4">
              {officesSection.title}
            </Typography>
            <Typography as="p" variant="body" className="max-w-2xl mx-auto">
              {officesSection.description}
            </Typography>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {officesSection.offices.map((office, index) => (
              <StaggerItem key={office.city}>
                <GlassmorphismCard className="overflow-hidden h-full" hoverEffect>
                  <div className="relative h-48 w-full">
                    {office.imageUrl ? (
                      <ImageWithFallback
                        src={office.imageUrl}
                        alt={`${office.city} office`}
                        fill
                        className="object-cover"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-gray-100 dark:from-blue-900 dark:to-gray-900 flex items-center justify-center">
                        <Typography variant="body" className="text-gray-600 dark:text-gray-400 text-center">
                          {office.city} Office
                        </Typography>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <Typography as="h3" variant="heading3" className="mb-3">
                      {office.city}
                    </Typography>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1 mr-2 flex-shrink-0" />
                        <Typography as="p" variant="small">
                          {office.address}
                        </Typography>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <Typography as="p" variant="small">
                          {office.phone}
                        </Typography>
                      </div>
                      {office.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                          <Typography as="p" variant="small">
                            {office.email}
                          </Typography>
                        </div>
                      )}
                      {office.timezone && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                          <Typography as="p" variant="small">
                            {office.timezone}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassmorphismCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}