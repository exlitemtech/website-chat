'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WebSocketContextType {
  globalConnectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
  setGlobalConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void
  connectionErrors: string[]
  addConnectionError: (error: string) => void
  clearConnectionErrors: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [globalConnectionStatus, setGlobalConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected')
  const [connectionErrors, setConnectionErrors] = useState<string[]>([])
  
  const addConnectionError = (error: string) => {
    setConnectionErrors(prev => {
      const newErrors = [...prev, error]
      // Keep only last 5 errors
      return newErrors.slice(-5)
    })
  }
  
  const clearConnectionErrors = () => {
    setConnectionErrors([])
  }
  
  // Auto-clear errors after 30 seconds
  useEffect(() => {
    if (connectionErrors.length > 0) {
      const timer = setTimeout(() => {
        clearConnectionErrors()
      }, 30000)
      
      return () => clearTimeout(timer)
    }
  }, [connectionErrors])
  
  return (
    <WebSocketContext.Provider value={{
      globalConnectionStatus,
      setGlobalConnectionStatus,
      connectionErrors,
      addConnectionError,
      clearConnectionErrors
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}