import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

// Map of admin routes to their components
const adminRoutes = {
  '/admin/monitoring': () => import('@/app/admin/monitoring/page'),
  '/admin/analytics': () => import('@/app/admin/analytics/page'),
  '/admin/content': () => import('@/app/admin/content/page'),
  '/admin/users': () => import('@/app/admin/users/page'),
  '/admin/settings': () => import('@/app/admin/settings/general/page'),
}

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [Component, setComponent] = useState<any>(null)

  useEffect(() => {
    // Dynamically load only the needed admin component
    const path = window.location.pathname
    const loader = adminRoutes[path]
    
    if (loader) {
      loader().then(mod => {
        setComponent(() => mod.default)
      })
    }
  }, [])

  if (!Component) {
    return <AdminLoading />
  }

  return <Component />
}
