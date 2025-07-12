import { z } from 'zod'

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginRequest = z.infer<typeof LoginRequest>

export const LoginResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(['admin', 'agent', 'manager']),
    websiteIds: z.array(z.string()),
  }),
})

export type LoginResponse = z.infer<typeof LoginResponse>

export const RefreshTokenRequest = z.object({
  refreshToken: z.string(),
})

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequest>

export const RefreshTokenResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponse>