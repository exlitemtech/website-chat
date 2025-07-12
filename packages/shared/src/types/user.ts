import { z } from 'zod'

export const UserRole = z.enum(['admin', 'agent', 'manager'])
export type UserRole = z.infer<typeof UserRole>

export const UserStatus = z.enum(['active', 'inactive', 'pending'])
export type UserStatus = z.infer<typeof UserStatus>

export const User = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().url().optional(),
  role: UserRole,
  status: UserStatus,
  websiteIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof User>

export const CreateUserRequest = User.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CreateUserRequest = z.infer<typeof CreateUserRequest>

export const UpdateUserRequest = User.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>