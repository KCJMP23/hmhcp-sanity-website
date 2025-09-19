import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { PubSub } from 'graphql-subscriptions'
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLFloat, GraphQLList } from 'graphql'
import { supabase } from '@/lib/supabase/client'
import { webhookTracer } from '@/lib/observability/tracing'

// PubSub instance for managing subscriptions
export const pubsub = new PubSub()

// Subscription topics
export const WEBHOOK_TOPICS = {
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED: 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED: 'WEBHOOK_FAILED',
  WEBHOOK_RETRYING: 'WEBHOOK_RETRYING',
  BLOG_POST_CREATED: 'BLOG_POST_CREATED',
  BLOG_POST_UPDATED: 'BLOG_POST_UPDATED',
  API_KEY_USED: 'API_KEY_USED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

// GraphQL Types
const WebhookEventType = new GraphQLObjectType({
  name: 'WebhookEvent',
  fields: {
    id: { type: GraphQLString },
    type: { type: GraphQLString },
    source: { type: GraphQLString },
    timestamp: { type: GraphQLString },
    status: { type: GraphQLString },
    apiKeyId: { type: GraphQLString },
    endpoint: { type: GraphQLString },
    method: { type: GraphQLString },
    payload: { type: GraphQLString }, // JSON string
    metadata: { type: GraphQLString }, // JSON string
  },
})

const BlogPostEventType = new GraphQLObjectType({
  name: 'BlogPostEvent',
  fields: {
    id: { type: GraphQLString },
    eventType: { type: GraphQLString },
    postId: { type: GraphQLString },
    title: { type: GraphQLString },
    slug: { type: GraphQLString },
    author: { type: GraphQLString },
    source: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
})

const RateLimitEventType = new GraphQLObjectType({
  name: 'RateLimitEvent',
  fields: {
    apiKeyId: { type: GraphQLString },
    endpoint: { type: GraphQLString },
    currentUsage: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    resetAt: { type: GraphQLString },
    blocked: { type: GraphQLBoolean },
  },
})

const RetryEventType = new GraphQLObjectType({
  name: 'RetryEvent',
  fields: {
    jobId: { type: GraphQLString },
    webhookLogId: { type: GraphQLString },
    endpoint: { type: GraphQLString },
    attempt: { type: GraphQLInt },
    maxAttempts: { type: GraphQLInt },
    nextRetryAt: { type: GraphQLString },
    lastError: { type: GraphQLString },
    status: { type: GraphQLString },
  },
})

const WebhookStatisticsType = new GraphQLObjectType({
  name: 'WebhookStatistics',
  fields: {
    totalReceived: { type: GraphQLInt },
    totalProcessed: { type: GraphQLInt },
    totalFailed: { type: GraphQLInt },
    totalRetrying: { type: GraphQLInt },
    averageProcessingTime: { type: GraphQLFloat },
    successRate: { type: GraphQLFloat },
    activeApiKeys: { type: GraphQLInt },
    timestamp: { type: GraphQLString },
  },
})

// Root Query Type (required even for subscription-only schema)
const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    health: {
      type: GraphQLString,
      resolve: () => 'GraphQL Subscriptions Server is running',
    },
    webhookStatistics: {
      type: WebhookStatisticsType,
      resolve: async () => {
        try {
          // Fetch statistics from database
          const { data: logs } = await supabase
            .from('webhook_logs')
            .select('success, processing_time_ms')
            .gte('created_at', new Date(Date.now() - 86400000).toISOString()) // Last 24 hours

          if (!logs) return null

          const totalReceived = logs.length
          const totalProcessed = logs.filter(l => l.success).length
          const totalFailed = logs.filter(l => !l.success).length
          
          const { data: retrying } = await supabase
            .from('webhook_retry_queue')
            .select('id')
            .is('completed_at', null)

          const totalRetrying = retrying?.length || 0
          
          const avgProcessingTime = logs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / logs.length || 0
          const successRate = totalReceived > 0 ? (totalProcessed / totalReceived) * 100 : 0

          const { data: activeKeys } = await supabase
            .from('api_keys')
            .select('id')
            .eq('is_active', true)

          return {
            totalReceived,
            totalProcessed,
            totalFailed,
            totalRetrying,
            averageProcessingTime: avgProcessingTime,
            successRate,
            activeApiKeys: activeKeys?.length || 0,
            timestamp: new Date().toISOString(),
          }
        } catch (error) {
          console.error('Error fetching webhook statistics:', error)
          return null
        }
      },
    },
  },
})

// Root Subscription Type
const RootSubscriptionType = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    webhookReceived: {
      type: WebhookEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.WEBHOOK_RECEIVED]),
    },
    webhookProcessed: {
      type: WebhookEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.WEBHOOK_PROCESSED]),
    },
    webhookFailed: {
      type: WebhookEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.WEBHOOK_FAILED]),
    },
    webhookRetrying: {
      type: RetryEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.WEBHOOK_RETRYING]),
    },
    blogPostCreated: {
      type: BlogPostEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.BLOG_POST_CREATED]),
    },
    blogPostUpdated: {
      type: BlogPostEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.BLOG_POST_UPDATED]),
    },
    rateLimitExceeded: {
      type: RateLimitEventType,
      subscribe: () => pubsub.asyncIterator([WEBHOOK_TOPICS.RATE_LIMIT_EXCEEDED]),
    },
    allWebhookEvents: {
      type: WebhookEventType,
      subscribe: () => pubsub.asyncIterator([
        WEBHOOK_TOPICS.WEBHOOK_RECEIVED,
        WEBHOOK_TOPICS.WEBHOOK_PROCESSED,
        WEBHOOK_TOPICS.WEBHOOK_FAILED,
      ]),
    },
    webhookStatisticsUpdates: {
      type: WebhookStatisticsType,
      subscribe: async function* () {
        // Emit statistics every 30 seconds
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 30000))
          
          const { data: logs } = await supabase
            .from('webhook_logs')
            .select('success, processing_time_ms')
            .gte('created_at', new Date(Date.now() - 86400000).toISOString())

          if (!logs) continue

          const stats = {
            totalReceived: logs.length,
            totalProcessed: logs.filter(l => l.success).length,
            totalFailed: logs.filter(l => !l.success).length,
            totalRetrying: 0, // Would need separate query
            averageProcessingTime: logs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / logs.length || 0,
            successRate: logs.length > 0 ? (logs.filter(l => l.success).length / logs.length) * 100 : 0,
            activeApiKeys: 0, // Would need separate query
            timestamp: new Date().toISOString(),
          }

          yield { webhookStatisticsUpdates: stats }
        }
      },
    },
  },
})

// Create GraphQL Schema
export const graphqlSchema = new GraphQLSchema({
  query: RootQueryType,
  subscription: RootSubscriptionType,
})

// Event Publishing Functions
export async function publishWebhookReceived(data: {
  id: string
  source: string
  endpoint: string
  method: string
  apiKeyId?: string
  payload: any
}) {
  await webhookTracer.traceWebhookProcessing(
    data.id,
    'subscription-publish',
    async () => {
      await pubsub.publish(WEBHOOK_TOPICS.WEBHOOK_RECEIVED, {
        webhookReceived: {
          id: data.id,
          type: 'received',
          source: data.source,
          timestamp: new Date().toISOString(),
          status: 'received',
          apiKeyId: data.apiKeyId,
          endpoint: data.endpoint,
          method: data.method,
          payload: JSON.stringify(data.payload),
          metadata: JSON.stringify({ receivedAt: new Date().toISOString() }),
        },
      })
    }
  )
}

export async function publishWebhookProcessed(data: {
  id: string
  source: string
  endpoint: string
  postId?: string
  processingTimeMs: number
}) {
  await pubsub.publish(WEBHOOK_TOPICS.WEBHOOK_PROCESSED, {
    webhookProcessed: {
      id: data.id,
      type: 'processed',
      source: data.source,
      timestamp: new Date().toISOString(),
      status: 'success',
      endpoint: data.endpoint,
      metadata: JSON.stringify({
        postId: data.postId,
        processingTimeMs: data.processingTimeMs,
      }),
    },
  })
}

export async function publishWebhookFailed(data: {
  id: string
  source: string
  endpoint: string
  error: string
}) {
  await pubsub.publish(WEBHOOK_TOPICS.WEBHOOK_FAILED, {
    webhookFailed: {
      id: data.id,
      type: 'failed',
      source: data.source,
      timestamp: new Date().toISOString(),
      status: 'failed',
      endpoint: data.endpoint,
      metadata: JSON.stringify({ error: data.error }),
    },
  })
}

export async function publishWebhookRetrying(data: {
  jobId: string
  webhookLogId: string
  endpoint: string
  attempt: number
  maxAttempts: number
  nextRetryAt: Date
  lastError: string
}) {
  await pubsub.publish(WEBHOOK_TOPICS.WEBHOOK_RETRYING, {
    webhookRetrying: {
      jobId: data.jobId,
      webhookLogId: data.webhookLogId,
      endpoint: data.endpoint,
      attempt: data.attempt,
      maxAttempts: data.maxAttempts,
      nextRetryAt: data.nextRetryAt.toISOString(),
      lastError: data.lastError,
      status: 'retrying',
    },
  })
}

export async function publishBlogPostCreated(data: {
  postId: string
  title: string
  slug: string
  author: string
  source: string
}) {
  await pubsub.publish(WEBHOOK_TOPICS.BLOG_POST_CREATED, {
    blogPostCreated: {
      id: `event_${Date.now()}`,
      eventType: 'created',
      postId: data.postId,
      title: data.title,
      slug: data.slug,
      author: data.author,
      source: data.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  })
}

export async function publishRateLimitExceeded(data: {
  apiKeyId: string
  endpoint: string
  currentUsage: number
  limit: number
  resetAt: Date
}) {
  await pubsub.publish(WEBHOOK_TOPICS.RATE_LIMIT_EXCEEDED, {
    rateLimitExceeded: {
      apiKeyId: data.apiKeyId,
      endpoint: data.endpoint,
      currentUsage: data.currentUsage,
      limit: data.limit,
      resetAt: data.resetAt.toISOString(),
      blocked: true,
    },
  })
}

// WebSocket Server Setup
let wsServer: WebSocketServer | null = null

export function initializeGraphQLSubscriptions(httpServer: any, path: string = '/graphql') {
  if (wsServer) {
    console.log('GraphQL WebSocket server already initialized')
    return wsServer
  }

  wsServer = new WebSocketServer({
    server: httpServer,
    path,
  })

  const serverCleanup = useServer(
    {
      schema: graphqlSchema,
      onConnect: async (ctx) => {
        console.log('Client connected to GraphQL subscriptions')
        
        // Optional: Add authentication here
        // const token = ctx.connectionParams?.authorization
        // if (!token || !validateToken(token)) {
        //   throw new Error('Unauthorized')
        // }
        
        return true
      },
      onDisconnect: () => {
        console.log('Client disconnected from GraphQL subscriptions')
      },
      onSubscribe: async (ctx, msg) => {
        console.log(`Subscription started: ${msg.payload.operationName || 'unnamed'}`)
      },
      onComplete: async (ctx, msg) => {
        console.log(`Subscription completed: ${msg.id}`)
      },
    },
    wsServer
  )

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await serverCleanup.dispose()
    wsServer?.close()
  })

  console.log(`GraphQL WebSocket server initialized at ws://localhost:${process.env.PORT || 3001}${path}`)
  
  return wsServer
}

// Subscription Manager for managing active subscriptions
export class SubscriptionManager {
  private static instance: SubscriptionManager
  private activeSubscriptions: Map<string, any> = new Map()

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager()
    }
    return SubscriptionManager.instance
  }

  addSubscription(id: string, subscription: any) {
    this.activeSubscriptions.set(id, subscription)
  }

  removeSubscription(id: string) {
    this.activeSubscriptions.delete(id)
  }

  getActiveCount(): number {
    return this.activeSubscriptions.size
  }

  getSubscriptionInfo(): Array<{ id: string; type: string }> {
    return Array.from(this.activeSubscriptions.entries()).map(([id, sub]) => ({
      id,
      type: sub.type || 'unknown',
    }))
  }
}

export const subscriptionManager = SubscriptionManager.getInstance()

// Example usage in a Next.js API route or custom server
export function setupGraphQLSubscriptionServer() {
  const httpServer = createServer()
  
  initializeGraphQLSubscriptions(httpServer, '/api/graphql-ws')
  
  const port = parseInt(process.env.GRAPHQL_WS_PORT || '4000', 10)
  httpServer.listen(port, () => {
    console.log(`GraphQL subscription server running on port ${port}`)
  })
  
  return httpServer
}