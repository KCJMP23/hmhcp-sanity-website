// Re-export from the modular navigation structure for backward compatibility
export { AppleMegaNavigation } from "./navigation/index"

// Export additional components for potential reuse
export {
  NavigationHeader,
  DesktopMenu,
  MegaMenu,
  MobileMenu,
  MobileMenuButton,
  useNavigationState,
  navItems
} from "./navigation/index"

// Export types
export type {
  NavItem,
  NavSubitem,
  NavFeatured,
  NavigationState
} from "./navigation/index"