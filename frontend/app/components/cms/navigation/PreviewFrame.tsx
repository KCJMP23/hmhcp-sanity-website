'use client'

import { useEffect, useState } from 'react'
import { NavigationItem } from '@/stores/navigationEditorStore'
import { ThemeProvider } from '@/components/theme-provider'

interface PreviewMessage {
  type: 'UPDATE_NAVIGATION'
  payload: {
    items: NavigationItem[]
    mode: 'header' | 'mobile' | 'footer'
    theme: 'light' | 'dark'
  }
}

export function PreviewFrame({
  initialMode = 'header',
  initialTheme = 'light'
}: {
  initialMode?: 'header' | 'mobile' | 'footer'
  initialTheme?: 'light' | 'dark'
}) {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [mode, setMode] = useState(initialMode)
  const [theme, setTheme] = useState(initialTheme)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.data.type === 'UPDATE_NAVIGATION') {
        const { items, mode: newMode, theme: newTheme } = event.data.payload
        setNavigationItems(items)
        setMode(newMode)
        setTheme(newTheme)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const renderHeader = () => (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-semibold">Logo</div>
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <div key={item.id} className="relative group">
                  <a
                    href={item.url || '#'}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.title}
                  </a>
                  {item.children && item.children.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      {item.children.map((child) => (
                        <a
                          key={child.id}
                          href={child.url || '#'}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={(e) => e.preventDefault()}
                        >
                          {child.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Header Navigation Preview</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This preview shows how your navigation will appear in the site header.
          </p>
        </div>
      </main>
    </div>
  )

  const renderFooter = () => (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Footer Navigation Preview</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Scroll down to see your footer navigation.
          </p>
        </div>
      </main>
      <footer className="bg-gray-100 dark:bg-gray-900 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {navigationItems.map((section) => (
              <div key={section.id}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h3>
                {section.children && section.children.length > 0 && (
                  <ul className="space-y-2">
                    {section.children.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.url || '#'}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          onClick={(e) => e.preventDefault()}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )

  const renderMobile = () => {
    return (
      <div className="min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="text-lg font-semibold">Logo</div>
              <button 
                className="p-2"
                onClick={() => setIsOpen(!isOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        {isOpen && (
          <div className="bg-white dark:bg-gray-900 border-b">
            <nav className="container mx-auto px-4 py-4">
              {navigationItems.map((item) => (
                <div key={item.id} className="py-2">
                  <a
                    href={item.url || '#'}
                    className="block text-gray-700 dark:text-gray-300 font-medium"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.title}
                  </a>
                  {item.children && item.children.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {item.children.map((child) => (
                        <a
                          key={child.id}
                          href={child.url || '#'}
                          className="block text-sm text-gray-600 dark:text-gray-400"
                          onClick={(e) => e.preventDefault()}
                        >
                          {child.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
        
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Mobile Navigation Preview</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Click the menu button to see your mobile navigation.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {mode === 'header' && renderHeader()}
        {mode === 'footer' && renderFooter()}
        {mode === 'mobile' && renderMobile()}
      </div>
    </ThemeProvider>
  )
}