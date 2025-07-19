import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types/user'

const TOKEN_KEY = 'accessToken'
const USER_KEY = 'user'

export const AuthUtils = {
  // Token management
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('Error setting token:', error)
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Error removing token:', error)
    }
  },

  // User management
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY)
      if (!userData) return null
      
      const user = JSON.parse(userData)
      // Convert date strings back to Date objects
      return {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Error setting user:', error)
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error('Error removing user:', error)
    }
  },

  // Authentication state
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken()
    const user = await this.getUser()
    return !!(token && user)
  },

  // Clear all auth data
  async logout(): Promise<void> {
    await this.removeToken()
    await this.removeUser()
  }
}