'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { CustomLinkForm } from './custom-link-form'
import type { AddMenuItemsProps } from './types'

export function AddMenuItems({
  pages,
  posts,
  categories,
  addMenuItem,
  addCustomLink
}: AddMenuItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Menu Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pages">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-2">
            {pages.map(page => (
              <div key={page.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <span className="text-sm">{page.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addMenuItem(page)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="posts" className="space-y-2">
            {posts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <span className="text-sm">{post.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addMenuItem(post)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="categories" className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <span className="text-sm">{category.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addMenuItem(category)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="space-y-2">
            <CustomLinkForm onAdd={addCustomLink} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}