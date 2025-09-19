'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, FileText, ImageUp, Pencil } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'

type Action = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; className?: string }

export default function FloatingFab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hiddenWhileScroll, setHiddenWhileScroll] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  // Choose actions dynamically by page
  const actions = useMemo<Action[]>(() => {
    if (pathname.startsWith('/admin/posts')) {
      return [{ href: '/admin/posts/new', label: 'Add Post', icon: Pencil, className: 'bg-emerald-600' }]
    }
    if (pathname.startsWith('/admin/media')) {
      return [{ href: '/admin/media', label: 'Upload Media', icon: ImageUp, className: 'bg-purple-600' }]
    }
    // Default and /admin/content
    return [{ href: '/admin/content/new', label: 'Add Content', icon: FileText, className: 'bg-blue-600' }]
  }, [pathname])

  // Hide FAB and actions while user is actively scrolling
  useEffect(() => {
    const onScroll = () => {
      setOpen(false)
      setHiddenWhileScroll(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => setHiddenWhileScroll(false), 350)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <div className={`fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 ${hiddenWhileScroll ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}>
      {/* Actions list - render only when open to avoid any chance of visibility */}
      {open && (
        <div className="absolute right-0 bottom-16 space-y-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md shadow-lg text-white ${action.className || 'bg-blue-600'}`}
              onClick={() => setOpen(false)}
            >
              <action.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        aria-label="Add"
        onClick={() => setOpen(v => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl border border-gray-700 md:h-14 md:w-14"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}


