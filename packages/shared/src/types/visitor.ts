import { z } from 'zod'

export const VisitorSession = z.object({
  id: z.string(),
  visitorId: z.string(),
  websiteId: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  referrer: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  startedAt: z.date(),
  endedAt: z.date().optional(),
})

export type VisitorSession = z.infer<typeof VisitorSession>

export const PageView = z.object({
  id: z.string(),
  sessionId: z.string(),
  url: z.string(),
  title: z.string(),
  timestamp: z.date(),
  timeOnPage: z.number().optional(),
})

export type PageView = z.infer<typeof PageView>

export const Visitor = z.object({
  id: z.string(),
  websiteId: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
  isIdentified: z.boolean().default(false),
  customData: z.record(z.unknown()).optional(),
  lastSeenAt: z.date(),
  createdAt: z.date(),
})

export type Visitor = z.infer<typeof Visitor>

export const IdentifyVisitorRequest = z.object({
  visitorId: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  customData: z.record(z.unknown()).optional(),
})

export type IdentifyVisitorRequest = z.infer<typeof IdentifyVisitorRequest>