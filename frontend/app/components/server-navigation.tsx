import { getNavigation } from '@/lib/navigation'
import { TextMegaNavigationFixed } from './text-mega-navigation-fixed'

export async function ServerNavigation() {
  const navItems = await getNavigation('header')
  
  return <TextMegaNavigationFixed navItems={navItems} />
}