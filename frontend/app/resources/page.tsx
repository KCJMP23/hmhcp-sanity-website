'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { FileText, BookOpen, Video, Download, Calendar, Users } from "lucide-react"

export default function ResourcesPage() {
  const resources = [
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: "White Papers",
      description: "In-depth research and analysis on healthcare trends and innovations",
      link: "/research/publications",
      count: "15+ Papers"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      title: "Case Studies",
      description: "Real-world success stories from our healthcare implementations",
      link: "/case-studies",
      count: "25+ Studies"
    },
    {
      icon: <Video className="w-6 h-6 text-blue-600" />,
      title: "Webinars",
      description: "Educational sessions on healthcare technology and best practices",
      link: "/webinars",
      count: "Monthly Sessions"
    },
    {
      icon: <Download className="w-6 h-6 text-blue-600" />,
      title: "Downloads",
      description: "Templates, guides, and tools for healthcare professionals",
      link: "/research/publications",
      count: "50+ Resources"
    },
    {
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      title: "Events",
      description: "Upcoming conferences, workshops, and networking events",
      link: "/events",
      count: "Upcoming Events"
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Partner Resources",
      description: "Exclusive content and tools for our healthcare partners",
      link: "/partners",
      count: "Partner Portal"
    }
  ]

  const featuredResources = [
    {
      category: "White Paper",
      title: "The Future of Clinical Research: AI and EDC Integration",
      description: "Explore how artificial intelligence is transforming electronic data capture and clinical trials.",
      date: "September 2024"
    },
    {
      category: "Case Study",
      title: "Implementing MyBC Health: A Success Story",
      description: "How a major healthcare system improved patient engagement by 300% with our platform.",
      date: "August 2024"
    },
    {
      category: "Webinar",
      title: "Quality Improvement in Healthcare: Best Practices",
      description: "Join our experts for an interactive session on implementing QA/QI programs.",
      date: "October 2024"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Healthcare Resources
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Access our comprehensive library of healthcare resources, research publications, 
              educational materials, and industry insights to stay informed and ahead.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Resource Categories</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource, index) => (
              <Link href={resource.link} key={index}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      {resource.icon}
                      <span className="text-sm text-gray-500">{resource.count}</span>
                    </div>
                    <CardTitle className="text-xl">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="px-4 py-16 md:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Resources</h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {featuredResources.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{item.description}</CardDescription>
                  <Link 
                    href="/research/publications" 
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Read More →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700">
            <CardContent className="p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Stay Updated with Healthcare Insights
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Subscribe to our newsletter for the latest resources, research, and industry updates.
              </p>
              <Link href="/newsletter">
                <LiquidGlassButton variant="white" className="px-8 py-3">
                  Subscribe Now
                </LiquidGlassButton>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}