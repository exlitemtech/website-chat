// Chat types for React Native app
export type ConversationStatus = 'open' | 'assigned' | 'closed' | 'archived'
export type MessageType = 'text' | 'image' | 'file' | 'system'
export type SenderType = 'visitor' | 'agent'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: SenderType
  type: MessageType
  content: string
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    fileUrl?: string
  }
  timestamp: Date
  readAt?: Date
}

export interface Conversation {
  id: string
  websiteId: string
  visitorId: string
  assignedAgentId?: string
  status: ConversationStatus
  subject?: string
  priority: Priority
  tags: string[]
  lastMessage?: string
  lastMessageAt?: Date
  closedAt?: Date
  rating?: number
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export interface SendMessageRequest {
  conversationId: string
  content: string
  type?: MessageType
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
  }
}

export interface AssignConversationRequest {
  conversationId: string
  agentId: string
}

export interface UpdateConversationRequest {
  conversationId: string
  status?: ConversationStatus
  priority?: Priority
  tags?: string[]
  subject?: string
}