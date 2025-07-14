// API configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isClient = typeof window !== 'undefined'

// Get API URL from environment or default to localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// WebSocket URL configuration
export const WS_BASE_URL = (() => {
  if (!isClient) return ''
  
  // If API URL is provided, derive WebSocket URL from it
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL)
      const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProtocol}//${apiUrl.host}`
    } catch (e) {
      console.error('Invalid API URL:', e)
    }
  }
  
  // Default to IP address for development (helps with browser security restrictions)
  return isDevelopment ? 'ws://127.0.0.1:8000' : 'wss://localhost:8000'
})()

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  refresh: '/api/v1/auth/refresh',
  register: '/api/v1/auth/register',
  
  // Users
  users: '/api/v1/users',
  currentUser: '/api/v1/users/me',
  
  // Websites
  websites: '/api/v1/websites',
  
  // Conversations
  conversations: '/api/v1/conversations',
  
  // Messages
  messages: (conversationId: string) => `/api/v1/conversations/${conversationId}/messages`,
  
  // WebSocket
  wsAgent: (userId: string, token: string) => `${WS_BASE_URL}/ws/agent/${userId}?token=${encodeURIComponent(token)}`,
  wsVisitor: (websiteId: string, visitorId?: string) => {
    const url = `${WS_BASE_URL}/ws/visitor/${websiteId}`
    return visitorId ? `${url}?visitor_id=${visitorId}` : url
  }
}