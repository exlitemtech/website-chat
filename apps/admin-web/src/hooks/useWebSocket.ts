import { useEffect, useRef, useState, useCallback } from 'react'

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
  send: (message: WebSocketMessage) => void
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
  const isConnecting = useRef(false) // Track if we're currently connecting
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
      
      // Browser environment debugging
      if (typeof window !== 'undefined') {
        console.log('🌐 Browser environment details:', {
          location: window.location.href,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
          isSecure: window.location.protocol === 'https:',
          userAgent: navigator.userAgent.substring(0, 100) + '...'
        })
        
        // Check for potential security restrictions
        if (window.location.protocol === 'https:' && url.startsWith('ws:')) {
          console.warn('⚠️ POTENTIAL ISSUE: Trying to connect to WS from HTTPS page (mixed content)')
        }
      }
      
      setConnectionState('connecting')
      
      // Close any existing connection first
      if (websocket.current) {
        // Remove event handlers to prevent callbacks on old connection
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

      // Check for immediate connection issues
      setTimeout(() => {
        if (websocket.current) {
          console.log('🔍 WebSocket state after creation:', {
            readyState: websocket.current.readyState,
            url: websocket.current.url,
            protocol: websocket.current.protocol,
            extensions: websocket.current.extensions
          })
          
          // If it's already closed/closing immediately after creation, that's the browser blocking it
          if (websocket.current.readyState === WebSocket.CLOSED || websocket.current.readyState === WebSocket.CLOSING) {
            console.error('❌ WebSocket was immediately closed by browser - likely security restriction')
          }
        }
      }, 100) // Check after 100ms

      // Set a connection timeout to detect immediate failures
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
        console.log('🔌 WebSocket readyState:', websocket.current?.readyState)
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
        // Check if this is our current websocket
        const currentWs = websocket.current
        if (!currentWs || currentWs !== (event.target as WebSocket)) {
          console.log('⚠️ WebSocket close on stale connection (ignoring)')
          return
        }
        
        const disconnectInfo = {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: currentWs.url,
          timestamp: new Date().toISOString()
        }
        console.log('🔌 WebSocket disconnected:', disconnectInfo)
        
        // Log why the connection closed
        if (disconnectInfo.code === 1006) {
          console.warn('🔌 Connection closed abnormally (1006) - possible network issue')
        } else if (disconnectInfo.code === 1000) {
          console.log('🔌 Connection closed normally (1000)')
        } else {
          console.warn('🔌 Connection closed with code:', disconnectInfo.code)
        }
        
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
          // Note: 1006 (abnormal closure) removed - should allow reconnection for network issues
        ].includes(event.code)

        // Attempt to reconnect if not a manual disconnect and we haven't exceeded attempts
        if (shouldReconnect.current && 
            reconnectAttempts.current < maxReconnectAttempts && 
            enabled && 
            !shouldNotReconnect) {
          reconnectAttempts.current++
          
          // Special handling for 1006 errors - use shorter delays for network issues
          const is1006Error = event.code === 1006
          const baseInterval = is1006Error ? Math.min(reconnectInterval, 2000) : reconnectInterval
          
          // Improved exponential backoff with jitter and longer delays
          const baseDelay = baseInterval * Math.pow(2, reconnectAttempts.current - 1)
          const jitter = Math.random() * 1000 // Add 0-1s random jitter
          const maxDelay = is1006Error ? 15000 : 30000 // Shorter cap for network errors
          const backoffDelay = Math.min(baseDelay, maxDelay) + jitter
          
          console.log(`Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${Math.round(backoffDelay)}ms (Code: ${event.code})`)
          
          // Clear any existing timer
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current)
          }
          
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, backoffDelay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts || shouldNotReconnect) {
          const errorDetails = {
            code: event.code,
            reason: event.reason,
            url: currentWs.url,
            attempts: reconnectAttempts.current,
            shouldNotReconnect,
            maxAttempts: maxReconnectAttempts
          }
          console.error('WebSocket reconnection stopped:', errorDetails)
          setConnectionState('error')
        }
      }

      websocket.current.onerror = (error) => {
        // Check if this is our current websocket
        const currentWs = websocket.current
        if (!currentWs || currentWs !== (error.target as WebSocket)) {
          console.log('⚠️ WebSocket error on stale connection (ignoring)')
          return
        }
        
        const errorInfo = {
          type: error.type,
          target: error.target,
          readyState: currentWs.readyState,
          url: currentWs.url,
          timestamp: new Date().toISOString()
        }
        
        // Don't log errors for connections that are already closed/closing
        if (currentWs.readyState === WebSocket.CLOSED || currentWs.readyState === WebSocket.CLOSING) {
          console.log('⚠️ WebSocket error on already closed connection (ignoring):', errorInfo)
          return
        }
        
        console.error('❌ WebSocket error details:', errorInfo)
        console.error('❌ WebSocket error event:', error)
        setConnectionState('error')
        isConnecting.current = false
        
        // Clear connection timeout
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
      // Close with a clean close code
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

  const send = useCallback((message: WebSocketMessage) => {
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
      // Only connect if URL changed or not connected
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
      // Don't disconnect on cleanup - let it be handled by enabled change
    }
  }, [enabled, url]) // Remove connect and disconnect from dependencies

  // Handle page visibility changes to close connections when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden (tab switched or window minimized)
        // Don't disconnect immediately, just pause heartbeat
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current)
          heartbeatTimer.current = undefined
        }
      } else if (document.visibilityState === 'visible') {
        // Page is visible again
        // Restart heartbeat if connected
        if (websocket.current?.readyState === WebSocket.OPEN) {
          heartbeatTimer.current = setInterval(() => {
            if (websocket.current?.readyState === WebSocket.OPEN) {
              websocket.current.send(JSON.stringify({ type: 'ping' }))
            }
          }, heartbeatInterval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [heartbeatInterval])

  // Handle page unload to properly close connections
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [disconnect])

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    connectionState
  }
}