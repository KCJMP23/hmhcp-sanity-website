// Dynamic route loader for admin pages
export const loadAdminRoute = async (path: string) => {
  // Remove all admin components from main bundle
  switch(path) {
    case '/admin/monitoring':
      return (await import(/* webpackChunkName: "admin-monitoring" */ '@/app/admin/monitoring/page')).default
    case '/admin/analytics':
      return (await import(/* webpackChunkName: "admin-analytics" */ '@/app/admin/analytics/page')).default
    case '/admin/content':
      return (await import(/* webpackChunkName: "admin-content" */ '@/app/admin/content/page')).default
    case '/admin/users':
      return (await import(/* webpackChunkName: "admin-users" */ '@/app/admin/users/page')).default
    case '/admin/settings':
      return (await import(/* webpackChunkName: "admin-settings" */ '@/app/admin/settings/general/page')).default
    default:
      return null
  }
}
