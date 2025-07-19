// User types for React Native app
export type UserRole = 'admin' | 'agent' | 'manager'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  status: UserStatus
  websiteIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserRequest {
  email: string
  name: string
  avatar?: string
  role: UserRole
  status: UserStatus
  websiteIds: string[]
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  avatar?: string
  role?: UserRole
  status?: UserStatus
  websiteIds?: string[]
}