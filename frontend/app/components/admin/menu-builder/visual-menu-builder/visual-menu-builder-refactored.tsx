'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Eye } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent } from '@dnd-kit/core'
import { MenuSelection } from './menu-selection'
import { AddMenuItems } from './add-menu-items'
import { MenuSettings } from './menu-settings'
import { MenuStructure } from './menu-structure'
import { loadMenus, loadPages, loadPosts, loadCategories, saveMenu } from './api'
import type { 
  Menu, 
  MenuItem, 
  PageItem, 
  VisualMenuBuilderState 
} from './types'

export function VisualMenuBuilder() {
  const [state, setState] = useState<VisualMenuBuilderState>({
    menus: [],
    selectedMenu: null,
    pages: [],
    posts: [],
    categories: [],
    isSaving: false,
    newMenuName: ''
  })

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [menus, pages, posts, categories] = await Promise.all([
          loadMenus(),
          loadPages(),
          loadPosts(),
          loadCategories()
        ])

        setState(prev => ({
          ...prev,
          menus,
          pages,
          posts,
          categories,
          selectedMenu: menus.length > 0 && !prev.selectedMenu ? menus[0] : prev.selectedMenu
        }))
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [])

  const setSelectedMenu = (menu: Menu | null) => {
    setState(prev => ({ ...prev, selectedMenu: menu }))
  }

  const setNewMenuName = (name: string) => {
    setState(prev => ({ ...prev, newMenuName: name }))
  }

  const createMenu = () => {
    if (!state.newMenuName.trim()) return

    const newMenu: Menu = {
      id: Date.now().toString(),
      name: state.newMenuName,
      items: []
    }

    setState(prev => ({
      ...prev,
      menus: [...prev.menus, newMenu],
      selectedMenu: newMenu,
      newMenuName: ''
    }))
  }

  const addMenuItem = (item: PageItem) => {
    if (!state.selectedMenu) return

    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: item.title,
      url: item.slug,
      type: item.type,
      target: '_self',
      [`${item.type}Id`]: item.id
    }

    setState(prev => ({
      ...prev,
      selectedMenu: prev.selectedMenu ? {
        ...prev.selectedMenu,
        items: [...prev.selectedMenu.items, newItem]
      } : null
    }))
  }

  const addCustomLink = (url: string, label: string) => {
    if (!state.selectedMenu || !url || !label) return

    const newItem: MenuItem = {
      id: Date.now().toString(),
      label,
      url,
      type: 'custom',
      target: url.startsWith('http') ? '_blank' : '_self'
    }

    setState(prev => ({
      ...prev,
      selectedMenu: prev.selectedMenu ? {
        ...prev.selectedMenu,
        items: [...prev.selectedMenu.items, newItem]
      } : null
    }))
  }

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    if (!state.selectedMenu) return

    const updateItems = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates }
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) }
        }
        return item
      })
    }

    setState(prev => ({
      ...prev,
      selectedMenu: prev.selectedMenu ? {
        ...prev.selectedMenu,
        items: updateItems(prev.selectedMenu.items)
      } : null
    }))
  }

  const deleteMenuItem = (itemId: string) => {
    if (!state.selectedMenu) return

    const deleteFromItems = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        if (item.id === itemId) return false
        if (item.children) {
          item.children = deleteFromItems(item.children)
        }
        return true
      })
    }

    setState(prev => ({
      ...prev,
      selectedMenu: prev.selectedMenu ? {
        ...prev.selectedMenu,
        items: deleteFromItems(prev.selectedMenu.items)
      } : null
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && state.selectedMenu) {
      const oldIndex = state.selectedMenu.items.findIndex(item => item.id === active.id)
      const newIndex = state.selectedMenu.items.findIndex(item => item.id === over?.id)

      setState(prev => ({
        ...prev,
        selectedMenu: prev.selectedMenu ? {
          ...prev.selectedMenu,
          items: arrayMove(prev.selectedMenu.items, oldIndex, newIndex)
        } : null
      }))
    }
  }

  const handleSaveMenu = async () => {
    if (!state.selectedMenu) return

    setState(prev => ({ ...prev, isSaving: true }))
    try {
      await saveMenu(state.selectedMenu)

      // Update local menus list
      setState(prev => ({
        ...prev,
        menus: prev.menus.map(m => m.id === state.selectedMenu?.id ? state.selectedMenu : m),
        isSaving: false
      }))
    } catch (error) {
      console.error('Failed to save menu:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-96 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Menu Selection */}
          <MenuSelection
            menus={state.menus}
            selectedMenu={state.selectedMenu}
            newMenuName={state.newMenuName}
            setSelectedMenu={setSelectedMenu}
            setNewMenuName={setNewMenuName}
            createMenu={createMenu}
          />

          {/* Add Menu Items */}
          <AddMenuItems
            pages={state.pages}
            posts={state.posts}
            categories={state.categories}
            addMenuItem={addMenuItem}
            addCustomLink={addCustomLink}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {state.selectedMenu ? state.selectedMenu.name : 'Menu Structure'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop to reorder menu items
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveMenu} 
                disabled={!state.selectedMenu || state.isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {state.isSaving ? 'Saving...' : 'Save Menu'}
              </Button>
            </div>
          </div>

          {state.selectedMenu && (
            <div className="space-y-4">
              {/* Menu Settings */}
              <MenuSettings
                selectedMenu={state.selectedMenu}
                setSelectedMenu={setSelectedMenu}
              />

              {/* Menu Structure */}
              <MenuStructure
                selectedMenu={state.selectedMenu}
                updateMenuItem={updateMenuItem}
                deleteMenuItem={deleteMenuItem}
                handleDragEnd={handleDragEnd}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}