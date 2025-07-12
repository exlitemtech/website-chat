import { z } from 'zod'

export const ConversationStatus = z.enum(['open', 'assigned', 'closed', 'archived'])
export type ConversationStatus = z.infer<typeof ConversationStatus>

export const MessageType = z.enum(['text', 'image', 'file', 'system'])
export type MessageType = z.infer<typeof MessageType>

export const Message = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderType: z.enum(['visitor', 'agent']),
  type: MessageType,
  content: z.string(),
  metadata: z.object({
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    fileType: z.string().optional(),
    fileUrl: z.string().url().optional(),
  }).optional(),
  timestamp: z.date(),
  readAt: z.date().optional(),
})

export type Message = z.infer<typeof Message>

export const Conversation = z.object({
  id: z.string(),
  websiteId: z.string(),
  visitorId: z.string(),
  assignedAgentId: z.string().optional(),
  status: ConversationStatus,
  subject: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  tags: z.array(z.string()).default([]),
  lastMessageAt: z.date().optional(),
  closedAt: z.date().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Conversation = z.infer<typeof Conversation>

export const SendMessageRequest = z.object({
  conversationId: z.string(),
  content: z.string(),
  type: MessageType.default('text'),
  metadata: z.object({
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    fileType: z.string().optional(),
  }).optional(),
})

export type SendMessageRequest = z.infer<typeof SendMessageRequest>

export const AssignConversationRequest = z.object({
  conversationId: z.string(),
  agentId: z.string(),
})

export type AssignConversationRequest = z.infer<typeof AssignConversationRequest>

export const UpdateConversationRequest = z.object({
  conversationId: z.string(),
  status: ConversationStatus.optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  subject: z.string().optional(),
})

export type UpdateConversationRequest = z.infer<typeof UpdateConversationRequest>