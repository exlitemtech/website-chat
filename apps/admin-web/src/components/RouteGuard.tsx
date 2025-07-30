'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isProtectedRoute, getRedirectPath } from '@/utils/routeProtection'

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isInitializing } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isInitializing) {
      const redirectPath = getRedirectPath(pathname, isAuthenticated)
      
      if (redirectPath) {
        router.push(redirectPath)
      }
    }
  }, [mounted, isInitializing, isAuthenticated, pathname, router])

  // Show loading only during initial authentication check
  if (!mounted || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    return null
  }

  return <>{children}</>
} 