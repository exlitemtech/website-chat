import { useEffect, useRef, useState, useCallback } from 'react'
import { AppState } from 'react-native'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  enabled?: boolean
}

interface UseWebSocketReturn {
  isConnected: boolean
  send: (message: WebSocketMessage) => boolean
  disconnect: () => void
  reconnect: () => void
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 3,
    enabled = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const websocket = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const shouldReconnect = useRef(true)
  const lastUrl = useRef<string | null>(null)
  const heartbeatTimer = useRef<NodeJS.Timeout>()
  const heartbeatInterval = 30000 // 30 seconds
  const lastConnectionAttempt = useRef<number>(0)
  const minConnectionInterval = 1000 // Minimum 1 second between connection attempts
  const isConnecting = useRef(false)
  const connectionTimeout = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (!enabled || !url || isConnecting.current || websocket.current?.readyState === WebSocket.CONNECTING) {
      return
    }
    
    // Skip if already connected to the same URL
    if (websocket.current?.readyState === WebSocket.OPEN && lastUrl.current === url) {
      return
    }

    // Don't attempt reconnection if we've exceeded max attempts
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached. Stopping reconnection.')
      setConnectionState('error')
      return
    }

    // Prevent rapid connection attempts
    const now = Date.now()
    if (now - lastConnectionAttempt.current < minConnectionInterval) {
      console.log('Connection attempt too soon, waiting...')
      setTimeout(() => connect(), minConnectionInterval - (now - lastConnectionAttempt.current))
      return
    }
    lastConnectionAttempt.current = now
    isConnecting.current = true

    try {
      console.log('🔌 Attempting WebSocket connection to:', url, `(attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
      
      setConnectionState('connecting')
      
      // Close any existing connection first
      if (websocket.current) {
        websocket.current.onopen = null
        websocket.current.onclose = null
        websocket.current.onmessage = null
        websocket.current.onerror = null
        
        if (websocket.current.readyState === WebSocket.OPEN || websocket.current.readyState === WebSocket.CONNECTING) {
          websocket.current.close()
        }
        websocket.current = null
      }
      
      console.log('🚀 Creating WebSocket instance...')
      websocket.current = new WebSocket(url)
      console.log('✅ WebSocket instance created, readyState:', websocket.current.readyState)
      lastUrl.current = url

      // Set a connection timeout
      connectionTimeout.current = setTimeout(() => {
        if (websocket.current && websocket.current.readyState === WebSocket.CONNECTING) {
          console.warn('⏰ WebSocket connection timeout after 10s, closing...')
          websocket.current.close()
          isConnecting.current = false
          setConnectionState('error')
        }
      }, 10000) // 10 second timeout

      websocket.current.onopen = () => {
        console.log('🔌 WebSocket connected successfully to:', url)
        setIsConnected(true)
        setConnectionState('connected')
        reconnectAttempts.current = 0
        isConnecting.current = false
        
        // Clear connection timeout
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current)
          connectionTimeout.current = undefined
        }
        
        // Start heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
        }
        heartbeatTimer.current = setInterval(() => {
          if (websocket.current?.readyState === WebSocket.OPEN) {
            websocket.current.send(JSON.stringify({ type: 'ping' }))
          }
        }, heartbeatInterval)
        
        onConnect?.()
      }

      websocket.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      websocket.current.onclose = (event) => {
        const currentWs = websocket.current
        if (!currentWs || currentWs !== (event.target as WebSocket)) {
          console.log('⚠️ WebSocket close on stale connection (ignoring)')
          return
        }
        
        console.log('🔌 WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: currentWs.url
        })
        
        setIsConnected(false)
        setConnectionState('disconnected')
        isConnecting.current = false
        
        // Clear connection timeout
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current)
          connectionTimeout.current = undefined
        }
        
        // Stop heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = undefined
        }
        
        onDisconnect?.()

        // Don't reconnect for certain error codes
        const shouldNotReconnect = [
          4001, // Unauthorized
          4002, // Idle timeout
          4004, // Website not found
          4008, // Server at capacity
          4009, // Connection limit reached
          4010, // Connection replaced
        ].includes(event.code)

        // Attempt to reconnect if not a manual disconnect
        if (shouldReconnect.current && 
            reconnectAttempts.current < maxReconnectAttempts && 
            enabled && 
            !shouldNotReconnect) {
          reconnectAttempts.current++
          
          const baseDelay = reconnectInterval * Math.pow(2, reconnectAttempts.current - 1)
          const jitter = Math.random() * 1000
          const maxDelay = 30000
          const backoffDelay = Math.min(baseDelay, maxDelay) + jitter
          
          console.log(`Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${Math.round(backoffDelay)}ms`)
          
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current)
          }
          
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, backoffDelay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts || shouldNotReconnect) {
          console.error('WebSocket reconnection stopped')
          setConnectionState('error')
        }
      }

      websocket.current.onerror = (error) => {
        const currentWs = websocket.current
        if (!currentWs || currentWs !== (error.target as WebSocket)) {
          console.log('⚠️ WebSocket error on stale connection (ignoring)')
          return
        }
        
        console.error('❌ WebSocket error:', error)
        setConnectionState('error')
        isConnecting.current = false
        
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current)
          connectionTimeout.current = undefined
        }
        
        onError?.(error)
      }

    } catch (error) {
      setConnectionState('error')
      isConnecting.current = false
      console.error('WebSocket connection error:', error)
    }
  }, [enabled, url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    shouldReconnect.current = false
    isConnecting.current = false
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = undefined
    }

    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = undefined
    }

    if (websocket.current) {
      if (websocket.current.readyState === WebSocket.OPEN || websocket.current.readyState === WebSocket.CONNECTING) {
        websocket.current.close(1000, 'Manual disconnect')
      }
      websocket.current = null
    }
    
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    shouldReconnect.current = true
    reconnectAttempts.current = 0
    connect()
  }, [connect, disconnect])

  const send = useCallback((message: WebSocketMessage): boolean => {
    if (websocket.current?.readyState === WebSocket.OPEN) {
      try {
        websocket.current.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        return false
      }
    } else {
      console.warn('WebSocket is not connected, message not sent:', message)
      return false
    }
  }, [])

  useEffect(() => {
    if (enabled && url) {
      if (lastUrl.current !== url || websocket.current?.readyState !== WebSocket.OPEN) {
        connect()
      }
    } else if (!enabled) {
      disconnect()
    }

    return () => {
      shouldReconnect.current = false
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
        heartbeatTimer.current = undefined
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = undefined
      }
    }
  }, [enabled, url])

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // App is going to background, pause heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = undefined
        }
      } else if (nextAppState === 'active') {
        // App is becoming active, restart heartbeat if connected
        if (websocket.current?.readyState === WebSocket.OPEN) {
          heartbeatTimer.current = setInterval(() => {
            if (websocket.current?.readyState === WebSocket.OPEN) {
              websocket.current.send(JSON.stringify({ type: 'ping' }))
            }
          }, heartbeatInterval)
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    
    return () => {
      subscription?.remove()
    }
  }, [heartbeatInterval])

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    connectionState
  }
}