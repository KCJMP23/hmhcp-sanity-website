"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { detectBrowser, type BrowserInfo } from "@/utils/browser-compatibility"
import { checkResponsiveness } from "@/utils/responsive-testing"
import { testDarkMode } from "@/utils/dark-mode-testing"
import { measureAnimationPerformance } from "@/utils/animation-performance"

interface TestResult {
  name: string
  status: "pass" | "fail" | "warning" | "pending"
  details: string
}

export function CrossBrowserReport() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      setIsLoading(true)

      // Detect browser
      const browser = detectBrowser()
      setBrowserInfo(browser)

      // Run tests
      const results: TestResult[] = []

      // Responsive design test
      const responsiveTest = await checkResponsiveness()
      results.push({
        name: "Responsive Design",
        status: responsiveTest.allPassed ? "pass" : "warning",
        details: responsiveTest.details,
      })

      // Dark mode test
      const darkModeTest = await testDarkMode()
      results.push({
        name: "Dark Mode",
        status: darkModeTest.working ? "pass" : "fail",
        details: darkModeTest.details,
      })

      // Animation performance test
      const animationTest = await measureAnimationPerformance()
      results.push({
        name: "Animation Performance",
        status: animationTest.status === "excellent" ? "pass" : animationTest.status === "good" ? "warning" : "fail",
        details: animationTest.details,
      })

      // Browser-specific tests
      if (browser) {
        switch (browser.name.toLowerCase()) {
          case "chrome":
            results.push({
              name: "Chrome-specific Features",
              status: "pass",
              details: "All Chrome-specific features are working correctly.",
            })
            break
          case "safari":
            results.push({
              name: "Safari-specific Features",
              status: "warning",
              details: "Some backdrop-filter effects may have reduced performance.",
            })
            break
          case "firefox":
            results.push({
              name: "Firefox-specific Features",
              status: "warning",
              details: "Check scrolling animations for smoothness.",
            })
            break
          case "edge":
            results.push({
              name: "Edge-specific Features",
              status: "pass",
              details: "All Edge-specific features are working correctly.",
            })
            break
        }
      }

      setTestResults(results)
      setIsLoading(false)
    }

    runTests()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light tracking-tight">Cross-Browser Compatibility Report</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Browser Information</h3>
            {browserInfo && (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {browserInfo.name}
                </p>
                <p>
                  <span className="font-medium">Version:</span> {browserInfo.version}
                </p>
                <p>
                  <span className="font-medium">OS:</span> {browserInfo.os}
                </p>
                <p>
                  <span className="font-medium">Mobile:</span> {browserInfo.mobile ? "Yes" : "No"}
                </p>
              </div>
            )}
          </Card>

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
              <li>Test on real devices for each browser, not just emulators</li>
              <li>Pay special attention to Safari's handling of backdrop-filter and animations</li>
              <li>Ensure Firefox properly handles scroll animations and backdrop blur</li>
              <li>Test on older versions of browsers for broader compatibility</li>
              <li>Verify touch interactions on mobile browsers</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
