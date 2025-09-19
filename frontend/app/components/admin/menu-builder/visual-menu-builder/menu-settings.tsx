'use client'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MENU_LOCATIONS, type MenuSettingsProps } from './types'

export function MenuSettings({ selectedMenu, setSelectedMenu }: MenuSettingsProps) {
  if (!selectedMenu) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Menu Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Menu Name</Label>
            <Input
              value={selectedMenu.name}
              onChange={(e) => setSelectedMenu({ ...selectedMenu, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Display Location</Label>
            <Select
              value={selectedMenu.location}
              onValueChange={(location) => setSelectedMenu({ ...selectedMenu, location })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {MENU_LOCATIONS.map(location => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}