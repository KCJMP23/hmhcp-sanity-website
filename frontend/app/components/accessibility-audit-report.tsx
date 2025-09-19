"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AuditResult {
  category: string
  criteria: string
  status: "pass" | "fail" | "warning" | "manual"
  details: string
  impact: "critical" | "serious" | "moderate" | "minor"
}

export function AccessibilityAuditReport() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState({
    pass: 0,
    fail: 0,
    warning: 0,
    manual: 0,
    total: 0,
    score: 0,
  })

  useEffect(() => {
    const runAudit = async () => {
      setIsLoading(true)

      // Simulate audit process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Sample audit results - in a real implementation, these would come from actual tests
      const results: AuditResult[] = [
        {
          category: "Perceivable",
          criteria: "1.1.1 Non-text Content (Level A)",
          status: "pass",
          details: "All images have appropriate alt text",
          impact: "critical",
        },
        {
          category: "Perceivable",
          criteria: "1.4.3 Contrast (Minimum) (Level AA)",
          status: "pass",
          details: "Text contrast meets WCAG AA requirements",
          impact: "serious",
        },
        {
          category: "Operable",
          criteria: "2.1.1 Keyboard (Level A)",
          status: "pass",
          details: "All functionality is operable through a keyboard interface",
          impact: "critical",
        },
        {
          category: "Operable",
          criteria: "2.4.3 Focus Order (Level A)",
          status: "warning",
          details: "Some focus order issues in the platform showcase section",
          impact: "moderate",
        },
        {
          category: "Understandable",
          criteria: "3.1.1 Language of Page (Level A)",
          status: "pass",
          details: "Page language is properly set",
          impact: "moderate",
        },
        {
          category: "Understandable",
          criteria: "3.3.2 Labels or Instructions (Level A)",
          status: "pass",
          details: "All form fields have proper labels",
          impact: "serious",
        },
        {
          category: "Robust",
          criteria: "4.1.1 Parsing (Level A)",
          status: "pass",
          details: "HTML is properly nested and formatted",
          impact: "moderate",
        },
        {
          category: "Robust",
          criteria: "4.1.2 Name, Role, Value (Level A)",
          status: "warning",
          details: "Some ARIA attributes need review in interactive components",
          impact: "serious",
        },
      ]

      // Calculate summary
      const passCount = results.filter((r) => r.status === "pass").length
      const failCount = results.filter((r) => r.status === "fail").length
      const warningCount = results.filter((r) => r.status === "warning").length
      const manualCount = results.filter((r) => r.status === "manual").length
      const totalCount = results.length

      // Calculate score (simplified)
      const score = Math.round((passCount / totalCount) * 100)

      setSummary({
        pass: passCount,
        fail: failCount,
        warning: warningCount,
        manual: manualCount,
        total: totalCount,
        score: score,
      })

      setAuditResults(results)
      setIsLoading(false)
    }

    runAudit()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light tracking-tight">Accessibility Audit Report</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{summary.pass}</div>
                <div className="text-sm text-blue-600 dark:text-blue-300">Pass</div>
              </div>
              <div className="bg-red-100 dark:bg-blue-900 p-4 text-center">
                <div className="text-3xl font-bold text-red-700 dark:text-blue-300">{summary.fail}</div>
                <div className="text-sm text-red-700 dark:text-blue-300">Fail</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-4 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.warning}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Warning</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-4 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.manual}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Manual</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-4 text-center">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.score}%</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Score</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Audit Results</h3>
            <div className="space-y-4">
              {auditResults.map((result, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.criteria}</h4>
                    <span
                      className={`px-3 py-1  text-sm ${
                        result.status === "pass"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                          : result.status === "warning"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : result.status === "fail"
                              ? "bg-red-100 text-red-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {result.category} • Impact: {result.impact}
                  </div>
                  <p className="text-sm mt-2">{result.details}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-lg bg-white/80 dark:bg-black/80">
            <h3 className="text-xl font-medium mb-4">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Review focus order in the platform showcase section</li>
              <li>Audit ARIA attributes in interactive components</li>
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
