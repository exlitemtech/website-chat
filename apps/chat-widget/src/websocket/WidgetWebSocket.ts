/**
 * WebSocket client for the chat widget
 */

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface WidgetWebSocketOptions {
  websiteId: string
  visitorId: string
  apiUrl: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export class WidgetWebSocket {
  private websocket: WebSocket | null = null
  private options: WidgetWebSocketOptions
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private shouldReconnect = true
  private reconnectTimer: number | null = null

  constructor(options: WidgetWebSocketOptions) {
    this.options = options
  }

  connect(): void {
    if (this.websocket?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      const wsUrl = this.options.apiUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://')
      
      const url = `${wsUrl}/ws/visitor/${this.options.websiteId}?visitor_id=${encodeURIComponent(this.options.visitorId)}`
      
      this.websocket = new WebSocket(url)

      this.websocket.onopen = () => {
        console.log('Widget WebSocket connected')
        this.reconnectAttempts = 0
        this.options.onConnect?.()
      }

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.websocket.onclose = (event) => {
        console.log('Widget WebSocket disconnected')
        this.options.onDisconnect?.()

        // Attempt to reconnect if not a manual disconnect
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          this.reconnectTimer = window.setTimeout(() => {
            this.connect()
          }, this.reconnectInterval)
        }
      }

      this.websocket.onerror = (error) => {
        console.error('Widget WebSocket error:', error)
        this.options.onError?.(error)
      }

    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  send(message: WebSocketMessage): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(message))
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
      }
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    this.options.onMessage?.(message)
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN
  }

  joinConversation(conversationId: string): void {
    this.send({
      type: 'join_conversation',
      conversation_id: conversationId
    })
  }

  sendMessage(conversationId: string, content: string, metadata?: any): void {
    this.send({
      type: 'send_message',
      conversation_id: conversationId,
      content,
      metadata
    })
  }

  startTyping(conversationId: string): void {
    this.send({
      type: 'typing_start',
      conversation_id: conversationId
    })
  }

  stopTyping(conversationId: string): void {
    this.send({
      type: 'typing_stop',
      conversation_id: conversationId
    })
  }
}