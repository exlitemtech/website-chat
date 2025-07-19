import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Message, Conversation } from '../types/chat'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { AuthUtils } from '../utils/auth'
import { useWebSocket } from '../hooks/useWebSocket'

interface ChatScreenProps {
  conversation: Conversation
  onBack: () => void
}

interface TypingIndicator {
  conversationId: string
  userId?: string
  visitorId?: string
  senderType: 'visitor' | 'agent'
}

export default function ChatScreen({ conversation, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [visitorTyping, setVisitorTyping] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // WebSocket setup
  const [wsUrl, setWsUrl] = useState<string | null>(null)

  useEffect(() => {
    const setupWebSocket = async () => {
      const token = await AuthUtils.getToken()
      const user = await AuthUtils.getUser()
      if (token && user) {
        setCurrentUserId(user.id)
        const url = API_ENDPOINTS.wsAgent(user.id, token)
        console.log('Setting up WebSocket with URL:', url)
        console.log('User ID:', user.id)
        setWsUrl(url)
      } else {
        console.error('Missing token or user for WebSocket setup')
      }
    }
    setupWebSocket()
  }, [])

  const { isConnected, send: sendWebSocketMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      console.log('WebSocket message received:', message.type, message)
      
      switch (message.type) {
        case 'connection_established':
          console.log('✅ WebSocket connection confirmed by backend:', message)
          break
          
        case 'new_message':
          console.log('🔔 Received new_message via WebSocket:', message.message)
          if (message.message) {
            const messageData = message.message
            
            // Only add if it's for this conversation
            if (messageData.conversation_id === conversation.id) {
              // Don't add messages from the current user to avoid duplicates
              const isFromCurrentUser = messageData.sender === 'agent' && messageData.sender_id === currentUserId
              
              console.log('Message check:', {
                sender: messageData.sender,
                senderId: messageData.sender_id,
                currentUserId: currentUserId,
                isFromCurrentUser
              })
              
              if (!isFromCurrentUser) {
                const newMsg: Message = {
                  id: messageData.id,
                  conversationId: messageData.conversation_id,
                  senderId: messageData.sender_id,
                  senderType: messageData.sender === 'agent' ? 'agent' : 'visitor',
                  type: messageData.type || 'text',
                  content: messageData.content,
                  timestamp: new Date(messageData.timestamp),
                  readAt: messageData.readAt ? new Date(messageData.readAt) : undefined,
                }
                console.log('Adding new message from WebSocket:', newMsg)
                setMessages(prev => [...prev, newMsg])
                
                // Scroll to bottom when new message arrives
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true })
                }, 100)
              } else {
                console.log('Ignoring message from current user to avoid duplicate')
              }
            }
          }
          break
          
        case 'typing_start':
          console.log('👁️ Typing start:', message)
          if (message.conversation_id === conversation.id && message.sender_type === 'visitor') {
            setVisitorTyping(true)
          }
          break
          
        case 'typing_stop':
          console.log('👁️ Typing stop:', message)
          if (message.conversation_id === conversation.id && message.sender_type === 'visitor') {
            setVisitorTyping(false)
          }
          break
          
        default:
          console.log('Unknown WebSocket message type:', message.type)
      }
    },
    onConnect: () => {
      console.log('WebSocket connected, joining conversation:', conversation.id)
      // Join the conversation - use the exact same format as web admin
      sendWebSocketMessage({
        type: 'join_conversation',
        conversation_id: conversation.id
      })
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
    }
  })

  const fetchMessages = async () => {
    console.log('Fetching conversation with messages for ID:', conversation.id)
    setIsLoading(true)
    try {
      const token = await AuthUtils.getToken()
      const user = await AuthUtils.getUser()
      
      // Make sure we have the current user ID before fetching messages
      if (user) {
        setCurrentUserId(user.id)
      }
      
      // Use the same endpoint as web admin - fetch entire conversation with messages
      const url = `${API_BASE_URL}/api/v1/conversations/${conversation.id}`
      console.log('Fetching conversation from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Conversation fetch response status:', response.status)

      if (response.ok) {
        const conversationData = await response.json()
        console.log('Fetched conversation data:', conversationData)
        
        // Extract messages from conversation object
        const messages = conversationData.messages || []
        console.log('Number of messages in conversation:', messages.length)
        
        const messagesWithDates = messages.map((msg: any) => {
          // For agent messages, the sender_id should match our user ID
          const senderId = msg.sender === 'agent' ? 
            (msg.sender_id || user?.id || 'unknown') : 
            (msg.sender_id || conversationData.visitor_id || 'visitor')
            
          return {
            id: msg.id,
            conversationId: conversation.id,
            senderId: senderId,
            senderType: msg.sender === 'agent' ? 'agent' : 'visitor',
            type: msg.type || 'text',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            readAt: msg.readAt ? new Date(msg.readAt) : undefined,
          }
        })
        
        console.log('Current user ID:', user?.id)
        console.log('Processed messages with sender info:', messagesWithDates.map(m => ({
          id: m.id,
          senderId: m.senderId,
          senderType: m.senderType,
          content: m.content.substring(0, 20),
          isOwnMessage: m.senderId === user?.id
        })))
        
        setMessages(messagesWithDates)
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false })
        }, 100)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch conversation:', response.status, errorText)
        Alert.alert('Error', `Failed to load messages: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      Alert.alert('Error', 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [conversation.id])

  const handleTyping = (text: string) => {
    setNewMessage(text)
    
    // Send typing indicator
    if (isConnected && text.length > 0 && !isTyping) {
      setIsTyping(true)
      sendWebSocketMessage({
        type: 'typing_start',
        conversation_id: conversation.id
      })
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isConnected && isTyping) {
          setIsTyping(false)
          sendWebSocketMessage({
            type: 'typing_stop',
            conversation_id: conversation.id
          })
        }
      }, 1000) // Stop typing after 1 second of inactivity
    } else if (isTyping) {
      // If text is empty, stop typing immediately
      setIsTyping(false)
      if (isConnected) {
        sendWebSocketMessage({
          type: 'typing_stop',
          conversation_id: conversation.id
        })
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)
    
    // Stop typing indicator
    if (isTyping && isConnected) {
      setIsTyping(false)
      sendWebSocketMessage({
        type: 'typing_stop',
        conversation_id: conversation.id
      })
    }

    try {
      console.log('Sending message:', messageContent)
      
      // ALWAYS use REST API for persistence to ensure message is saved
      const token = await AuthUtils.getToken()
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.messages(conversation.id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          sender: 'agent'
        }),
      })

      if (response.ok) {
        const newMsg = await response.json()
        console.log('Message sent via REST API:', newMsg)
        
        // Add message to local state immediately for instant feedback
        const messageWithDate: Message = {
          id: newMsg.id,
          conversationId: conversation.id,
          senderId: currentUserId,
          senderType: 'agent',
          type: 'text',
          content: messageContent,
          timestamp: new Date(newMsg.timestamp || new Date()),
          readAt: newMsg.readAt ? new Date(newMsg.readAt) : undefined,
        }
        
        setMessages(prev => [...prev, messageWithDate])

        // IMPORTANT: Don't send via WebSocket for our own messages
        // The backend will handle broadcasting to other clients when we send via REST API
        // This prevents duplicate messages
        console.log('Message sent and added to local state. Backend will broadcast to other clients.')

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      } else {
        throw new Error(`Failed to send message: ${response.status}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message')
      setNewMessage(messageContent) // Restore message text
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessage = ({ item }: { item: Message }) => {
    // Check if message is from current user (agent)
    const isOwnMessage = item.senderType === 'agent' && item.senderId === currentUserId
    
    console.log('Rendering message:', {
      itemSenderId: item.senderId,
      currentUserId: currentUserId,
      senderType: item.senderType,
      isOwnMessage: isOwnMessage,
      content: item.content.substring(0, 20)
    })

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>
              Visitor
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timeText,
            isOwnMessage ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {conversation.subject || `Conversation ${conversation.id.slice(-6)}`}
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {conversation.subject || `Conversation ${conversation.id.slice(-6)}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {conversation.status.toUpperCase()} • {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            visitorTyping ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Visitor is typing...</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            editable={!isSending}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!newMessage.trim() || isSending) ? '#ccc' : '#007AFF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#999',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})