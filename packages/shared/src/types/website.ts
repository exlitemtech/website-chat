import { z } from 'zod'

export const Website = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  widgetConfig: z.object({
    primaryColor: z.string().default('#3b82f6'),
    position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
    welcomeMessage: z.string().default('Hi! How can we help you?'),
    offlineMessage: z.string().default('We are currently offline. Leave us a message!'),
    enableFileUpload: z.boolean().default(true),
    enableEmoji: z.boolean().default(true),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Website = z.infer<typeof Website>

export const CreateWebsiteRequest = Website.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CreateWebsiteRequest = z.infer<typeof CreateWebsiteRequest>

export const UpdateWebsiteRequest = Website.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type UpdateWebsiteRequest = z.infer<typeof UpdateWebsiteRequest>