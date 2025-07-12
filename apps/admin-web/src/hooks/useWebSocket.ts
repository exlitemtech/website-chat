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
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    enabled = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const websocket = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const shouldReconnect = useRef(true)

  const connect = useCallback(() => {
    if (!enabled || !url || websocket.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Don't attempt reconnection if we've exceeded max attempts
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached. Stopping reconnection.')
      setConnectionState('error')
      return
    }

    try {
      console.log('Attempting WebSocket connection to:', url, `(attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
      setConnectionState('connecting')
      websocket.current = new WebSocket(url)

      websocket.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setIsConnected(true)
        setConnectionState('connected')
        reconnectAttempts.current = 0
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
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionState('disconnected')
        onDisconnect?.()

        // Attempt to reconnect if not a manual disconnect and we haven't exceeded attempts
        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts && enabled) {
          reconnectAttempts.current++
          
          // Exponential backoff: 3s, 6s, 12s, 24s, 48s
          const backoffDelay = reconnectInterval * Math.pow(2, reconnectAttempts.current - 1)
          
          console.log(`Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${backoffDelay}ms`)
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, backoffDelay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max WebSocket reconnection attempts reached. Stopping reconnection.')
          setConnectionState('error')
        }
      }

      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionState('error')
        onError?.(error)
      }

    } catch (error) {
      setConnectionState('error')
      console.error('WebSocket connection error:', error)
    }
  }, [enabled, url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    shouldReconnect.current = false
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }

    if (websocket.current) {
      websocket.current.close()
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
      connect()
    } else if (!enabled) {
      disconnect()
    }

    return () => {
      shouldReconnect.current = false
      disconnect()
    }
  }, [enabled, url, connect, disconnect])

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    connectionState
  }
}