'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Bell,
  BellOff,
  Settings,
  Mail,
  MessageSquare,
  Shield,
  Calculator,
  PieChart,
  Calendar,
  Clock
} from 'lucide-react';

interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  threshold: number;
  current: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface BudgetConfig {
  monthly: number;
  weekly: number;
  daily: number;
  perExecution: number;
  warningThreshold: number;
  criticalThreshold: number;
  notifications: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
}

export function BudgetAlerts() {
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
    monthly: 5000,
    weekly: 1250,
    daily: 180,
    perExecution: 2.5,
    warningThreshold: 80,
    criticalThreshold: 95,
    notifications: {
      email: true,
      slack: false,
      inApp: true
    }
  });

  const [alerts, setAlerts] = useState<BudgetAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Monthly Budget Warning',
      description: 'You have used 82% of your monthly budget',
      threshold: 80,
      current: 82,
      timestamp: new Date(Date.now() - 3600000),
      acknowledged: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Daily Budget Update',
      description: 'Daily spending is within normal range',
      threshold: 100,
      current: 65,
      timestamp: new Date(Date.now() - 7200000),
      acknowledged: true
    }
  ]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentSpending, setCurrentSpending] = useState({
    monthly: 4100,
    weekly: 950,
    daily: 117,
    hourly: 12.5
  });

  const calculateBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= budgetConfig.criticalThreshold) return 'critical';
    if (percentage >= budgetConfig.warningThreshold) return 'warning';
    return 'normal';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  const updateBudgetThreshold = (type: 'monthly' | 'weekly' | 'daily' | 'perExecution', value: number) => {
    setBudgetConfig(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const toggleNotification = (channel: 'email' | 'slack' | 'inApp') => {
    setBudgetConfig(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: !prev.notifications[channel]
      }
    }));
  };

  // Calculate projections
  const calculateProjections = () => {
    const daysInMonth = 30;
    const currentDay = new Date().getDate();
    const remainingDays = daysInMonth - currentDay;
    
    const dailyAverage = currentSpending.monthly / currentDay;
    const projectedMonthly = dailyAverage * daysInMonth;
    
    return {
      projectedMonthly,
      dailyAverage,
      remainingBudget: budgetConfig.monthly - currentSpending.monthly,
      daysUntilBudgetExhausted: Math.floor((budgetConfig.monthly - currentSpending.monthly) / dailyAverage)
    };
  };

  const projections = calculateProjections();

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <div className="space-y-3">
        {alerts.filter(a => !a.acknowledged).map(alert => (
          <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {alert.title}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => acknowledgeAlert(alert.id)}
              >
                Dismiss
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-2">
              {alert.description}
              <div className="mt-2">
                <Progress value={alert.current} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Threshold: {alert.threshold}%</span>
                  <span>Current: {alert.current}%</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentSpending.monthly)}</div>
            <Progress 
              value={(currentSpending.monthly / budgetConfig.monthly) * 100} 
              className={`mt-2 ${
                calculateBudgetStatus(currentSpending.monthly, budgetConfig.monthly) === 'critical' ? 'bg-red-200' :
                calculateBudgetStatus(currentSpending.monthly, budgetConfig.monthly) === 'warning' ? 'bg-yellow-200' :
                ''
              }`}
            />
            <div className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(budgetConfig.monthly)} budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentSpending.weekly)}</div>
            <Progress 
              value={(currentSpending.weekly / budgetConfig.weekly) * 100} 
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(budgetConfig.weekly)} budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentSpending.daily)}</div>
            <Progress 
              value={(currentSpending.daily / budgetConfig.daily) * 100} 
              className="mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(budgetConfig.daily)} budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projections.projectedMonthly)}</div>
            <Badge 
              variant={projections.projectedMonthly > budgetConfig.monthly ? 'destructive' : 'secondary'}
              className="mt-2"
            >
              {projections.projectedMonthly > budgetConfig.monthly ? 'Over Budget' : 'On Track'}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {projections.daysUntilBudgetExhausted} days until exhausted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget Configuration</CardTitle>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Budget & Alert Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your budget limits and alert thresholds
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Budget Limits */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Budget Limits</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthly-budget">Monthly Budget</Label>
                        <Input
                          id="monthly-budget"
                          type="number"
                          value={budgetConfig.monthly}
                          onChange={(e) => updateBudgetThreshold('monthly', parseFloat(e.target.value))}
                          step="100"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="weekly-budget">Weekly Budget</Label>
                        <Input
                          id="weekly-budget"
                          type="number"
                          value={budgetConfig.weekly}
                          onChange={(e) => updateBudgetThreshold('weekly', parseFloat(e.target.value))}
                          step="50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="daily-budget">Daily Budget</Label>
                        <Input
                          id="daily-budget"
                          type="number"
                          value={budgetConfig.daily}
                          onChange={(e) => updateBudgetThreshold('daily', parseFloat(e.target.value))}
                          step="10"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="per-execution">Per Execution Limit</Label>
                        <Input
                          id="per-execution"
                          type="number"
                          value={budgetConfig.perExecution}
                          onChange={(e) => updateBudgetThreshold('perExecution', parseFloat(e.target.value))}
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alert Thresholds */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Alert Thresholds</h3>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Warning Threshold</Label>
                        <span className="text-sm text-muted-foreground">
                          {budgetConfig.warningThreshold}%
                        </span>
                      </div>
                      <Slider
                        value={[budgetConfig.warningThreshold]}
                        onValueChange={([value]) => setBudgetConfig(prev => ({
                          ...prev,
                          warningThreshold: value
                        }))}
                        min={50}
                        max={95}
                        step={5}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Critical Threshold</Label>
                        <span className="text-sm text-muted-foreground">
                          {budgetConfig.criticalThreshold}%
                        </span>
                      </div>
                      <Slider
                        value={[budgetConfig.criticalThreshold]}
                        onValueChange={([value]) => setBudgetConfig(prev => ({
                          ...prev,
                          criticalThreshold: value
                        }))}
                        min={80}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Notification Channels</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={budgetConfig.notifications.email}
                          onCheckedChange={() => toggleNotification('email')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <Label htmlFor="slack-notifications">Slack Notifications</Label>
                        </div>
                        <Switch
                          id="slack-notifications"
                          checked={budgetConfig.notifications.slack}
                          onCheckedChange={() => toggleNotification('slack')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <Label htmlFor="app-notifications">In-App Notifications</Label>
                        </div>
                        <Switch
                          id="app-notifications"
                          checked={budgetConfig.notifications.inApp}
                          onCheckedChange={() => toggleNotification('inApp')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Save configuration
                      setIsConfigOpen(false);
                    }}>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Daily Average</span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(projections.dailyAverage)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Remaining Budget</span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(projections.remainingBudget)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Burn Rate</span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(currentSpending.hourly)}/hr
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Alert Status</span>
              </div>
              <Badge variant={alerts.filter(a => !a.acknowledged).length > 0 ? 'destructive' : 'secondary'}>
                {alerts.filter(a => !a.acknowledged).length} Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Bell className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={alert.acknowledged ? 'secondary' : 'default'}>
                  {alert.acknowledged ? 'Acknowledged' : 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}