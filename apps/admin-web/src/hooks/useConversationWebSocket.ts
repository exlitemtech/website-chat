import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import { useNotifications } from './useNotifications'

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
    currentConversationId
  } = options

  const notifications = useNotifications()

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Construct WebSocket URL
  const wsUrl = userId && token 
    ? `ws://localhost:8002/ws/agent/${userId}?token=${encodeURIComponent(token)}`
    : null

  const handleMessage = useCallback((message: any) => {
    setConnectionError(null)
    
    switch (message.type) {
      case 'connection_established':
        console.log('WebSocket connected:', message)
        break
        
      case 'new_message':
        if (message.message) {
          onNewMessage?.(message.message)
          
          // Show notification for new messages from visitors
          if (enableNotifications && 
              message.message.sender === 'visitor' && 
              message.message.sender_id !== userId &&
              (!currentConversationId || currentConversationId !== message.message.conversation_id)) {
            
            const visitorName = message.visitor_name || `Visitor ${message.message.sender_id.slice(-4)}`
            const messageContent = message.message.content || 'New message received'
            
            // Check if this is marked as urgent
            const isUrgent = message.message.metadata?.urgent || 
                           messageContent.toLowerCase().includes('urgent') ||
                           messageContent.toLowerCase().includes('help')
            
            if (isUrgent) {
              notifications.showUrgentMessage(
                message.message.conversation_id,
                visitorName,
                messageContent
              )
            } else {
              notifications.showNewMessage(
                message.message.conversation_id,
                visitorName,
                messageContent
              )
            }
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
    setConnectionError('Connection error occurred')
  }, [])

  const { isConnected, send, disconnect, reconnect, connectionState } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
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