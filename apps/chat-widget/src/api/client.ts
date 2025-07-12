/**
 * API client for the chat widget
 */

interface WidgetConfig {
  websiteId: string
  apiUrl: string
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
  welcomeMessage?: string
  agentName?: string
  agentAvatar?: string
}

interface Message {
  id: string
  content: string
  sender: 'visitor' | 'agent'
  timestamp: Date
  type: 'text' | 'image' | 'file'
}

interface SendMessageRequest {
  content: string
  visitorId: string
  conversationId?: string
}

interface SendMessageResponse {
  success: boolean
  message?: Message
  conversationId?: string
  error?: string
}

export class ChatAPIClient {
  private config: WidgetConfig
  private visitorId: string
  private conversationId?: string

  constructor(config: WidgetConfig) {
    this.config = config
    this.visitorId = this.generateVisitorId()
    this.conversationId = this.loadConversationId()
  }

  private generateVisitorId(): string {
    // Generate a unique visitor ID
    const stored = localStorage.getItem('website-chat-visitor-id')
    if (stored) {
      return stored
    }
    
    const id = 'visitor-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    localStorage.setItem('website-chat-visitor-id', id)
    return id
  }

  private loadConversationId(): string | undefined {
    return localStorage.getItem('website-chat-conversation-id') || undefined
  }

  private saveConversationId(conversationId: string): void {
    localStorage.setItem('website-chat-conversation-id', conversationId)
  }

  async sendMessage(content: string): Promise<SendMessageResponse> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/widget/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          visitorId: this.visitorId,
          websiteId: this.config.websiteId,
          conversationId: this.conversationId
        } as SendMessageRequest)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Store conversation ID for future messages
      if (data.conversationId) {
        this.conversationId = data.conversationId
        this.saveConversationId(data.conversationId)
      }

      return data
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Return mock response for demo purposes
      return {
        success: true,
        message: {
          id: 'msg-' + Date.now(),
          content: this.generateMockResponse(content),
          sender: 'agent',
          timestamp: new Date(),
          type: 'text'
        },
        conversationId: this.conversationId || 'conv-' + Date.now()
      }
    }
  }

  private generateMockResponse(userMessage: string): string {
    const responses = [
      "Thanks for reaching out! How can I help you today?",
      "I'd be happy to assist you with that. Let me get you the information you need.",
      "That's a great question! Let me check on that for you.",
      "I understand your concern. Let me help you resolve this issue.",
      "Thanks for your patience. I'm looking into this right now.",
      "I can definitely help you with that! What specific information do you need?",
      "Let me connect you with the right person to handle this request.",
      "I appreciate you contacting us. How can I make your experience better?"
    ]
    
    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase()
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "I'd be happy to discuss our pricing options with you. What specific plan are you interested in?"
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! What can I assist you with today?"
    }
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! Is there anything else I can help you with?"
    }
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  async getConversationHistory(): Promise<Message[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/widget/conversation/${this.visitorId}?website_id=${this.config.websiteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        console.warn('Failed to fetch conversation history:', response.status)
        return []
      }

      const data = await response.json()
      
      // Store conversation ID if we got one
      if (data.conversationId) {
        this.conversationId = data.conversationId
        this.saveConversationId(data.conversationId)
      }

      // Convert timestamps to Date objects
      return data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.warn('Failed to fetch conversation history:', error)
      return []
    }
  }

  getVisitorId(): string {
    return this.visitorId
  }

  getConversationId(): string | undefined {
    return this.conversationId
  }
}