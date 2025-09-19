import { TextMegaNavigationFixed } from "./text-mega-navigation-fixed"

interface NavigationContainerProps {
  navItems?: any
}

export default function NavigationContainer({ navItems }: NavigationContainerProps) {
  return <TextMegaNavigationFixed navItems={navItems || undefined} />
}