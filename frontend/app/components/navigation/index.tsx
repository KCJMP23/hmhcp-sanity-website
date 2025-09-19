"use client"

import { useNavigationState } from "./hooks"
import { NavigationHeader } from "./header"
import { DesktopMenu } from "./desktop-menu"
import { MegaMenu } from "./mega-menu"
import { MobileMenu, MobileMenuButton } from "./mobile-menu"

export function AppleMegaNavigation() {
  const navigationState = useNavigationState()
  const {
    navRef,
    timeoutRef,
    handleMouseEnter,
    handleMouseLeave,
    ...state
  } = navigationState

  return (
    <NavigationHeader state={state} navRef={navRef}>
      <DesktopMenu 
        state={state}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeave={handleMouseLeave}
      />

      <MobileMenuButton state={state} />

      <MegaMenu 
        state={state}
        timeoutRef={timeoutRef}
        handleMouseLeave={handleMouseLeave}
      />

      <MobileMenu state={state} />
    </NavigationHeader>
  )
}

// Export individual components for potential reuse
export { NavigationHeader } from "./header"
export { DesktopMenu } from "./desktop-menu"
export { MegaMenu } from "./mega-menu"
export { MobileMenu, MobileMenuButton } from "./mobile-menu"
export { useNavigationState } from "./hooks"
export { navItems } from "./data"
export type { NavItem, NavSubitem, NavFeatured, NavigationState } from "./types"