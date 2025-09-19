'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Temporary simplified component to fix build errors
export function PartnersManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Partners Management</CardTitle>
          <CardDescription>
            Partners management temporarily disabled for deployment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This component has been temporarily simplified to resolve build errors.
            The full functionality will be restored after the Lexical editor deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}