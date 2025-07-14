import { useEffect, useRef, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

interface UseWebSocketWithHeartbeatOptions {
  onMessage?: (message: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  heartbeatInterval?: number
  enabled?: boolean
}

export function useWebSocketWithHeartbeat(
  url: string | null,
  options: UseWebSocketWithHeartbeatOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    heartbeatInterval = 30000, // 30 seconds
    enabled = true
  } = options
  
  const heartbeatTimer = useRef<NodeJS.Timeout>()
  const lastPongTime = useRef<number>(Date.now())
  
  const handleMessage = useCallback((message: any) => {
    // Handle pong messages
    if (message.type === 'pong') {
      lastPongTime.current = Date.now()
      console.log('Heartbeat pong received')
      return
    }
    
    // Pass other messages to the handler
    onMessage?.(message)
  }, [onMessage])
  
  const handleConnect = useCallback(() => {
    console.log('WebSocket connected with heartbeat')
    lastPongTime.current = Date.now()
    onConnect?.()
  }, [onConnect])
  
  const handleDisconnect = useCallback(() => {
    // Clear heartbeat timer
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
    }
    onDisconnect?.()
  }, [onDisconnect])
  
  const { isConnected, send, disconnect, reconnect, connectionState } = useWebSocket(url, {
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError,
    reconnectInterval: 2000,
    maxReconnectAttempts: 10,
    enabled
  })
  
  // Setup heartbeat
  useEffect(() => {
    if (isConnected) {
      // Clear existing timer
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
      }
      
      // Send initial ping
      send({ type: 'ping' })
      
      // Setup heartbeat interval
      heartbeatTimer.current = setInterval(() => {
        // Check if we've received a pong recently
        const timeSinceLastPong = Date.now() - lastPongTime.current
        if (timeSinceLastPong > heartbeatInterval * 2) {
          console.warn('No heartbeat response, reconnecting...')
          reconnect()
          return
        }
        
        // Send ping
        send({ type: 'ping' })
      }, heartbeatInterval)
    }
    
    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current)
      }
    }
  }, [isConnected, send, reconnect, heartbeatInterval])
  
  return {
    isConnected,
    send,
    disconnect,
    reconnect,
    connectionState
  }
}