"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface BrowserResult {
  browser: string
  version: string
  status: "pass" | "fail" | "warning" | "pending"
  details: string
}

export function CrossBrowserTestingReport() {
  const [browserResults, setBrowserResults] = useState<BrowserResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      setIsLoading(true)

      // Simulate test process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Sample test results - in a real implementation, these would come from actual tests
      const results: BrowserResult[] = [
        {
          browser: "Chrome",
          version: "120+",
          status: "pass",
          details: "All features work correctly",
        },
        {
          browser: "Safari",
          version: "17+",
          status: "warning",
          details: "Some backdrop-filter effects may have reduced performance",
        },
        {
          browser: "Firefox",
          version: "120+",
          status: "pass",
          details: "All features work correctly",
        },
        {
          browser: "Edge",
          version: "120+",
          status: "pass",
          details: "All features work correctly",
        },
        {
          browser: "Chrome Mobile",
          version: "120+",
          status: "pass",
          details: "All features work correctly",
        },
        {
          browser: "Safari iOS",
          version: "17+",
          status: "warning",
          details: "Some animations may be choppy on older devices",
        },
      ]

      setBrowserResults(results)
      setIsLoading(false)
    }

    runTests()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light tracking-tight">Cross-Browser Testing Report</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Browser Compatibility Results</h3>
            <div className="space-y-4">
              {browserResults.map((result, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {result.browser} {result.version}
                    </h4>
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
              <li>Optimize backdrop-filter effects for Safari</li>
              <li>Test on older iOS devices to verify animation performance</li>
              <li>Ensure responsive design works on all browser sizes</li>
              <li>Verify dark mode functionality across all browsers</li>
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
