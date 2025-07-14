import { useEffect, useState, useCallback, useMemo } from 'react'
import { useWebSocket } from './useWebSocket'
import { useNotifications } from './useNotifications'
import { API_ENDPOINTS } from '@/config/api'

// Simple JWT token validation
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const timeToExpiry = exp - now
    
    console.log('JWT Token Debug:', {
      userId: payload.sub,
      expiresAt: new Date(exp).toISOString(),
      currentTime: new Date(now).toISOString(),
      timeToExpiry: `${Math.round(timeToExpiry / 1000)}s`,
      isExpired: now >= exp
    })
    
    return now >= exp
  } catch (error) {
    console.error('Error parsing JWT token:', error)
    return true // Assume expired if can't parse
  }
}

interface Message {
  id: string
  content: string
  sender: 'visitor' | 'agent'
  sender_id: string
  timestamp: string
  conversation_id: string
  metadata?: any
}

interface TypingIndicator {
  user_id?: string
  visitor_id?: string
  sender_type: 'visitor' | 'agent'
  conversation_id: string
}

interface UseConversationWebSocketOptions {
  userId: string
  token: string
  conversationId?: string
  onNewMessage?: (message: Message) => void
  onTypingStart?: (typing: TypingIndicator) => void
  onTypingStop?: (typing: TypingIndicator) => void
  onAgentJoined?: (data: any) => void
  onAgentLeft?: (data: any) => void
  onVisitorJoined?: (data: any) => void
  enableNotifications?: boolean
  currentConversationId?: string
  enabled?: boolean
}

export function useConversationWebSocket(options: UseConversationWebSocketOptions) {
  const {
    userId,
    token,
    conversationId,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    onAgentJoined,
    onAgentLeft,
    onVisitorJoined,
    enableNotifications = true,
    currentConversationId,
    enabled = true
  } = options

  const notifications = useNotifications()

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Check token expiration before creating WebSocket URL
  const isTokenValid = token && !isTokenExpired(token)
  
  // Memoize WebSocket URL to prevent unnecessary reconnections
  const wsUrl = useMemo(() => {
    if (userId && token && isTokenValid) {
      const url = API_ENDPOINTS.wsAgent(userId, token)
      console.log('🔗 WebSocket URL created:', url.substring(0, 100) + '...')
      return url
    }
    console.log('🔗 WebSocket URL not created - missing requirements:', {
      hasUserId: !!userId,
      hasToken: !!token,
      isTokenValid,
      tokenLength: token?.length || 0
    })
    return null
  }, [userId, token, isTokenValid])
    
  // Debug WebSocket URL construction
  useEffect(() => {
    if (wsUrl) {
      console.log('WebSocket URL constructed:', wsUrl)
      console.log('Token length:', token?.length)
      console.log('Token starts with:', token?.substring(0, 20) + '...')
    }
  }, [wsUrl, token])
  
  // Track token expiration
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      console.warn('JWT token is expired, WebSocket connection will fail')
      setConnectionError('Authentication token expired')
    } else if (token) {
      console.log('JWT token is valid for WebSocket connection')
    }
  }, [token])

  const handleMessage = useCallback((message: any) => {
    setConnectionError(null)
    console.log('WebSocket message received:', message.type, message)
    
    switch (message.type) {
      case 'connection_established':
        console.log('✅ WebSocket connection confirmed by backend:', message)
        break
        
      case 'new_message':
        console.log('🔔 Received new_message via WebSocket:', message.message)
        if (message.message) {
          console.log('🔔 Calling onNewMessage callback with:', message.message)
          onNewMessage?.(message.message)
          
          // Show notification for new messages from visitors
          if (enableNotifications && 
              message.message.sender === 'visitor' && 
              message.message.sender_id !== userId &&
              (!currentConversationId || currentConversationId !== message.message.conversation_id)) {
            
            console.log('Triggering notification for visitor message:', message.message)
            
            const visitorName = message.visitor_name || `Visitor ${message.message.sender_id.slice(-4)}`
            const messageContent = message.message.content || 'New message received'
            
            // Check if this is marked as urgent
            const isUrgent = message.message.metadata?.urgent || 
                           messageContent.toLowerCase().includes('urgent') ||
                           messageContent.toLowerCase().includes('help')
            
            if (isUrgent) {
              console.log('Showing urgent message notification')
              notifications.showUrgentMessage(
                message.message.conversation_id,
                visitorName,
                messageContent
              )
            } else {
              console.log('Showing new message notification')
              notifications.showNewMessage(
                message.message.conversation_id,
                visitorName,
                messageContent
              )
            }
          } else {
            console.log('Notification not triggered. enableNotifications:', enableNotifications, 
                       'sender:', message.message?.sender, 
                       'currentConversationId:', currentConversationId,
                       'messageConversationId:', message.message?.conversation_id)
          }
        }
        break
        
      case 'typing_start':
        const startTypingId = message.user_id || message.visitor_id
        if (startTypingId && startTypingId !== userId) {
          setTypingUsers(prev => new Set(prev).add(startTypingId))
          onTypingStart?.(message)
        }
        break
        
      case 'typing_stop':
        const stopTypingId = message.user_id || message.visitor_id
        if (stopTypingId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(stopTypingId)
            return newSet
          })
          onTypingStop?.(message)
        }
        break
        
      case 'agent_joined':
        onAgentJoined?.(message)
        break
        
      case 'agent_left':
        onAgentLeft?.(message)
        break
        
      case 'visitor_joined':
        onVisitorJoined?.(message)
        
        // Show notification for new conversations
        if (enableNotifications && message.conversation_id && message.is_new_conversation) {
          const visitorName = message.visitor_name || `Visitor ${message.visitor_id?.slice(-4) || 'Unknown'}`
          const websiteName = message.website_name || 'Website'
          
          notifications.showNewConversation(
            message.conversation_id,
            visitorName,
            websiteName
          )
        }
        
        // Show visitor activity notification if enabled
        if (enableNotifications && message.visitor_count && message.website_name) {
          notifications.showVisitorActivity(message.website_name, message.visitor_count)
        }
        break
        
      case 'error':
        console.error('WebSocket error:', message.message)
        setConnectionError(message.message)
        break
        
      default:
        console.log('Unknown message type:', message.type, message)
    }
  }, [userId, onNewMessage, onTypingStart, onTypingStop, onAgentJoined, onAgentLeft, onVisitorJoined, enableNotifications, currentConversationId, notifications])

  const handleConnect = useCallback(() => {
    console.log('WebSocket connected')
    setConnectionError(null)
    
    // Join conversation if specified
    if (conversationId) {
      send({
        type: 'join_conversation',
        conversation_id: conversationId
      })
    }
  }, [conversationId])

  const handleDisconnect = useCallback(() => {
    console.log('WebSocket disconnected')
    setTypingUsers(new Set())
  }, [])

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error)
    
    // Check if this might be a token expiration issue
    const wsTarget = error.target as WebSocket
    if (wsTarget && wsTarget.readyState === WebSocket.CLOSED) {
      console.warn('WebSocket immediately closed - possible authentication issue')
      console.warn('WebSocket URL:', wsTarget.url)
      
      // Log connection debugging info
      console.group('WebSocket Connection Debug')
      console.log('URL:', wsTarget.url)
      console.log('ReadyState:', wsTarget.readyState)
      console.log('UserId:', userId)
      console.log('Token Valid:', isTokenValid)
      if (token) {
        isTokenExpired(token) // This will log token debug info
      }
      console.groupEnd()
      
      setConnectionError('Connection failed - check authentication')
    } else {
      setConnectionError('Connection error occurred')
    }
  }, [userId, token, isTokenValid])

  const { isConnected, send, disconnect, reconnect, connectionState } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    reconnectInterval: 3000, // Faster initial reconnect
    maxReconnectAttempts: 5, // More attempts for better resilience
    enabled: enabled && !!userId && !!token
  })

  // Join/leave conversation when conversationId changes
  useEffect(() => {
    if (isConnected && conversationId) {
      send({
        type: 'join_conversation',
        conversation_id: conversationId
      })
      
      return () => {
        send({
          type: 'leave_conversation',
          conversation_id: conversationId
        })
      }
    }
  }, [isConnected, conversationId, send])

  const sendMessage = useCallback((content: string, metadata?: any) => {
    if (!conversationId) {
      console.warn('Cannot send message: no conversation ID')
      return
    }
    
    send({
      type: 'send_message',
      conversation_id: conversationId,
      content,
      metadata
    })
  }, [conversationId, send])

  const startTyping = useCallback(() => {
    if (conversationId) {
      send({
        type: 'typing_start',
        conversation_id: conversationId
      })
    }
  }, [conversationId, send])

  const stopTyping = useCallback(() => {
    if (conversationId) {
      send({
        type: 'typing_stop',
        conversation_id: conversationId
      })
    }
  }, [conversationId, send])

  const joinConversation = useCallback((newConversationId: string) => {
    send({
      type: 'join_conversation',
      conversation_id: newConversationId
    })
  }, [send])

  const leaveConversation = useCallback((leaveConversationId: string) => {
    send({
      type: 'leave_conversation',
      conversation_id: leaveConversationId
    })
  }, [send])

  return {
    isConnected,
    connectionState,
    connectionError,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    disconnect,
    reconnect
  }
}