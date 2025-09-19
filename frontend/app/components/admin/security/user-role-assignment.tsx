/**
 * User Role Assignment Interface Component
 * Interactive component for assigning and managing user roles
 * 
 * Story 1.6 Task 2: User-Role Assignment Interface
 * Comprehensive role assignment with healthcare context and validation
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlusIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HealthcareRole,
  Permission,
  PermissionCategory,
  HealthcareRoleManager,
  HEALTHCARE_ROLE_PERMISSIONS
} from '@/lib/security/healthcare-role-manager'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  current_role?: HealthcareRole
  is_active: boolean
}

interface AssignmentFormData {
  userId: string
  role: HealthcareRole
  permissions: Permission[]
  expiresAt: string
  reason: string
  healthcareContext: {
    department: string
    licenseNumber: string
    specialization: string[]
    clearanceLevel: string
  }
}

interface UserRoleAssignmentProps {
  users: User[]
  onAssignmentComplete?: () => void
  className?: string
}

const roleColors: Record<HealthcareRole, string> = {
  [HealthcareRole.SYSTEM_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
  [HealthcareRole.CHIEF_MEDICAL_OFFICER]: 'bg-purple-100 text-purple-800 border-purple-200',
  [HealthcareRole.MEDICAL_DIRECTOR]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [HealthcareRole.PHYSICIAN]: 'bg-blue-100 text-blue-800 border-blue-200',
  [HealthcareRole.NURSE_MANAGER]: 'bg-teal-100 text-teal-800 border-teal-200',
  [HealthcareRole.REGISTERED_NURSE]: 'bg-green-100 text-green-800 border-green-200',
  [HealthcareRole.HEALTHCARE_ANALYST]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [HealthcareRole.ADMIN]: 'bg-orange-100 text-orange-800 border-orange-200',
  [HealthcareRole.CONTENT_MANAGER]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [HealthcareRole.MARKETING_MANAGER]: 'bg-pink-100 text-pink-800 border-pink-200',
  [HealthcareRole.COMPLIANCE_OFFICER]: 'bg-gray-100 text-gray-800 border-gray-200',
  [HealthcareRole.EDITOR]: 'bg-lime-100 text-lime-800 border-lime-200',
  [HealthcareRole.AUTHOR]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [HealthcareRole.REVIEWER]: 'bg-violet-100 text-violet-800 border-violet-200',
  [HealthcareRole.VIEWER]: 'bg-slate-100 text-slate-800 border-slate-200',
  [HealthcareRole.GUEST]: 'bg-gray-50 text-gray-600 border-gray-100'
}

export default function UserRoleAssignment({ 
  users, 
  onAssignmentComplete, 
  className = '' 
}: UserRoleAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState(1) // Multi-step form
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    userId: '',
    role: HealthcareRole.VIEWER,
    permissions: [],
    expiresAt: '',
    reason: '',
    healthcareContext: {
      department: '',
      licenseNumber: '',
      specialization: [],
      clearanceLevel: 'basic'
    }
  })

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
  const [additionalPermissions, setAdditionalPermissions] = useState<Permission[]>([])

  // Update permissions when role changes
  useEffect(() => {
    if (formData.role) {
      const permissions = HealthcareRoleManager.getRolePermissions(formData.role)
      setRolePermissions(permissions)
      setFormData(prev => ({
        ...prev,
        permissions: permissions
      }))
    }
  }, [formData.role])

  // Update selected user when userId changes
  useEffect(() => {
    if (formData.userId) {
      const user = users.find(u => u.id === formData.userId)
      setSelectedUser(user || null)
    }
  }, [formData.userId, users])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validate form
      if (!formData.userId || !formData.reason) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.reason.length < 10) {
        throw new Error('Reason must be at least 10 characters')
      }

      // Submit assignment
      const response = await fetch('/api/admin/security/roles/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign role')
      }

      const result = await response.json()
      setSuccess(result.message || 'Role assigned successfully')
      
      // Reset form
      resetForm()
      
      // Close dialog after delay
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
        if (onAssignmentComplete) {
          onAssignmentComplete()
        }
      }, 2000)

    } catch (error) {
      console.error('Assignment error:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign role')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      role: HealthcareRole.VIEWER,
      permissions: [],
      expiresAt: '',
      reason: '',
      healthcareContext: {
        department: '',
        licenseNumber: '',
        specialization: [],
        clearanceLevel: 'basic'
      }
    })
    setSelectedUser(null)
    setStep(1)
    setError(null)
    setSuccess(null)
  }

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {}
    const allPermissions = Object.values(Permission)
    
    allPermissions.forEach(permission => {
      const category = permission.split(':')[0]
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(permission)
    })
    
    return categories
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white"
      >
        <UserPlusIcon className="w-4 h-4 mr-2" />
        Assign Role
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetForm()
        setIsOpen(open)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-2 text-blue-500" />
              Assign Healthcare Role
            </DialogTitle>
            <DialogDescription>
              Assign a healthcare role to a user with appropriate permissions and context
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700">{success}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: User and Role Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userId">Select User *</Label>
                    <Select 
                      value={formData.userId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user to assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-8 w-8">
                                {user.avatar_url ? (
                                  <img
                                    className="h-8 w-8 rounded-full"
                                    src={user.avatar_url}
                                    alt={user.name || user.email}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-xs">
                                      {(user.name || user.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{user.name || user.email}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                                {user.current_role && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Current: {user.current_role.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUser && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          {selectedUser.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={selectedUser.avatar_url}
                              alt={selectedUser.name || selectedUser.email}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{selectedUser.name || selectedUser.email}</div>
                          <div className="text-sm text-gray-500">{selectedUser.email}</div>
                          <div className="flex items-center mt-1 space-x-2">
                            {selectedUser.is_active ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                Inactive
                              </Badge>
                            )}
                            {selectedUser.current_role && (
                              <Badge className={roleColors[selectedUser.current_role]}>
                                {selectedUser.current_role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Role Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="role">Healthcare Role *</Label>
                    <Select 
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        role: value as HealthcareRole 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(HealthcareRole).map(role => (
                          <SelectItem key={role} value={role}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className="text-xs text-gray-500">
                                {HealthcareRoleManager.getRoleDescription(role)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-blue-50 rounded-lg"
                    >
                      <h4 className="font-medium text-blue-900 mb-2">Role Summary</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        {HealthcareRoleManager.getRoleDescription(formData.role)}
                      </p>
                      <div className="text-sm">
                        <span className="font-medium text-blue-900">Permissions: </span>
                        <span className="text-blue-700">
                          {rolePermissions.length} permissions included
                        </span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Healthcare Context */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Healthcare Context</CardTitle>
                  <p className="text-sm text-gray-500">
                    Provide healthcare-specific context for this role assignment
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        value={formData.healthcareContext.department}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          healthcareContext: {
                            ...prev.healthcareContext,
                            department: e.target.value
                          }
                        }))}
                        placeholder="e.g., Cardiology, Emergency Medicine"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="clearanceLevel">Security Clearance Level *</Label>
                      <Select 
                        value={formData.healthcareContext.clearanceLevel}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          healthcareContext: {
                            ...prev.healthcareContext,
                            clearanceLevel: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">
                            <div>
                              <div className="font-medium">Basic</div>
                              <div className="text-xs text-gray-500">Standard access level</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="standard">
                            <div>
                              <div className="font-medium">Standard</div>
                              <div className="text-xs text-gray-500">Enhanced access with monitoring</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="elevated">
                            <div>
                              <div className="font-medium">Elevated</div>
                              <div className="text-xs text-gray-500">High-level access with strict auditing</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="critical">
                            <div>
                              <div className="font-medium">Critical</div>
                              <div className="text-xs text-gray-500">Maximum access for emergency situations</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="licenseNumber">Professional License Number</Label>
                    <Input
                      value={formData.healthcareContext.licenseNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        healthcareContext: {
                          ...prev.healthcareContext,
                          licenseNumber: e.target.value
                        }
                      }))}
                      placeholder="Professional license or certification number"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Review and Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Reason for Assignment *</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Provide a detailed reason for this role assignment..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 10 characters required
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="expiresAt">Role Expiration (Optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                        className="flex-1"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Leave empty for permanent assignment</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">User:</span>
                      <span className="text-sm">
                        {selectedUser?.name || selectedUser?.email}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Role:</span>
                      <Badge className={roleColors[formData.role]}>
                        {formData.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Permissions:</span>
                      <span className="text-sm">{rolePermissions.length} permissions</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Department:</span>
                      <span className="text-sm">
                        {formData.healthcareContext.department || 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Clearance Level:</span>
                      <Badge variant="outline">
                        {formData.healthcareContext.clearanceLevel.charAt(0).toUpperCase() + 
                         formData.healthcareContext.clearanceLevel.slice(1)}
                      </Badge>
                    </div>
                    
                    {formData.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Expires:</span>
                        <div className="flex items-center text-sm">
                          <ClockIcon className="w-4 h-4 mr-1 text-orange-500" />
                          {new Date(formData.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex space-x-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              
              {step < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={!formData.userId || (step === 1 && !formData.role)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.reason || formData.reason.length < 10}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Assigning...
                    </div>
                  ) : (
                    'Assign Role'
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}