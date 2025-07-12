'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from '@website-chat/ui'
import { ArrowLeft, Send, User, Globe, Clock, CheckCircle, AlertCircle, Phone, Mail, MapPin, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useConversationWebSocket } from '@/hooks/useConversationWebSocket'

interface Message {
  id: string
  content: string
  sender: 'visitor' | 'agent'
  timestamp: string
  type: 'text' | 'image' | 'file'
}

interface Visitor {
  name: string
  email?: string
  phone?: string
  location?: string
  userAgent?: string
  referrer?: string
  visitCount: number
  firstVisit: string
  currentPage: string
}

interface Conversation {
  id: string
  website_name: string
  website_domain: string
  visitor: Visitor
  status: 'active' | 'waiting' | 'resolved'
  priority: 'high' | 'normal' | 'low'
  assignedAgent?: string
  tags: string[]
  created_at: string
  messages: Message[]
}

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.id as string
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messagesSentViaSocket, setMessagesSentViaSocket] = useState<Set<string>>(new Set())
  const [serverError, setServerError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Get real user data from localStorage
  const currentUser = (() => {
    if (typeof window === 'undefined') return { id: '', token: '' }
    
    const token = localStorage.getItem('accessToken') || ''
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : { id: '' }
    
    return {
      id: user.id || '',
      token: token
    }
  })()

  // WebSocket connection for real-time updates
  const {
    isConnected,
    connectionError,
    typingUsers,
    sendMessage: sendWebSocketMessage,
    startTyping,
    stopTyping
  } = useConversationWebSocket({
    userId: currentUser.id,
    token: currentUser.token,
    conversationId,
    enableNotifications: false, // Disable notifications in conversation view since user is actively viewing
    currentConversationId: conversationId, // Mark this as the currently viewed conversation
    onNewMessage: (message) => {
      if (conversation) {
        const newMsg: Message = {
          id: message.id,
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp,
          type: 'text'
        }
        
        // Avoid duplicate messages - check if message already exists
        setConversation(prev => {
          if (!prev) return null
          
          const messageExists = prev.messages.some(msg => 
            msg.id === newMsg.id || 
            (msg.content === newMsg.content && 
             msg.sender === newMsg.sender && 
             Math.abs(new Date(msg.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 5000)
          )
          
          if (messageExists) {
            console.log('Message already exists, skipping duplicate')
            return prev
          }
          
          return {
            ...prev,
            messages: [...prev.messages, newMsg]
          }
        })
      }
    },
    onTypingStart: (typing) => {
      console.log('User started typing:', typing)
    },
    onTypingStop: (typing) => {
      console.log('User stopped typing:', typing)
    }
  })

  // Mock data loading - DISABLED
  useEffect(() => {
    // Disabled mock data
    return
    setTimeout(() => {
      const mockConversation: Conversation = {
        id: conversationId,
        website_name: 'My E-commerce Store',
        website_domain: 'store.example.com',
        visitor: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY, USA',
          userAgent: 'Chrome 120.0 on macOS',
          referrer: 'https://google.com/search?q=best+products',
          visitCount: 3,
          firstVisit: '2024-01-10T14:30:00Z',
          currentPage: '/products/wireless-headphones'
        },
        status: 'active',
        priority: 'normal',
        assignedAgent: 'You',
        tags: ['support', 'product-inquiry'],
        created_at: '2024-01-15T09:15:00Z',
        messages: [
          {
            id: 'msg-1',
            content: 'Hi there! I\'m interested in your wireless headphones. Do you have any with noise cancellation?',
            sender: 'visitor',
            timestamp: '2024-01-15T09:15:00Z',
            type: 'text'
          },
          {
            id: 'msg-2',
            content: 'Hello John! Thanks for reaching out. Yes, we have several excellent noise-cancelling headphones. Our Sony WH-1000XM5 and Bose QuietComfort models are very popular. What\'s your budget range?',
            sender: 'agent',
            timestamp: '2024-01-15T09:17:00Z',
            type: 'text'
          },
          {
            id: 'msg-3',
            content: 'I\'m looking to spend around $200-300. Which one would you recommend in that price range?',
            sender: 'visitor',
            timestamp: '2024-01-15T09:20:00Z',
            type: 'text'
          },
          {
            id: 'msg-4',
            content: 'Perfect! For that budget, I\'d highly recommend the Sony WH-1000XM4. They\'re currently on sale for $279 (down from $349). They offer excellent noise cancellation, 30-hour battery life, and superior sound quality. Would you like me to send you a link to check them out?',
            sender: 'agent',
            timestamp: '2024-01-15T09:22:00Z',
            type: 'text'
          },
          {
            id: 'msg-5',
            content: 'That sounds great! Yes, please send me the link. Also, do you offer any warranty on these?',
            sender: 'visitor',
            timestamp: '2024-01-15T09:25:00Z',
            type: 'text'
          }
        ]
      }
      setConversation(mockConversation)
      setLoading(false)
    }, 500)
  }, [conversationId])

  // Load conversation data from API - simplified to prevent loops
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadConversation = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          console.log('No token found')
          setLoading(false)
          return
        }

        const response = await fetch(`http://localhost:8000/api/v1/conversations/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Transform API response to frontend format
          const transformedConversation: Conversation = {
            id: data.id,
            website_name: data.website_name || 'Unknown Website',
            website_domain: data.website_domain || 'unknown.com',
            visitor: {
              name: data.visitor_name || 'Anonymous User',
              email: data.visitor_email,
              phone: undefined,
              location: undefined,
              userAgent: undefined,
              referrer: undefined,
              visitCount: 1,
              firstVisit: data.created_at,
              currentPage: '/'
            },
            status: (data.status as 'active' | 'waiting' | 'resolved') || 'active',
            priority: 'normal',
            assignedAgent: 'You',
            tags: [],
            created_at: data.created_at,
            messages: (data.messages || []).map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender as 'visitor' | 'agent',
              timestamp: msg.timestamp,
              type: 'text' as const
            }))
          }
          
          setConversation(transformedConversation)
        } else if (response.status === 404) {
          console.error('Conversation not found')
          setConversation(null)
        } else if (response.status === 500) {
          console.error('Server error loading conversation')
          setServerError('Server error loading conversation. Some features may not work properly.')
          // Create a fallback conversation object for better UX
          const fallbackConversation: Conversation = {
            id: conversationId,
            website_name: 'Website',
            website_domain: 'unknown.com',
            visitor: {
              name: 'Unknown Visitor',
              email: undefined,
              phone: undefined,
              location: undefined,
              userAgent: undefined,
              referrer: undefined,
              visitCount: 1,
              firstVisit: new Date().toISOString(),
              currentPage: '/'
            },
            status: 'active',
            priority: 'normal',
            assignedAgent: 'You',
            tags: [],
            created_at: new Date().toISOString(),
            messages: []
          }
          setConversation(fallbackConversation)
        } else {
          console.error('Failed to fetch conversation:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Error loading conversation:', error)
        setServerError('Network error loading conversation. Using offline mode.')
        // Show fallback conversation for network errors
        const fallbackConversation: Conversation = {
          id: conversationId,
          website_name: 'Website',
          website_domain: 'unknown.com',
          visitor: {
            name: 'Unknown Visitor',
            email: undefined,
            phone: undefined,
            location: undefined,
            userAgent: undefined,
            referrer: undefined,
            visitCount: 1,
            firstVisit: new Date().toISOString(),
            currentPage: '/'
          },
          status: 'active',
          priority: 'normal',
          assignedAgent: 'You',
          tags: [],
          created_at: new Date().toISOString(),
          messages: []
        }
        setConversation(fallbackConversation)
      } finally {
        setLoading(false)
      }
    }

    loadConversation()
  }, [conversationId]) // Include conversationId as dependency

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage
    const tempId = 'temp-' + Date.now()
    
    try {
      // Create temporary message for immediate UI feedback
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender: 'agent',
        timestamp: new Date().toISOString(),
        type: 'text'
      }
      
      // Add temp message to UI
      if (conversation) {
        setConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, tempMessage]
        } : null)
      }
      
      // Clear input immediately for better UX
      setNewMessage('')
      stopTyping()
      
      try {
        if (isConnected) {
          // Send via WebSocket
          const sent = sendWebSocketMessage(messageContent)
          
          if (sent) {
            console.log('Message sent via WebSocket')
            
            // Track that this message was sent via socket
            setMessagesSentViaSocket(prev => new Set(prev).add(tempId))
            
            // Remove temp message - the real one will come via WebSocket
            setTimeout(() => {
              setConversation(prev => prev ? {
                ...prev,
                messages: prev.messages.filter(msg => msg.id !== tempId)
              } : null)
            }, 100)
          } else {
            throw new Error('WebSocket send failed')
          }
          
        } else {
          // Send via REST API
          const token = currentUser.token
          if (!token) throw new Error('No authentication token')
          
          const response = await fetch(`http://localhost:8000/api/v1/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: messageContent,
              sender: 'agent'
            })
          })
          
          if (response.ok) {
            const savedMessage = await response.json()
            console.log('Message sent via REST API successfully')
            
            // Replace temp message with real message from API
            setConversation(prev => prev ? {
              ...prev,
              messages: prev.messages.map(msg => 
                msg.id === tempId ? {
                  ...msg,
                  id: savedMessage.id || savedMessage.message?.id || tempId,
                  timestamp: savedMessage.timestamp || savedMessage.message?.timestamp || msg.timestamp
                } : msg
              )
            } : null)
          } else {
            throw new Error(`API request failed: ${response.status}`)
          }
        }
      } catch (sendError) {
        console.error('Failed to send message:', sendError)
        
        // Remove temp message and show error
        setConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempId)
        } : null)
        
        // Restore message to input
        setNewMessage(messageContent)
        
        // Could show an error notification here
        alert('Failed to send message. Please try again.')
      }
      
    } catch (error) {
      console.error('Failed to prepare message:', error)
      setNewMessage(messageContent) // Restore message
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    
    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping()
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping()
    }, 1000)
  }

  const handleStatusChange = (newStatus: 'active' | 'waiting' | 'resolved') => {
    if (conversation) {
      setConversation({
        ...conversation,
        status: newStatus
      })
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'waiting':
        return 'destructive'
      case 'resolved':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="w-4 h-4" />
      case 'waiting':
        return <Clock className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="p-8">
        <Card className="text-center py-16">
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h3>
            <p className="text-gray-600 mb-6">The conversation you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/conversations">
              <Button>Back to Conversations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Server Error Banner */}
      {serverError && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-orange-700">{serverError}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/conversations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{conversation.visitor.name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {conversation.website_name}
              </Badge>
              <Badge variant={getStatusColor(conversation.status) as any} className="text-xs">
                <div className="flex items-center space-x-1">
                  {getStatusIcon(conversation.status)}
                  <span className="capitalize">{conversation.status}</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={conversation.status === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('active')}
          >
            Active
          </Button>
          <Button
            variant={conversation.status === 'waiting' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('waiting')}
          >
            Waiting
          </Button>
          <Button
            variant={conversation.status === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('resolved')}
          >
            Resolved
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversation</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-xs">Live WebSocket</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-orange-500">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-xs">REST API Mode</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    Started {formatDate(conversation.created_at)}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'agent'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'agent' ? 'text-indigo-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Visitor is typing...</p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="border-t pt-4">
                {connectionError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    Connection error: {connectionError}
                  </div>
                )}
                <div className="flex space-x-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1 min-h-[80px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {isTyping && (
                  <p className="text-xs text-gray-500 mt-2">You are typing...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Information */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Visitor Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Visitor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">{conversation.visitor.name}</p>
                  {conversation.visitor.email && (
                    <div className="flex items-center mt-1">
                      <Mail className="w-3 h-3 mr-1 text-gray-400" />
                      <p className="text-sm text-gray-600">{conversation.visitor.email}</p>
                    </div>
                  )}
                  {conversation.visitor.phone && (
                    <div className="flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                      <p className="text-sm text-gray-600">{conversation.visitor.phone}</p>
                    </div>
                  )}
                  {conversation.visitor.location && (
                    <div className="flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      <p className="text-sm text-gray-600">{conversation.visitor.location}</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Visit #{conversation.visitor.visitCount}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    First visit: {formatDate(conversation.visitor.firstVisit)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Current page: {conversation.visitor.currentPage}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Browser</p>
                  <p className="text-xs text-gray-500">{conversation.visitor.userAgent}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Referrer</p>
                  <p className="text-xs text-gray-500 break-all">{conversation.visitor.referrer}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {conversation.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}