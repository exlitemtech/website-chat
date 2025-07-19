import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import LoginScreen from './src/screens/LoginScreen'
import ConversationsScreen from './src/screens/ConversationsScreen'
import ChatScreen from './src/screens/ChatScreen'
import { AuthUtils } from './src/utils/auth'
import { Conversation } from './src/types/chat'

type AppState = 'loading' | 'login' | 'conversations' | 'chat'

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await AuthUtils.isAuthenticated()
      setAppState(isAuthenticated ? 'conversations' : 'login')
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAppState('login')
    }
  }

  const handleLoginSuccess = () => {
    console.log('Login successful, switching to conversations view')
    setAppState('conversations')
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setAppState('chat')
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setAppState('conversations')
  }

  const handleLogout = async () => {
    await AuthUtils.logout()
    setAppState('login')
    setSelectedConversation(null)
  }

  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  console.log('App render - appState:', appState)
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {appState === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
      
      {appState === 'conversations' && (
        <ConversationsScreen onConversationSelect={handleConversationSelect} />
      )}
      
      {appState === 'chat' && selectedConversation && (
        <ChatScreen 
          conversation={selectedConversation} 
          onBack={handleBackToConversations}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
})