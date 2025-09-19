"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning" | "pending"
  details: string
}

export function AccessibilityTestingReport() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      setIsLoading(true)

      // Simulate test process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Sample test results - in a real implementation, these would come from actual tests
      const results: TestResult[] = [
        {
          name: "Screen Reader Compatibility",
          status: "pass",
          details: "All content is properly announced by screen readers",
        },
        {
          name: "Keyboard Navigation",
          status: "pass",
          details: "All interactive elements are accessible via keyboard",
        },
        {
          name: "Color Contrast",
          status: "pass",
          details: "All text meets WCAG AA contrast requirements",
        },
        {
          name: "Focus Indicators",
          status: "pass",
          details: "All interactive elements have visible focus indicators",
        },
        {
          name: "Alternative Text",
          status: "pass",
          details: "All images have appropriate alternative text",
        },
        {
          name: "ARIA Attributes",
          status: "warning",
          details: "Some ARIA attributes need review in interactive components",
        },
        {
          name: "Form Labels",
          status: "pass",
          details: "All form fields have proper labels",
        },
        {
          name: "Heading Structure",
          status: "pass",
          details: "Headings are properly nested and structured",
        },
      ]

      setTestResults(results)
      setIsLoading(false)
    }

    runTests()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light tracking-tight">Accessibility Testing Report</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Test Results</h3>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.name}</h4>
                    <span
                      className={`px-3 py-1  text-sm ${
                        result.status === "pass"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                          : result.status === "warning"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : result.status === "fail"
                              ? "bg-red-100 text-red-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.details}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Review ARIA attributes in interactive components</li>
              <li>Test with multiple screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Verify keyboard navigation throughout the site</li>
              <li>Ensure all animations can be disabled for users with vestibular disorders</li>
            </ul>

            <div className="mt-6">
              <Button className="mr-4">Generate Full Report</Button>
              <Button variant="outline">Export Results</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
