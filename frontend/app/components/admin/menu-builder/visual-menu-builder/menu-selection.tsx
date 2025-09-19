'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { MenuSelectionProps } from './types'

export function MenuSelection({
  menus,
  selectedMenu,
  newMenuName,
  setSelectedMenu,
  setNewMenuName,
  createMenu
}: MenuSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select Menu</CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedMenu?.id}
          onValueChange={(id) => setSelectedMenu(menus.find(m => m.id === id) || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a menu" />
          </SelectTrigger>
          <SelectContent>
            {menus.map(menu => (
              <SelectItem key={menu.id} value={menu.id}>
                {menu.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New menu name"
              value={newMenuName}
              onChange={(e) => setNewMenuName(e.target.value)}
            />
            <Button onClick={createMenu} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}