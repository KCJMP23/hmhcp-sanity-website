export interface NavSubitem {
  name: string
  href: string
  description: string
  image?: string
}

export interface NavFeatured {
  title: string
  description: string
  href: string
  image: string
}

export interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  description: string
  submenu?: NavSubitem[]
  featured?: NavFeatured
}

export interface NavigationState {
  activeMenu: string | null
  setActiveMenu: (menu: string | null) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  scrolled: boolean
  pathname: string
  theme: string | undefined
  isDark: boolean
}