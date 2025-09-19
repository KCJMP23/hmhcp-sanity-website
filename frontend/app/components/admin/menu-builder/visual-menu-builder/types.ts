// Types and interfaces for Visual Menu Builder

export interface MenuItem {
  id: string
  label: string
  url: string
  type: 'page' | 'post' | 'category' | 'custom' | 'home'
  target: '_self' | '_blank'
  cssClasses?: string
  description?: string
  children?: MenuItem[]
  pageId?: string
  postId?: string
  categoryId?: string
}

export interface Menu {
  id: string
  name: string
  location?: string
  items: MenuItem[]
}

export interface PageItem {
  id: string
  title: string
  slug: string
  type: 'page' | 'post' | 'category'
}

export interface VisualMenuBuilderState {
  menus: Menu[]
  selectedMenu: Menu | null
  pages: PageItem[]
  posts: PageItem[]
  categories: PageItem[]
  isSaving: boolean
  newMenuName: string
}

export interface MenuSelectionProps {
  menus: Menu[]
  selectedMenu: Menu | null
  newMenuName: string
  setSelectedMenu: (menu: Menu | null) => void
  setNewMenuName: (name: string) => void
  createMenu: () => void
}

export interface AddMenuItemsProps {
  pages: PageItem[]
  posts: PageItem[]
  categories: PageItem[]
  addMenuItem: (item: PageItem) => void
  addCustomLink: (url: string, label: string) => void
}

export interface MenuSettingsProps {
  selectedMenu: Menu | null
  setSelectedMenu: (menu: Menu | null) => void
}

export interface MenuStructureProps {
  selectedMenu: Menu | null
  updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (itemId: string) => void
  handleDragEnd: (event: any) => void
}

export interface SortableMenuItemProps {
  item: MenuItem
  onUpdate: (id: string, updates: Partial<MenuItem>) => void
  onDelete: (id: string) => void
  depth?: number
}

export interface CustomLinkFormProps {
  onAdd: (url: string, label: string) => void
}

// Constants
export const MENU_LOCATIONS = [
  { value: 'primary', label: 'Primary Navigation' },
  { value: 'footer', label: 'Footer Menu' },
  { value: 'mobile', label: 'Mobile Menu' },
  { value: 'sidebar', label: 'Sidebar Menu' }
]

// Mock data
export const MOCK_PAGES: PageItem[] = [
  { id: '1', title: 'Home', slug: '/', type: 'page' },
  { id: '2', title: 'About Us', slug: '/about', type: 'page' },
  { id: '3', title: 'Services', slug: '/services', type: 'page' },
  { id: '4', title: 'Contact', slug: '/contact', type: 'page' }
]

export const MOCK_POSTS: PageItem[] = [
  { id: '1', title: 'Latest Healthcare Innovations', slug: '/blog/healthcare-innovations', type: 'post' },
  { id: '2', title: 'Digital Health Trends', slug: '/blog/digital-health-trends', type: 'post' }
]

export const MOCK_CATEGORIES: PageItem[] = [
  { id: '1', title: 'Healthcare', slug: '/category/healthcare', type: 'category' },
  { id: '2', title: 'Technology', slug: '/category/technology', type: 'category' }
]