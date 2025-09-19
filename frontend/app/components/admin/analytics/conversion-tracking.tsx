'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  Target,
  TrendingUp,
  DollarSign,
  MousePointer,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface Goal {
  id: string
  name: string
  type: 'page_view' | 'event' | 'form_submission' | 'button_click'
  target_value: string
  target_count: number
  value: number
  is_active: boolean
  completions?: number
  conversion_rate?: number
}

export function ConversionTracking() {
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    type: 'page_view',
    target_value: '',
    target_count: 1,
    value: 0,
    is_active: true
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const response = await fetch('/api/admin/analytics/goals')
      if (!response.ok) throw new Error('Failed to load goals')
      
      const data = await response.json()
      setGoals(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversion goals',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGoal = async () => {
    const goalToSave = editingGoal || newGoal
    
    try {
      const response = await fetch('/api/admin/analytics/goals', {
        method: editingGoal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalToSave)
      })

      if (!response.ok) throw new Error('Failed to save goal')

      toast({
        title: 'Success',
        description: `Goal ${editingGoal ? 'updated' : 'created'} successfully`
      })

      loadGoals()
      setIsAddingGoal(false)
      setEditingGoal(null)
      setNewGoal({
        name: '',
        type: 'page_view',
        target_value: '',
        target_count: 1,
        value: 0,
        is_active: true
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save goal',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`/api/admin/analytics/goals/${goalId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete goal')

      toast({
        title: 'Success',
        description: 'Goal deleted successfully'
      })

      loadGoals()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive'
      })
    }
  }

  const handleToggleGoal = async (goal: Goal) => {
    try {
      const response = await fetch('/api/admin/analytics/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, is_active: !goal.is_active })
      })

      if (!response.ok) throw new Error('Failed to update goal')

      loadGoals()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update goal status',
        variant: 'destructive'
      })
    }
  }

  const getGoalIcon = (type: Goal['type']) => {
    switch (type) {
      case 'page_view':
        return <FileText className="h-4 w-4" />
      case 'event':
        return <MousePointer className="h-4 w-4" />
      case 'form_submission':
        return <Send className="h-4 w-4" />
      case 'button_click':
        return <MousePointer className="h-4 w-4" />
    }
  }

  const conversionData = [
    { month: 'Jan', conversions: 120, value: 12000 },
    { month: 'Feb', conversions: 150, value: 15000 },
    { month: 'Mar', conversions: 180, value: 18000 },
    { month: 'Apr', conversions: 165, value: 16500 },
    { month: 'May', conversions: 200, value: 20000 },
    { month: 'Jun', conversions: 220, value: 22000 }
  ]

  const goalPerformance = goals.map(goal => ({
    name: goal.name,
    completions: goal.completions || Math.floor(Math.random() * 100),
    value: goal.value * (goal.completions || Math.floor(Math.random() * 100))
  }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,235</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-600" />
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry average: 2.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$123,500</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average: $100 per conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter(g => g.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {goals.filter(g => !g.is_active).length} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Trends</CardTitle>
          <CardDescription>Monthly conversions and value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversions"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Conversions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Value ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Goal Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversion Goals</CardTitle>
              <CardDescription>Track and manage your conversion goals</CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingGoal(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(isAddingGoal || editingGoal) && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input
                    id="goal-name"
                    value={(editingGoal || newGoal).name}
                    onChange={(e) => {
                      const update = { name: e.target.value }
                      if (editingGoal) {
                        setEditingGoal({ ...editingGoal, ...update })
                      } else {
                        setNewGoal({ ...newGoal, ...update })
                      }
                    }}
                    placeholder="e.g., Newsletter Signup"
                  />
                </div>

                <div>
                  <Label htmlFor="goal-type">Goal Type</Label>
                  <Select
                    value={(editingGoal || newGoal).type}
                    onValueChange={(value: Goal['type']) => {
                      const update = { type: value }
                      if (editingGoal) {
                        setEditingGoal({ ...editingGoal, ...update })
                      } else {
                        setNewGoal({ ...newGoal, ...update })
                      }
                    }}
                  >
                    <SelectTrigger id="goal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page_view">Page View</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="form_submission">Form Submission</SelectItem>
                      <SelectItem value="button_click">Button Click</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-value">Target Value</Label>
                  <Input
                    id="target-value"
                    value={(editingGoal || newGoal).target_value}
                    onChange={(e) => {
                      const update = { target_value: e.target.value }
                      if (editingGoal) {
                        setEditingGoal({ ...editingGoal, ...update })
                      } else {
                        setNewGoal({ ...newGoal, ...update })
                      }
                    }}
                    placeholder="e.g., /thank-you or form_id"
                  />
                </div>

                <div>
                  <Label htmlFor="goal-value">Goal Value ($)</Label>
                  <Input
                    id="goal-value"
                    type="number"
                    value={(editingGoal || newGoal).value}
                    onChange={(e) => {
                      const update = { value: parseFloat(e.target.value) || 0 }
                      if (editingGoal) {
                        setEditingGoal({ ...editingGoal, ...update })
                      } else {
                        setNewGoal({ ...newGoal, ...update })
                      }
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingGoal(false)
                    setEditingGoal(null)
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveGoal}>
                  {editingGoal ? 'Update' : 'Create'} Goal
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-md ${
                    goal.is_active ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getGoalIcon(goal.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{goal.name}</h4>
                      <Badge variant={goal.is_active ? 'default' : 'secondary'}>
                        {goal.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {goal.type.replace('_', ' ')} • Target: {goal.target_value} • 
                      Value: ${goal.value}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={goal.is_active}
                    onCheckedChange={() => handleToggleGoal(goal)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingGoal(goal)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Performance */}
      {goalPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goal Performance</CardTitle>
            <CardDescription>Completions and value by goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completions" fill="#3B82F6" name="Completions" />
                  <Bar dataKey="value" fill="#3B82F6" name="Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}