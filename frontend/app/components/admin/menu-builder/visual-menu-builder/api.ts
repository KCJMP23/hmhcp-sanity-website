// API functions for Visual Menu Builder

import type { Menu, PageItem } from './types'
import { MOCK_PAGES, MOCK_POSTS, MOCK_CATEGORIES } from './types'
import { logger } from '@/lib/logging/client-safe-logger'

export const loadMenus = async (): Promise<Menu[]> => {
  try {
    const response = await fetch('/api/admin/menus')
    if (response.ok) {
      return await response.json()
    }
    return []
  } catch (error) {
    logger.error('Failed to load menus', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return []
  }
}

export const loadPages = async (): Promise<PageItem[]> => {
  try {
    const response = await fetch('/api/admin/content?type=page&status=published')
    if (response.ok) {
      const data = await response.json()
      return data.items.map((page: any) => ({
        id: page.id,
        title: page.title,
        slug: page.slug || `/${page.id}`,
        type: 'page' as const
      }))
    }
    return []
  } catch (error) {
    logger.error('Failed to load pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return []
  }
}

export const loadPosts = async (): Promise<PageItem[]> => {
  try {
    const response = await fetch('/api/admin/content?type=post&status=published')
    if (response.ok) {
      const data = await response.json()
      return data.items.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug || `/blog/${post.id}`,
        type: 'post' as const
      }))
    }
    return []
  } catch (error) {
    logger.error('Failed to load posts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return []
  }
}

export const loadCategories = async (): Promise<PageItem[]> => {
  try {
    const response = await fetch('/api/admin/categories')
    if (response.ok) {
      const data = await response.json()
      return data.map((category: any) => ({
        id: category.id,
        title: category.name,
        slug: `/category/${category.slug || category.id}`,
        type: 'category' as const
      }))
    }
    return []
  } catch (error) {
    logger.error('Failed to load categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return []
  }
}

export const saveMenu = async (menu: Menu): Promise<void> => {
  try {
    await fetch(`/api/admin/menus/${menu.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menu)
    })
  } catch (error) {
    logger.error('Failed to save menu', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      menuId: menu.id
    })
    throw error
  }
}

export const deleteMenu = async (menuId: string): Promise<void> => {
  try {
    await fetch(`/api/admin/menus/${menuId}`, {
      method: 'DELETE'
    })
  } catch (error) {
    logger.error('Failed to delete menu', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      menuId
    })
    throw error
  }
}