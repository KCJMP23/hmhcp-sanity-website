// Export all sidebar components from their respective modules
export { useSidebar, SidebarProvider } from "./context"
export { 
  Sidebar, 
  SidebarTrigger, 
  SidebarRail, 
  SidebarInset 
} from "./core"
export { 
  SidebarInput,
  SidebarHeader, 
  SidebarFooter, 
  SidebarSeparator, 
  SidebarContent 
} from "./layout"
export { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupAction, 
  SidebarGroupContent 
} from "./group"
export { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "./menu"

// Export types for external usage
export type { SidebarContext, SidebarProviderProps, SidebarProps } from "./types"