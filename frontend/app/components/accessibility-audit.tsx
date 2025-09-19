"use client"

import { useState } from "react"
import { X, Check, AlertTriangle, Info, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FrostedCard } from "@/components/ui/global-styles"
import { Typography } from "@/components/ui/apple-typography"

type AccessibilityIssue = {
  element: string
  description: string
  severity: "error" | "warning" | "info"
  wcag?: string
  selector?: string
}

export function AccessibilityAudit() {
  const [isOpen, setIsOpen] = useState(false)
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [scanning, setScanning] = useState(false)
  const [stats, setStats] = useState({
    errors: 0,
    warnings: 0,
    info: 0,
    passed: 0,
  })

  // Run accessibility audit
  const runAudit = () => {
    setScanning(true)
    setIssues([])

    setTimeout(() => {
      const newIssues: AccessibilityIssue[] = []
      let errors = 0
      let warnings = 0
      const info = 0
      let passed = 0

      // Check for images without alt text
      document.querySelectorAll("img").forEach((img) => {
        if (!img.hasAttribute("alt")) {
          newIssues.push({
            element: "Image",
            description: "Image missing alt attribute",
            severity: "error",
            wcag: "1.1.1 Non-text Content (Level A)",
            selector: getSelector(img),
          })
          errors++
        } else {
          passed++
        }
      })

      // Check for buttons without accessible names
      document.querySelectorAll("button").forEach((button) => {
        if (!button.textContent?.trim() && !button.getAttribute("aria-label") && !button.getAttribute("title")) {
          newIssues.push({
            element: "Button",
            description: "Button has no accessible name",
            severity: "error",
            wcag: "4.1.2 Name, Role, Value (Level A)",
            selector: getSelector(button),
          })
          errors++
        } else {
          passed++
        }
      })

      // Check for links without accessible names
      document.querySelectorAll("a").forEach((link) => {
        if (!link.textContent?.trim() && !link.getAttribute("aria-label") && !link.getAttribute("title")) {
          newIssues.push({
            element: "Link",
            description: "Link has no accessible name",
            severity: "error",
            wcag: "4.1.2 Name, Role, Value (Level A)",
            selector: getSelector(link),
          })
          errors++
        } else {
          passed++
        }
      })

      // Check for form elements without labels
      document.querySelectorAll("input, select, textarea").forEach((input) => {
        const inputId = input.getAttribute("id")
        if (inputId) {
          const hasLabel = document.querySelector(`label[for="${inputId}"]`)
          if (!hasLabel && !input.getAttribute("aria-label") && !input.getAttribute("aria-labelledby")) {
            newIssues.push({
              element: input.tagName,
              description: "Form element has no associated label",
              severity: "error",
              wcag: "3.3.2 Labels or Instructions (Level A)",
              selector: getSelector(input),
            })
            errors++
          } else {
            passed++
          }
        } else if (!input.getAttribute("aria-label") && !input.getAttribute("aria-labelledby")) {
          newIssues.push({
            element: input.tagName,
            description: "Form element has no ID and no accessible name",
            severity: "error",
            wcag: "3.3.2 Labels or Instructions (Level A)",
            selector: getSelector(input),
          })
          errors++
        } else {
          passed++
        }
      })

      // Check for heading hierarchy
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      let previousLevel = 0

      headings.forEach((heading) => {
        const level = Number.parseInt(heading.tagName.substring(1))

        if (previousLevel === 0 && level !== 1) {
          newIssues.push({
            element: heading.tagName,
            description: "First heading is not an h1",
            severity: "warning",
            wcag: "1.3.1 Info and Relationships (Level A)",
            selector: getSelector(heading),
          })
          warnings++
        } else if (previousLevel > 0 && level > previousLevel + 1) {
          newIssues.push({
            element: heading.tagName,
            description: `Heading level skipped from h${previousLevel} to h${level}`,
            severity: "warning",
            wcag: "1.3.1 Info and Relationships (Level A)",
            selector: getSelector(heading),
          })
          warnings++
        } else {
          passed++
        }

        previousLevel = level
      })

      // Check for color contrast (simplified)
      document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, a, button").forEach((element) => {
        const style = window.getComputedStyle(element)
        const fontSize = Number.parseFloat(style.fontSize)
        const fontWeight = style.fontWeight

        // This is a simplified check - a real implementation would calculate actual contrast ratios
        if (
          style.color === style.backgroundColor ||
          style.color === "rgba(0, 0, 0, 0)" ||
          style.backgroundColor === "rgba(0, 0, 0, 0)"
        ) {
          newIssues.push({
            element: element.tagName,
            description: "Potential color contrast issue",
            severity: "warning",
            wcag: "1.4.3 Contrast (Minimum) (Level AA)",
            selector: getSelector(element),
          })
          warnings++
        }
      })

      // Check for ARIA attributes
      document.querySelectorAll("[aria-*]").forEach((element) => {
        // Check for valid ARIA roles
        const role = element.getAttribute("role")
        const validRoles = [
          "alert",
          "alertdialog",
          "button",
          "checkbox",
          "dialog",
          "gridcell",
          "link",
          "log",
          "marquee",
          "menuitem",
          "menuitemcheckbox",
          "menuitemradio",
          "option",
          "progressbar",
          "radio",
          "scrollbar",
          "searchbox",
          "slider",
          "spinbutton",
          "status",
          "switch",
          "tab",
          "tabpanel",
          "textbox",
          "timer",
          "tooltip",
          "treeitem",
          "combobox",
          "grid",
          "listbox",
          "menu",
          "menubar",
          "radiogroup",
          "tablist",
          "tree",
          "treegrid",
          "application",
          "article",
          "cell",
          "columnheader",
          "definition",
          "directory",
          "document",
          "feed",
          "figure",
          "group",
          "heading",
          "img",
          "list",
          "listitem",
          "math",
          "none",
          "note",
          "presentation",
          "region",
          "row",
          "rowgroup",
          "rowheader",
          "separator",
          "table",
          "term",
          "toolbar",
          "banner",
          "complementary",
          "contentinfo",
          "form",
          "main",
          "navigation",
          "region",
          "search",
        ]

        if (role && !validRoles.includes(role)) {
          newIssues.push({
            element: element.tagName,
            description: `Invalid ARIA role: ${role}`,
            severity: "error",
            wcag: "4.1.2 Name, Role, Value (Level A)",
            selector: getSelector(element),
          })
          errors++
        }

        // Check for required ARIA attributes
        if (role === "checkbox" || role === "switch") {
          if (!element.hasAttribute("aria-checked")) {
            newIssues.push({
              element: element.tagName,
              description: `Missing required aria-checked attribute for role="${role}"`,
              severity: "error",
              wcag: "4.1.2 Name, Role, Value (Level A)",
              selector: getSelector(element),
            })
            errors++
          }
        }
      })

      // Check for keyboard accessibility
      document.querySelectorAll("a, button, [role='button'], [tabindex]").forEach((element) => {
        const tabindex = element.getAttribute("tabindex")
        if (
          tabindex &&
          Number.parseInt(tabindex) < 0 &&
          element.tagName !== "DIV" &&
          !element.hasAttribute("aria-hidden")
        ) {
          newIssues.push({
            element: element.tagName,
            description: "Interactive element with negative tabindex may not be keyboard accessible",
            severity: "warning",
            wcag: "2.1.1 Keyboard (Level A)",
            selector: getSelector(element),
          })
          warnings++
        }
      })

      // Check for document language
      if (!document.documentElement.hasAttribute("lang")) {
        newIssues.push({
          element: "html",
          description: "Document language not specified",
          severity: "error",
          wcag: "3.1.1 Language of Page (Level A)",
        })
        errors++
      }

      // Check for page title
      if (!document.title || document.title.trim() === "") {
        newIssues.push({
          element: "title",
          description: "Document has no title",
          severity: "error",
          wcag: "2.4.2 Page Titled (Level A)",
        })
        errors++
      }

      // Update stats
      setStats({
        errors,
        warnings,
        info,
        passed,
      })

      // Set issues
      setIssues(newIssues)
      setScanning(false)
    }, 1000)
  }

  // Helper function to get a CSS selector for an element
  const getSelector = (element: Element): string => {
    let selector = element.tagName.toLowerCase()

    if (element.id) {
      selector += `#${element.id}`
    } else if (element.classList.length > 0) {
      selector += `.${Array.from(element.classList).join(".")}`
    }

    return selector
  }

  // Highlight element when clicked
  const highlightElement = (selector?: string) => {
    if (!selector) return

    try {
      const element = document.querySelector(selector)
      if (!element) return

      // Remove any existing highlights
      document.querySelectorAll(".a11y-highlight").forEach((el) => {
        el.classList.remove("a11y-highlight")
      })

      // Add highlight class
      element.classList.add("a11y-highlight")

      // Scroll to element
      element.scrollIntoView({ behavior: "smooth", block: "center" })

      // Remove highlight after 3 seconds
      setTimeout(() => {
        element.classList.remove("a11y-highlight")
      }, 3000)
    } catch (e) {
      console.error("Error highlighting element:", e)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-48 left-6 z-50 p-3 bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors"
        aria-label="Open accessibility audit tool"
      >
        <Check className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <FrostedCard className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <Typography variant="heading3">Accessibility Audit</Typography>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close accessibility audit tool"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={runAudit}
                      disabled={scanning}
                      className="px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {scanning ? "Scanning..." : "Run Audit"}
                    </button>
                  </div>

                  {issues.length > 0 && (
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 mr-1"></span>
                        <span>{stats.errors} Errors</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 mr-1"></span>
                        <span>{stats.warnings} Warnings</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 mr-1"></span>
                        <span>{stats.passed} Passed</span>
                      </div>
                    </div>
                  )}
                </div>

                {scanning ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : issues.length > 0 ? (
                  <div className="flex-1 overflow-auto">
                    <div className="w-full overflow-x-auto"><table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <th className="p-3 text-left">Severity</th>
                          <th className="p-3 text-left">Element</th>
                          <th className="p-3 text-left">Issue</th>
                          <th className="p-3 text-left">WCAG</th>
                          <th className="p-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map((issue, index) => (
                          <tr
                            key={index}
                            className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="p-3">
                              {issue.severity === "error" ? (
                                <span className="flex items-center text-red-500">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Error
                                </span>
                              ) : issue.severity === "warning" ? (
                                <span className="flex items-center text-blue-500">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Warning
                                </span>
                              ) : (
                                <span className="flex items-center text-blue-500">
                                  <Info className="w-4 h-4 mr-1" />
                                  Info
                                </span>
                              )}
                            </td>
                            <td className="p-3">{issue.element}</td>
                            <td className="p-3">{issue.description}</td>
                            <td className="p-3">
                              {issue.wcag && (
                                <a
                                  href={`https://www.w3.org/WAI/WCAG21/Understanding/${issue.wcag.split(" ")[0].toLowerCase()}.html`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-primary-500 hover:underline"
                                >
                                  {issue.wcag}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              )}
                            </td>
                            <td className="p-3">
                              {issue.selector && (
                                <button
                                  onClick={() => highlightElement(issue.selector)}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
                                >
                                  Highlight
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Typography variant="body" className="text-gray-500 dark:text-gray-400">
                        Run an audit to check for accessibility issues
                      </Typography>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Typography variant="label" className="mb-2 block">
                    Accessibility Resources
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                      href="https://www.w3.org/WAI/WCAG21/quickref/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Typography variant="body" className="font-medium">
                        WCAG 2.1 Quick Reference
                      </Typography>
                    </a>
                    <a
                      href="https://www.a11yproject.com/checklist/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Typography variant="body" className="font-medium">
                        A11y Project Checklist
                      </Typography>
                    </a>
                    <a
                      href="https://webaim.org/resources/contrastchecker/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Typography variant="body" className="font-medium">
                        WebAIM Contrast Checker
                      </Typography>
                    </a>
                  </div>
                </div>
              </FrostedCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}
