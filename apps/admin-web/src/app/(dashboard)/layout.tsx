'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, cn } from '@website-chat/ui'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Globe, 
  Users, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Websites',
    href: '/websites',
    icon: Globe
  },
  {
    title: 'Conversations',
    href: '/conversations',
    icon: MessageSquare
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-xl">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold gradient-text">WebsiteChat</h1>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    
                    return (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                            isActive
                              ? 'gradient-bg text-white'
                              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-6 w-6 shrink-0',
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
                            )}
                          />
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
              
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">Admin User</span>
                </div>
                
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-0">
          {children}
        </main>
      </div>
    </div>
  )
}