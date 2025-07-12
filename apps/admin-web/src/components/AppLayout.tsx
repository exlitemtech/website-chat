'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import { useConversationWebSocket } from '@/hooks/useConversationWebSocket'
import NotificationSettings from '@/components/NotificationSettings'
import { 
  Layout, 
  LayoutHeader, 
  LayoutMain, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarNav, 
  SidebarItem, 
  SidebarFooter,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge
} from '@website-chat/ui'
import { 
  MessageCircle, 
  Users, 
  Globe, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  BellOff,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  websiteIds: string[]
  avatar?: string
}

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const notifications = useNotifications()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Failed to parse user data:', error)
      router.push('/login')
      return
    }
    
    setIsLoading(false)
  }, [mounted, router])

  // Initialize WebSocket connection for global notifications (client-side only)
  const { isConnected } = useConversationWebSocket({
    userId: mounted && user?.id ? user.id : '',
    token: mounted && typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '',
    enableNotifications: true,
    currentConversationId: mounted && pathname.includes('/conversations/') ? pathname.split('/').pop() : undefined,
    enabled: mounted && !!user?.id && !pathname.includes('/conversations/') // Disable when viewing specific conversation to prevent duplicate connections
  })

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
    router.push('/login')
  }

  const handleNotificationToggle = async () => {
    if (!notifications.permission.isGranted) {
      await notifications.requestPermission()
    } else {
      notifications.updatePreferences({ 
        enabled: !notifications.preferences.enabled 
      })
    }
  }

  const handleSoundToggle = () => {
    notifications.updatePreferences({ 
      soundEnabled: !notifications.preferences.soundEnabled 
    })
  }

  const handleDoNotDisturbToggle = () => {
    if (notifications.preferences.doNotDisturb) {
      notifications.disableDoNotDisturb()
    } else {
      notifications.enableDoNotDisturb()
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Conversations', href: '/conversations', icon: MessageCircle, badge: '3' },
    { name: 'Websites', href: '/websites', icon: Globe },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Layout>
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Website Chat</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarNav className="px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  className={`sidebar-item ${isActive ? 'active' : ''} w-full`}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </SidebarNav>
        </SidebarContent>

        <SidebarFooter>
          <div className="mx-3 p-3 rounded-xl bg-white shadow-sm border border-slate-200/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-indigo-100">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role} Account</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <LayoutHeader className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {navigation.find(nav => nav.href === pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500">Manage your customer conversations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Notification Controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNotificationToggle}
                className={`relative transition-colors ${
                  notifications.preferences.enabled && notifications.permission.isGranted
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={notifications.permission.isGranted 
                  ? (notifications.preferences.enabled ? 'Disable notifications' : 'Enable notifications')
                  : 'Request notification permission'
                }
              >
                {notifications.preferences.doNotDisturb ? (
                  <BellOff className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {!isConnected && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
                )}
                {isConnected && notifications.preferences.enabled && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSoundToggle}
                className={`transition-colors ${
                  notifications.preferences.soundEnabled
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={notifications.preferences.soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {notifications.preferences.soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              
              <NotificationSettings>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-slate-600"
                  title="Notification settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </NotificationSettings>
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <Avatar className="h-9 w-9 ring-2 ring-indigo-100">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </LayoutHeader>

        {/* Main Content */}
        <LayoutMain>
          {children}
        </LayoutMain>
      </div>
    </Layout>
  )
}