/**
 * Prompt Optimization and A/B Testing Framework
 * 
 * Features:
 * - Prompt versioning and history tracking
 * - A/B testing with statistical significance
 * - Performance metrics collection
 * - Automatic optimization based on results
 * - Multi-variant testing support
 */

import { aiService, AIRequest, AIResponse } from './ai-service-manager'
import logger from '@/lib/logging/winston-logger'

export interface PromptVariant {
  id: string
  version: string
  name: string
  prompt: string
  systemPrompt?: string
  variables?: Record<string, string>
  metadata: {
    createdAt: Date
    createdBy: string
    description: string
    tags: string[]
  }
}

export interface TestResult {
  variantId: string
  promptVersion: string
  metrics: {
    responseQuality: number // 0-10 scale
    relevance: number // 0-10 scale
    accuracy: number // 0-10 scale
    completeness: number // 0-10 scale
    readability: number // 0-10 scale
    tokensUsed: number
    latency: number
    cost: number
  }
  feedback?: {
    userRating?: number
    issues?: string[]
    suggestions?: string[]
  }
  timestamp: Date
  context?: Record<string, any>
}

export interface ABTestConfig {
  id: string
  name: string
  variants: PromptVariant[]
  trafficAllocation: Record<string, number> // variantId -> percentage
  metrics: string[]
  minSampleSize: number
  confidenceLevel: number
  status: 'draft' | 'running' | 'completed' | 'paused'
  startDate?: Date
  endDate?: Date
}

export interface TestStatistics {
  variantId: string
  sampleSize: number
  avgQuality: number
  avgRelevance: number
  avgAccuracy: number
  avgCompleteness: number
  avgReadability: number
  avgTokens: number
  avgLatency: number
  avgCost: number
  conversionRate?: number
  confidenceInterval: [number, number]
  pValue?: number
  isWinner?: boolean
}

export class PromptOptimization {
  private variants: Map<string, PromptVariant> = new Map()
  private testResults: Map<string, TestResult[]> = new Map()
  private activeTests: Map<string, ABTestConfig> = new Map()
  private versionHistory: Map<string, PromptVariant[]> = new Map()

  constructor() {
    this.initializeDefaultVariants()
  }

  /**
   * Initialize default prompt variants
   */
  private initializeDefaultVariants(): void {
    // Healthcare blog variant A - Professional tone
    this.createVariant({
      id: 'healthcare-blog-v1',
      version: '1.0.0',
      name: 'Healthcare Blog - Professional',
      prompt: `Write a comprehensive healthcare article about {{topic}}.
Focus on evidence-based information and clinical best practices.
Target audience: Healthcare professionals.
Include statistics and research findings.`,
      metadata: {
        createdAt: new Date(),
        createdBy: 'system',
        description: 'Professional tone with clinical focus',
        tags: ['healthcare', 'professional', 'clinical']
      }
    })

    // Healthcare blog variant B - Accessible tone
    this.createVariant({
      id: 'healthcare-blog-v2',
      version: '1.0.0',
      name: 'Healthcare Blog - Accessible',
      prompt: `Create an engaging healthcare article about {{topic}}.
Explain complex medical concepts in simple terms.
Balance professional credibility with readability.
Include practical examples and real-world applications.`,
      metadata: {
        createdAt: new Date(),
        createdBy: 'system',
        description: 'Accessible tone with practical focus',
        tags: ['healthcare', 'accessible', 'practical']
      }
    })
  }

  /**
   * Create a new prompt variant
   */
  createVariant(variant: PromptVariant): void {
    this.variants.set(variant.id, variant)
    
    // Track version history
    const history = this.versionHistory.get(variant.id) || []
    history.push(variant)
    this.versionHistory.set(variant.id, history)

    logger.info('Created prompt variant', {
      variantId: variant.id,
      version: variant.version,
      name: variant.name
    })
  }

  /**
   * Create an A/B test configuration
   */
  createABTest(config: Omit<ABTestConfig, 'status'>): string {
    const test: ABTestConfig = {
      ...config,
      status: 'draft',
      startDate: new Date()
    }

    this.activeTests.set(test.id, test)

    logger.info('Created A/B test', {
      testId: test.id,
      name: test.name,
      variantCount: test.variants.length
    })

    return test.id
  }

  /**
   * Run A/B test and select variant based on traffic allocation
   */
  async runABTest(
    testId: string,
    request: AIRequest,
    context?: Record<string, any>
  ): Promise<{ response: AIResponse; variantId: string; testResult: TestResult }> {
    const test = this.activeTests.get(testId)
    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    if (test.status !== 'running') {
      test.status = 'running'
      test.startDate = new Date()
    }

    // Select variant based on traffic allocation
    const variantId = this.selectVariant(test)
    const variant = this.variants.get(variantId)
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`)
    }

    // Apply variant prompt
    const processedPrompt = this.processPrompt(variant.prompt, request.prompt)
    const enhancedRequest: AIRequest = {
      ...request,
      prompt: processedPrompt,
      systemPrompt: variant.systemPrompt || request.systemPrompt
    }

    // Generate response
    const startTime = Date.now()
    const response = await aiService.generateText(enhancedRequest)
    const latency = Date.now() - startTime

    // Evaluate response quality
    const metrics = await this.evaluateResponse(response, request, variant)

    // Record test result
    const testResult: TestResult = {
      variantId,
      promptVersion: variant.version,
      metrics: {
        ...metrics,
        tokensUsed: response.tokensUsed,
        latency,
        cost: response.cost
      },
      timestamp: new Date(),
      context
    }

    this.recordTestResult(testId, testResult)

    // Check if test should be concluded
    await this.checkTestCompletion(testId)

    return { response, variantId, testResult }
  }

  /**
   * Select variant based on traffic allocation
   */
  private selectVariant(test: ABTestConfig): string {
    const random = Math.random() * 100
    let cumulative = 0

    for (const [variantId, percentage] of Object.entries(test.trafficAllocation)) {
      cumulative += percentage
      if (random <= cumulative) {
        return variantId
      }
    }

    // Fallback to first variant
    return Object.keys(test.trafficAllocation)[0]
  }

  /**
   * Process prompt with variable substitution
   */
  private processPrompt(template: string, userPrompt: string): string {
    // Extract variables from user prompt
    const variables = this.extractVariables(userPrompt)
    
    let processed = template
    for (const [key, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    // If no variables found, use the entire user prompt as topic
    if (Object.keys(variables).length === 0) {
      processed = processed.replace(/{{topic}}/g, userPrompt)
    }

    return processed
  }

  /**
   * Extract variables from user prompt
   */
  private extractVariables(prompt: string): Record<string, string> {
    const variables: Record<string, string> = {}
    
    // Try to extract topic
    const topicMatch = prompt.match(/about\s+(.+?)(?:\.|$)/i)
    if (topicMatch) {
      variables.topic = topicMatch[1]
    }

    // Try to extract other common variables
    const audienceMatch = prompt.match(/for\s+(patients|professionals|administrators)/i)
    if (audienceMatch) {
      variables.audience = audienceMatch[1]
    }

    return variables
  }

  /**
   * Evaluate response quality
   */
  private async evaluateResponse(
    response: AIResponse,
    request: AIRequest,
    variant: PromptVariant
  ): Promise<Omit<TestResult['metrics'], 'tokensUsed' | 'latency' | 'cost'>> {
    // Use AI to evaluate the response
    const evaluationPrompt = `
Evaluate this AI-generated healthcare content on multiple dimensions.
Score each dimension from 0-10.

Original Request: ${request.prompt}
Generated Response: ${response.content.substring(0, 1000)}...

Evaluate:
1. Response Quality: Overall quality and professionalism
2. Relevance: How well it addresses the request
3. Accuracy: Medical/factual accuracy
4. Completeness: Coverage of important points
5. Readability: Clarity and organization

Return JSON:
{
  "responseQuality": 0-10,
  "relevance": 0-10,
  "accuracy": 0-10,
  "completeness": 0-10,
  "readability": 0-10
}
`

    try {
      const evaluation = await aiService.generateText({
        prompt: evaluationPrompt,
        responseFormat: 'json',
        priority: 'low'
      })

      if (evaluation.structuredData) {
        return evaluation.structuredData
      }
    } catch (error) {
      logger.warn('Failed to evaluate response with AI', {
        error: (error as Error).message
      })
    }

    // Fallback to heuristic evaluation
    return this.heuristicEvaluation(response.content)
  }

  /**
   * Heuristic evaluation fallback
   */
  private heuristicEvaluation(content: string): Omit<TestResult['metrics'], 'tokensUsed' | 'latency' | 'cost'> {
    const wordCount = content.split(/\s+/).length
    const hasHeaders = /^#{1,3}\s+/m.test(content)
    const hasCitations = /\(\d{4}\)|\[\d+\]/.test(content)
    const hasLists = /^[\*\-\+]\s+/m.test(content)
    
    return {
      responseQuality: Math.min(10, 5 + (hasHeaders ? 1 : 0) + (hasCitations ? 2 : 0) + (hasLists ? 1 : 0)),
      relevance: 7, // Default as we can't determine without context
      accuracy: hasCitations ? 8 : 6,
      completeness: wordCount > 500 ? 8 : 6,
      readability: hasHeaders && hasLists ? 8 : 6
    }
  }

  /**
   * Record test result
   */
  private recordTestResult(testId: string, result: TestResult): void {
    const results = this.testResults.get(testId) || []
    results.push(result)
    this.testResults.set(testId, results)
  }

  /**
   * Check if test should be completed
   */
  private async checkTestCompletion(testId: string): Promise<void> {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'running') return

    const results = this.testResults.get(testId) || []
    const resultsByVariant = new Map<string, TestResult[]>()

    for (const result of results) {
      const variantResults = resultsByVariant.get(result.variantId) || []
      variantResults.push(result)
      resultsByVariant.set(result.variantId, variantResults)
    }

    // Check if all variants have minimum samples
    let hasMinSamples = true
    for (const variant of test.variants) {
      const variantResults = resultsByVariant.get(variant.id) || []
      if (variantResults.length < test.minSampleSize) {
        hasMinSamples = false
        break
      }
    }

    if (hasMinSamples) {
      // Calculate statistics and determine winner
      const statistics = this.calculateStatistics(testId)
      const winner = this.determineWinner(statistics, test.confidenceLevel)

      if (winner) {
        test.status = 'completed'
        test.endDate = new Date()

        logger.info('A/B test completed', {
          testId,
          winner: winner.variantId,
          sampleSize: results.length,
          improvement: `${((winner.avgQuality - 7) * 10).toFixed(1)}%`
        })

        // Auto-promote winner if configured
        await this.promoteWinner(testId, winner.variantId)
      }
    }
  }

  /**
   * Calculate test statistics
   */
  calculateStatistics(testId: string): TestStatistics[] {
    const results = this.testResults.get(testId) || []
    const test = this.activeTests.get(testId)
    if (!test) return []

    const statsByVariant = new Map<string, TestStatistics>()

    for (const variant of test.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id)
      
      if (variantResults.length === 0) continue

      const stats: TestStatistics = {
        variantId: variant.id,
        sampleSize: variantResults.length,
        avgQuality: this.average(variantResults.map(r => r.metrics.responseQuality)),
        avgRelevance: this.average(variantResults.map(r => r.metrics.relevance)),
        avgAccuracy: this.average(variantResults.map(r => r.metrics.accuracy)),
        avgCompleteness: this.average(variantResults.map(r => r.metrics.completeness)),
        avgReadability: this.average(variantResults.map(r => r.metrics.readability)),
        avgTokens: this.average(variantResults.map(r => r.metrics.tokensUsed)),
        avgLatency: this.average(variantResults.map(r => r.metrics.latency)),
        avgCost: this.average(variantResults.map(r => r.metrics.cost)),
        confidenceInterval: this.calculateConfidenceInterval(
          variantResults.map(r => r.metrics.responseQuality)
        )
      }

      statsByVariant.set(variant.id, stats)
    }

    return Array.from(statsByVariant.values())
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(values: number[]): [number, number] {
    const mean = this.average(values)
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )
    const stdError = stdDev / Math.sqrt(values.length)
    const zScore = 1.96 // 95% confidence
    
    return [
      mean - zScore * stdError,
      mean + zScore * stdError
    ]
  }

  /**
   * Determine test winner
   */
  private determineWinner(statistics: TestStatistics[], confidenceLevel: number): TestStatistics | null {
    if (statistics.length < 2) return null

    // Sort by average quality
    const sorted = statistics.sort((a, b) => b.avgQuality - a.avgQuality)
    const best = sorted[0]
    const second = sorted[1]

    // Check if difference is statistically significant
    const overlap = best.confidenceInterval[0] <= second.confidenceInterval[1]
    
    if (!overlap) {
      best.isWinner = true
      return best
    }

    return null
  }

  /**
   * Promote winning variant
   */
  private async promoteWinner(testId: string, variantId: string): Promise<void> {
    const variant = this.variants.get(variantId)
    if (!variant) return

    // Create new version as the promoted variant
    const promotedVariant: PromptVariant = {
      ...variant,
      version: this.incrementVersion(variant.version),
      metadata: {
        ...variant.metadata,
        createdAt: new Date(),
        createdBy: 'optimization-system',
        description: `Promoted winner from test ${testId}`
      }
    }

    this.createVariant(promotedVariant)

    logger.info('Promoted winning variant', {
      testId,
      variantId,
      newVersion: promotedVariant.version
    })
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.')
    const patch = parseInt(parts[2] || '0') + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }

  /**
   * Get test results summary
   */
  getTestSummary(testId: string): {
    test: ABTestConfig | undefined
    statistics: TestStatistics[]
    winner: TestStatistics | null
  } {
    const test = this.activeTests.get(testId)
    const statistics = this.calculateStatistics(testId)
    const winner = test ? this.determineWinner(statistics, test.confidenceLevel) : null

    return { test, statistics, winner }
  }

  /**
   * Export test results for analysis
   */
  exportTestResults(testId: string): {
    config: ABTestConfig | undefined
    results: TestResult[]
    statistics: TestStatistics[]
    report: string
  } {
    const test = this.activeTests.get(testId)
    const results = this.testResults.get(testId) || []
    const statistics = this.calculateStatistics(testId)

    const report = this.generateTestReport(test, results, statistics)

    return { config: test, results, statistics, report }
  }

  /**
   * Generate test report
   */
  private generateTestReport(
    test: ABTestConfig | undefined,
    results: TestResult[],
    statistics: TestStatistics[]
  ): string {
    if (!test) return 'Test not found'

    const winner = this.determineWinner(statistics, test.confidenceLevel)

    return `
A/B TEST REPORT: ${test.name}
================================

Test ID: ${test.id}
Status: ${test.status}
Start Date: ${test.startDate?.toISOString()}
End Date: ${test.endDate?.toISOString() || 'Ongoing'}
Total Samples: ${results.length}

VARIANT PERFORMANCE
-------------------
${statistics.map(stat => `
Variant: ${stat.variantId}
Samples: ${stat.sampleSize}
Quality Score: ${stat.avgQuality.toFixed(2)} [${stat.confidenceInterval[0].toFixed(2)}, ${stat.confidenceInterval[1].toFixed(2)}]
Relevance: ${stat.avgRelevance.toFixed(2)}
Accuracy: ${stat.avgAccuracy.toFixed(2)}
Completeness: ${stat.avgCompleteness.toFixed(2)}
Readability: ${stat.avgReadability.toFixed(2)}
Avg Tokens: ${stat.avgTokens.toFixed(0)}
Avg Cost: $${stat.avgCost.toFixed(4)}
${stat.isWinner ? '*** WINNER ***' : ''}
`).join('\n')}

RECOMMENDATION
--------------
${winner 
  ? `Variant ${winner.variantId} is the clear winner with ${((winner.avgQuality - 7) * 10).toFixed(1)}% improvement.`
  : 'No statistically significant winner yet. Continue testing.'}

Generated: ${new Date().toISOString()}
`
  }

  /**
   * Get best performing variant for a use case
   */
  getBestVariant(tag: string): PromptVariant | null {
    const taggedVariants = Array.from(this.variants.values())
      .filter(v => v.metadata.tags.includes(tag))

    if (taggedVariants.length === 0) return null

    // Get performance data for each variant
    const variantPerformance = taggedVariants.map(variant => {
      const allResults: TestResult[] = []
      
      for (const results of this.testResults.values()) {
        allResults.push(...results.filter(r => r.variantId === variant.id))
      }

      const avgQuality = allResults.length > 0
        ? this.average(allResults.map(r => r.metrics.responseQuality))
        : 0

      return { variant, avgQuality, sampleSize: allResults.length }
    })

    // Sort by quality, considering sample size
    variantPerformance.sort((a, b) => {
      // Require minimum samples for consideration
      if (a.sampleSize < 10) return 1
      if (b.sampleSize < 10) return -1
      return b.avgQuality - a.avgQuality
    })

    return variantPerformance[0]?.variant || null
  }
}

// Export singleton instance
export const promptOptimizer = new PromptOptimization()