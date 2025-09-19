'use client'

import { useEffect } from 'react'
// import { useNavigationEditorStore } from '@/stores/navigationEditorStore'

interface NavigationProviderProps {
  initialNavigation: any
  children: React.ReactNode
}

export function NavigationProvider({ initialNavigation, children }: NavigationProviderProps) {
  // Temporarily disabled due to missing dependencies
  return <>{children}</>
  
  // const setItems = useNavigationEditorStore((state: any) => state.setItems)
  
  // useEffect(() => {
  //   if (initialNavigation?.items) {
  //     setItems(initialNavigation.items)
  //   }
  // }, [initialNavigation, setItems])
  
  // return <>{children}</>
}