'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Home, FileText, Package, Phone, LogOut } from 'lucide-react'

interface FlowNode {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  visitors: number
  percentage: number
}

interface FlowConnection {
  from: string
  to: string
  visitors: number
  percentage: number
}

interface VisitorFlowChartProps {
  nodes?: FlowNode[]
  connections?: FlowConnection[]
  title?: string
  description?: string
}

export function VisitorFlowChart({
  nodes,
  connections,
  title = "Visitor Flow Analysis",
  description = "Track how visitors navigate through your site"
}: VisitorFlowChartProps) {
  // Default data if none provided
  const defaultNodes: FlowNode[] = [
    { id: 'home', name: 'Homepage', icon: Home, visitors: 10000, percentage: 100 },
    { id: 'services', name: 'Services', icon: FileText, visitors: 4500, percentage: 45 },
    { id: 'platforms', name: 'Platforms', icon: Package, visitors: 3200, percentage: 32 },
    { id: 'contact', name: 'Contact', icon: Phone, visitors: 2100, percentage: 21 },
    { id: 'exit', name: 'Exit', icon: LogOut, visitors: 5200, percentage: 52 }
  ]

  const defaultConnections: FlowConnection[] = [
    { from: 'home', to: 'services', visitors: 4500, percentage: 45 },
    { from: 'home', to: 'platforms', visitors: 3200, percentage: 32 },
    { from: 'home', to: 'exit', visitors: 2300, percentage: 23 },
    { from: 'services', to: 'contact', visitors: 1200, percentage: 27 },
    { from: 'services', to: 'platforms', visitors: 800, percentage: 18 },
    { from: 'services', to: 'exit', visitors: 2500, percentage: 55 },
    { from: 'platforms', to: 'contact', visitors: 900, percentage: 28 },
    { from: 'platforms', to: 'exit', visitors: 2300, percentage: 72 },
    { from: 'contact', to: 'exit', visitors: 2100, percentage: 100 }
  ]

  const flowNodes = nodes || defaultNodes
  const flowConnections = connections || defaultConnections

  // Get connections for a specific node
  const getNodeConnections = (nodeId: string) => {
    return flowConnections.filter(conn => conn.from === nodeId)
  }

  // Get color based on percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 40) return 'text-green-600 dark:text-blue-400'
    if (percentage >= 20) return 'text-yellow-600 dark:text-blue-400'
    return 'text-red-600 dark:text-blue-400'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Flow visualization */}
          <div className="relative">
            {/* Entry point */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <div className="w-2 h-2 bg-green-500" />
                Entry Point
              </div>
              {flowNodes.filter(node => node.id === 'home').map(node => {
                const Icon = node.icon
                const connections = getNodeConnections(node.id)
                
                return (
                  <div key={node.id} className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border bg-blue-50 dark:bg-blue-950">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-medium">{node.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {node.visitors.toLocaleString()} visitors
                        </p>
                      </div>
                      <Badge>{node.percentage}%</Badge>
                    </div>

                    {/* Connections from this node */}
                    {connections.length > 0 && (
                      <div className="ml-8 space-y-3">
                        {connections.map((conn, idx) => {
                          const targetNode = flowNodes.find(n => n.id === conn.to)
                          if (!targetNode) return null
                          const TargetIcon = targetNode.icon

                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 flex items-center gap-3 p-3 border">
                                <TargetIcon className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{targetNode.name}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {conn.visitors.toLocaleString()} visitors
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={getPercentageColor(conn.percentage)}
                                >
                                  {conn.percentage}%
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Secondary pages */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-yellow-500" />
                Secondary Pages
              </div>
              {flowNodes.filter(node => ['services', 'platforms'].includes(node.id)).map(node => {
                const Icon = node.icon
                const connections = getNodeConnections(node.id)
                
                return (
                  <div key={node.id} className="space-y-3">
                    <div className="flex items-center gap-4 p-4 border">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-medium">{node.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {node.visitors.toLocaleString()} visitors ({node.percentage}%)
                        </p>
                      </div>
                    </div>

                    {/* Outgoing connections */}
                    {connections.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {connections.map((conn, idx) => {
                          const targetNode = flowNodes.find(n => n.id === conn.to)
                          if (!targetNode) return null

                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span>{targetNode.name}:</span>
                              <span className={getPercentageColor(conn.percentage)}>
                                {conn.percentage}% ({conn.visitors.toLocaleString()})
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Exit analysis */}
            <div className="mt-8 p-4 border bg-red-50 dark:bg-blue-950">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <div className="w-2 h-2 bg-red-500" />
                Exit Points
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {flowConnections.filter(conn => conn.to === 'exit').map((conn, idx) => {
                  const sourceNode = flowNodes.find(n => n.id === conn.from)
                  if (!sourceNode) return null

                  return (
                    <div key={idx} className="text-center">
                      <p className="text-sm font-medium">{sourceNode.name}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {conn.percentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conn.visitors.toLocaleString()} exits
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Key insights */}
          <div className="space-y-3 pt-6 border-t">
            <h4 className="font-medium text-sm">Key Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                <span>55% of visitors exit from the Services page - consider improving content engagement</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                <span>Only 21% of visitors reach the Contact page - optimize conversion paths</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                <span>Strong flow from Services to Contact (27%) indicates good intent signals</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}