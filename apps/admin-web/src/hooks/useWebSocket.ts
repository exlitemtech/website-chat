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
    maxReconnectAttempts = 5
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const websocket = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const shouldReconnect = useRef(true)

  const connect = useCallback(() => {
    if (!url || websocket.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      setConnectionState('connecting')
      websocket.current = new WebSocket(url)

      websocket.current.onopen = () => {
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
        setIsConnected(false)
        setConnectionState('disconnected')
        onDisconnect?.()

        // Attempt to reconnect if not a manual disconnect
        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          reconnectTimer.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      websocket.current.onerror = (error) => {
        setConnectionState('error')
        onError?.(error)
      }

    } catch (error) {
      setConnectionState('error')
      console.error('WebSocket connection error:', error)
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

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
    if (url) {
      connect()
    }

    return () => {
      shouldReconnect.current = false
      disconnect()
    }
  }, [url, connect, disconnect])

  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    connectionState
  }
}