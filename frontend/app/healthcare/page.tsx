'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button"
import Link from "next/link"
import { Heart, Activity, Users, Shield, TrendingUp, Database } from "lucide-react"

export default function HealthcarePage() {
  const solutions = [
    {
      icon: <Heart className="w-8 h-8 text-blue-600" />,
      title: "Patient-Centered Care",
      description: "Innovative solutions that put patient outcomes first, leveraging data-driven insights to improve care quality and experience."
    },
    {
      icon: <Activity className="w-8 h-8 text-blue-600" />,
      title: "Clinical Research",
      description: "Accelerate clinical trials with our integrated EDC platform and comprehensive research management tools."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Population Health",
      description: "Advanced analytics and predictive modeling to improve health outcomes across patient populations."
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Quality & Safety",
      description: "Comprehensive quality improvement programs and patient safety initiatives backed by real-world data."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "Performance Analytics",
      description: "Real-time dashboards and KPIs to monitor and improve healthcare delivery performance."
    },
    {
      icon: <Database className="w-8 h-8 text-blue-600" />,
      title: "Data Integration",
      description: "Seamless integration with EHR systems and healthcare data platforms for unified insights."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Healthcare Solutions
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Transforming healthcare delivery through innovative technology, data-driven insights, 
              and evidence-based practices to improve patient outcomes and operational excellence.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/contact">
                <LiquidGlassButton className="px-8 py-3">
                  Get Started
                </LiquidGlassButton>
              </Link>
              <Link 
                href="/platforms" 
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600"
              >
                View Our Platforms <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{solution.icon}</div>
                  <CardTitle>{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700">
            <CardContent className="p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Healthcare Delivery?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Partner with us to implement innovative healthcare solutions that drive measurable outcomes.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/contact">
                  <LiquidGlassButton variant="white" className="px-8 py-3">
                    Schedule Consultation
                  </LiquidGlassButton>
                </Link>
                <Link 
                  href="/research/clinical-studies"
                  className="inline-flex items-center px-8 py-3 text-white border-2 border-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  View Case Studies
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}