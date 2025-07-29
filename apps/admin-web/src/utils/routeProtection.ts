// ✅ Regex pattern for protected routes (escaped slashes)
export const PROTECTED_ROUTES_REGEX: RegExp = /^(\/|\/dashboard|\/conversations(\/[^/]+)?|\/websites(\/[^/]+\/(configure|integrate))?)$/

// ✅ Array of protected static routes
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/conversations',
  '/websites'
]

// ✅ Check if a route is protected
export function isProtectedRoute(pathname: string): boolean {
  // Check exact matches first
  if (PROTECTED_ROUTES.includes(pathname)) {
    return true
  }
  
  // Check regex pattern for dynamic routes
  return PROTECTED_ROUTES_REGEX.test(pathname)
}

// ✅ Check if a route requires authentication
export function requiresAuth(pathname: string): boolean {
  const publicRoutes = ['/login']
  
  return !publicRoutes.includes(pathname) && isProtectedRoute(pathname)
}

// ✅ Get redirect path based on auth status
export function getRedirectPath(pathname: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && requiresAuth(pathname)) {
    return '/login'
  }

  if (isAuthenticated && pathname === '/login') {
    return '/dashboard'
  }

  return null
}
