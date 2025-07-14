/**
 * Main ChatWidget class - the embeddable chat widget
 */

import { createElement, createSVGIcon, formatTime, escapeHtml, scrollToBottom } from '../utils/dom'
import { ICONS, IconName } from '../utils/icons'
import { ChatAPIClient } from '../api/client'
import { WidgetWebSocket } from '../websocket/WidgetWebSocket'

interface WidgetConfig {
  websiteId: string
  apiUrl?: string
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
  welcomeMessage?: string
  agentName?: string
  agentAvatar?: string
  enableFileUpload?: boolean
  enableEmoji?: boolean
}

interface Message {
  id: string
  content: string
  sender: 'visitor' | 'agent'
  timestamp: Date
  type: 'text' | 'image' | 'file'
}

export class ChatWidget {
  private config: WidgetConfig
  private container: HTMLElement
  private launcher: HTMLElement
  private chatWindow: HTMLElement
  private messagesContainer: HTMLElement
  private messageInput: HTMLTextAreaElement
  private isOpen = false
  private messages: Message[] = []
  private apiClient: ChatAPIClient
  private websocket: WidgetWebSocket | null = null
  private unreadCount = 0
  private isTyping = false
  private conversationId: string | null = null
  private typingTimeout: number | null = null
  private agentTyping = false

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: 'http://localhost:8000',
      primaryColor: '#6366f1',
      position: 'bottom-right',
      welcomeMessage: 'Hi! How can we help you today?',
      agentName: 'Support Team',
      enableFileUpload: true,
      enableEmoji: true,
      ...config
    }

    this.apiClient = new ChatAPIClient({
      websiteId: this.config.websiteId,
      apiUrl: this.config.apiUrl!,
      primaryColor: this.config.primaryColor,
      position: this.config.position,
      welcomeMessage: this.config.welcomeMessage,
      agentName: this.config.agentName,
      agentAvatar: this.config.agentAvatar
    })

    this.init()
    this.initWebSocket()
  }

  private init(): void {
    this.createContainer()
    this.createLauncher()
    this.createChatWindow()
    this.attachEventListeners()
    this.loadConversationHistory()
  }

  private initWebSocket(): void {
    const visitorId = this.apiClient.getVisitorId()
    
    this.websocket = new WidgetWebSocket({
      websiteId: this.config.websiteId,
      visitorId: visitorId,
      apiUrl: this.config.apiUrl!,
      onMessage: (message) => this.handleWebSocketMessage(message),
      onConnect: () => {
        console.log('Widget WebSocket connected')
        // Join conversation if we have one
        if (this.conversationId) {
          this.websocket?.joinConversation(this.conversationId)
        }
      },
      onDisconnect: () => {
        console.log('Widget WebSocket disconnected')
      },
      onError: (error) => {
        console.error('Widget WebSocket error:', error)
      }
    })

    this.websocket.connect()
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'connection_established':
        console.log('WebSocket connection established:', message)
        break
        
      case 'new_message':
        console.log('🔔 Widget received new_message via WebSocket:', message.message)
        if (message.message) {
          const incomingMessage = {
            id: message.message.id,
            content: message.message.content,
            sender: message.message.sender,
            timestamp: new Date(message.message.timestamp),
            type: 'text'
          }
          
          // If this is a visitor message with the same content as a temporary message,
          // replace the temporary message instead of adding a duplicate
          if (message.message.sender === 'visitor') {
            const tempMessage = this.messages.find(m => 
              m.id.startsWith('temp-') && 
              m.content === message.message.content &&
              m.sender === 'visitor'
            )
            
            if (tempMessage) {
              console.log('🔄 Replacing temporary message with real WebSocket message')
              this.replaceTemporaryMessage(tempMessage.id, message.message)
              return
            }
          }
          
          // Otherwise, add the message normally (for agent messages or messages from other sessions)
          console.log('🔔 Widget adding message to UI:', message.message)
          this.addMessage(incomingMessage)
        }
        break
        
      case 'typing_start':
        if (message.sender_type === 'agent') {
          this.agentTyping = true
          this.showTypingIndicator()
        }
        break
        
      case 'typing_stop':
        if (message.sender_type === 'agent') {
          this.agentTyping = false
          this.hideTypingIndicator()
        }
        break
        
      case 'agent_joined':
        console.log('Agent joined conversation:', message)
        break
        
      case 'error':
        console.error('WebSocket error:', message.message)
        break
    }
  }

  private createContainer(): void {
    this.container = createElement('div', 'wc-widget-container')
    
    // Apply position
    if (this.config.position === 'bottom-left') {
      this.container.style.left = '20px'
      this.container.style.right = 'auto'
    }

    document.body.appendChild(this.container)
  }

  private createLauncher(): void {
    this.launcher = createElement('button', 'wc-launcher')
    this.launcher.setAttribute('aria-label', 'Open chat')
    
    const icon = createSVGIcon(ICONS.chat, 'wc-launcher-icon')
    this.launcher.appendChild(icon)

    this.container.appendChild(this.launcher)
  }

  private createChatWindow(): void {
    this.chatWindow = createElement('div', 'wc-chat-window')
    
    // Header
    const header = this.createHeader()
    this.chatWindow.appendChild(header)

    // Messages container
    this.messagesContainer = createElement('div', 'wc-messages-container')
    this.chatWindow.appendChild(this.messagesContainer)

    // Add welcome message
    this.addWelcomeMessage()

    // Input container
    const inputContainer = this.createInputContainer()
    this.chatWindow.appendChild(inputContainer)

    this.container.appendChild(this.chatWindow)
  }

  private createHeader(): HTMLElement {
    const header = createElement('div', 'wc-chat-header')
    
    const content = createElement('div', 'wc-chat-header-content')
    
    // Agent avatar
    const avatar = createElement('div', 'wc-agent-avatar')
    if (this.config.agentAvatar) {
      const img = createElement('img') as HTMLImageElement
      img.src = this.config.agentAvatar
      img.alt = this.config.agentName || 'Agent'
      avatar.appendChild(img)
    } else {
      avatar.textContent = (this.config.agentName || 'Support')[0].toUpperCase()
    }
    
    // Agent info
    const agentInfo = createElement('div', 'wc-agent-info')
    agentInfo.innerHTML = `
      <h3>${escapeHtml(this.config.agentName || 'Support Team')}</h3>
      <p>Online now</p>
    `
    
    content.appendChild(avatar)
    content.appendChild(agentInfo)
    
    // Close button
    const closeBtn = createElement('button', 'wc-close-button')
    closeBtn.setAttribute('aria-label', 'Close chat')
    const closeIcon = createSVGIcon(ICONS.close)
    closeBtn.appendChild(closeIcon)
    closeBtn.addEventListener('click', () => this.close())
    
    header.appendChild(content)
    header.appendChild(closeBtn)
    
    return header
  }

  private createInputContainer(): HTMLElement {
    const container = createElement('div', 'wc-input-container')
    
    const wrapper = createElement('div', 'wc-input-wrapper')
    
    // File upload button (if enabled)
    if (this.config.enableFileUpload) {
      const fileBtn = createElement('button', 'wc-file-button')
      fileBtn.setAttribute('aria-label', 'Attach file')
      const fileIcon = createSVGIcon(ICONS.attachment, 'wc-file-icon')
      fileBtn.appendChild(fileIcon)
      
      const fileInput = createElement('input', 'wc-file-input') as HTMLInputElement
      fileInput.type = 'file'
      fileInput.accept = 'image/*,.pdf,.doc,.docx'
      
      fileBtn.addEventListener('click', () => fileInput.click())
      
      wrapper.appendChild(fileBtn)
      container.appendChild(fileInput)
    }
    
    // Message input
    this.messageInput = createElement('textarea', 'wc-message-input') as HTMLTextAreaElement
    this.messageInput.placeholder = 'Type your message...'
    this.messageInput.rows = 1
    
    // Send button
    const sendBtn = createElement('button', 'wc-send-button')
    sendBtn.setAttribute('aria-label', 'Send message')
    const sendIcon = createSVGIcon(ICONS.send, 'wc-send-icon')
    sendBtn.appendChild(sendIcon)
    
    wrapper.appendChild(this.messageInput)
    wrapper.appendChild(sendBtn)
    container.appendChild(wrapper)
    
    return container
  }

  private addWelcomeMessage(): void {
    if (!this.config.welcomeMessage) return
    
    const welcomeDiv = createElement('div', 'wc-welcome-message')
    welcomeDiv.innerHTML = `
      <h3>Welcome!</h3>
      <p>${escapeHtml(this.config.welcomeMessage)}</p>
    `
    
    this.messagesContainer.appendChild(welcomeDiv)
  }

  private attachEventListeners(): void {
    // Launcher click
    this.launcher.addEventListener('click', () => this.toggle())
    
    // Message input events
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })
    
    this.messageInput.addEventListener('input', () => {
      this.autoResizeTextarea()
      this.handleTyping()
    })
    
    // Send button click
    const sendBtn = this.chatWindow.querySelector('.wc-send-button') as HTMLElement
    sendBtn.addEventListener('click', () => this.sendMessage())
    
    // Click outside to close (optional)
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node) && this.isOpen) {
        // Don't auto-close for now - let users manually close
      }
    })
  }

  private autoResizeTextarea(): void {
    this.messageInput.style.height = 'auto'
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px'
  }

  private handleTyping(): void {
    const hasContent = this.messageInput.value.trim().length > 0
    
    if (hasContent && !this.isTyping) {
      this.isTyping = true
      if (this.websocket?.isConnected() && this.conversationId) {
        this.websocket.startTyping(this.conversationId)
      }
    }
    
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }
    
    // Set timeout to stop typing
    this.typingTimeout = window.setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false
        if (this.websocket?.isConnected() && this.conversationId) {
          this.websocket.stopTyping(this.conversationId)
        }
      }
    }, 1000)
  }

  private async sendMessage(): Promise<void> {
    const content = this.messageInput.value.trim()
    if (!content) return
    
    // Generate a temporary ID for the optimistic UI update
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    
    // Add user message immediately for optimistic UI
    const userMessage: Message = {
      id: tempId,
      content,
      sender: 'visitor',
      timestamp: new Date(),
      type: 'text'
    }
    
    this.addMessage(userMessage)
    this.messageInput.value = ''
    this.autoResizeTextarea()
    
    // Show typing indicator
    this.showTypingIndicator()
    
    try {
      // Send via WebSocket if connected, otherwise fallback to API
      if (this.websocket?.isConnected() && this.conversationId) {
        this.websocket.sendMessage(this.conversationId, content)
      } else {
        // Fallback to REST API
        const response = await this.apiClient.sendMessage(content)
        
        if (response.success && response.message) {
          // Store conversation ID for future WebSocket messages
          if (response.conversationId) {
            this.conversationId = response.conversationId
            
            // Join the conversation via WebSocket
            if (this.websocket?.isConnected()) {
              this.websocket.joinConversation(this.conversationId)
            }
          }
          
          // Replace the temporary message with the real one from backend
          this.replaceTemporaryMessage(tempId, response.message)
          
          // Hide typing and add agent response (only for fallback)
          this.hideTypingIndicator()
          // Don't add the echo message from API - it's already replaced above
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      this.hideTypingIndicator()
      // Optionally mark the temporary message as failed
      this.markMessageAsFailed(tempId)
    }
  }

  private addMessage(message: Message, isNew = true): void {
    // Check for duplicate messages to prevent the same message appearing twice
    const existingMessage = this.messages.find(m => m.id === message.id)
    if (existingMessage) {
      console.log('🚫 Duplicate message detected, skipping:', message.id)
      return
    }
    
    this.messages.push(message)
    
    const messageElement = this.createMessageElement(message)
    
    // Only remove welcome message when a new message is being sent (not for historical messages)
    if (isNew) {
      const welcomeMsg = this.messagesContainer.querySelector('.wc-welcome-message')
      if (welcomeMsg && this.messages.length === 1) {
        welcomeMsg.remove()
      }
    }
    
    this.messagesContainer.appendChild(messageElement)
    scrollToBottom(this.messagesContainer)
    
    // Update unread count if widget is closed (only for new messages)
    if (isNew && !this.isOpen && message.sender === 'agent') {
      this.unreadCount++
      this.updateNotificationBadge()
    }
  }

  private replaceTemporaryMessage(tempId: string, realMessage: any): void {
    // Find and replace temporary message with real message from backend
    const messageIndex = this.messages.findIndex(m => m.id === tempId)
    if (messageIndex !== -1) {
      // Update the message data
      this.messages[messageIndex] = {
        id: realMessage.id,
        content: realMessage.content,
        sender: realMessage.sender,
        timestamp: new Date(realMessage.timestamp),
        type: 'text'
      }
      
      // Update the DOM element
      const messageElements = this.messagesContainer.querySelectorAll('.wc-message')
      if (messageElements[messageIndex]) {
        const newElement = this.createMessageElement(this.messages[messageIndex])
        messageElements[messageIndex].replaceWith(newElement)
      }
      
      console.log('✅ Replaced temporary message', tempId, 'with real message', realMessage.id)
    }
  }

  private markMessageAsFailed(messageId: string): void {
    // Find message and mark as failed
    const messageIndex = this.messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      // Add a visual indicator for failed message
      const messageElements = this.messagesContainer.querySelectorAll('.wc-message')
      if (messageElements[messageIndex]) {
        messageElements[messageIndex].classList.add('failed')
        // Could add retry functionality here in the future
      }
      console.log('❌ Marked message as failed:', messageId)
    }
  }

  private createMessageElement(message: Message): HTMLElement {
    const messageDiv = createElement('div', `wc-message ${message.sender}`)
    
    // Avatar
    const avatar = createElement('div', 'wc-message-avatar')
    if (message.sender === 'agent') {
      avatar.textContent = (this.config.agentName || 'A')[0].toUpperCase()
    } else {
      avatar.textContent = 'You'
    }
    
    // Message content
    const contentDiv = createElement('div', 'wc-message-content')
    
    const bubble = createElement('div', 'wc-message-bubble')
    bubble.textContent = message.content
    
    const time = createElement('div', 'wc-message-time')
    time.textContent = formatTime(message.timestamp)
    
    contentDiv.appendChild(bubble)
    contentDiv.appendChild(time)
    
    messageDiv.appendChild(avatar)
    messageDiv.appendChild(contentDiv)
    
    return messageDiv
  }

  private showTypingIndicator(): void {
    // Only show agent typing indicator, not our own
    if (!this.agentTyping) return
    
    // Remove existing typing indicator first
    this.hideTypingIndicator()
    
    const typingDiv = createElement('div', 'wc-typing-indicator')
    
    const avatar = createElement('div', 'wc-message-avatar')
    avatar.textContent = (this.config.agentName || 'A')[0].toUpperCase()
    
    const dotsContainer = createElement('div', 'wc-typing-dots')
    for (let i = 0; i < 3; i++) {
      const dot = createElement('div', 'wc-typing-dot')
      dotsContainer.appendChild(dot)
    }
    
    typingDiv.appendChild(avatar)
    typingDiv.appendChild(dotsContainer)
    
    this.messagesContainer.appendChild(typingDiv)
    scrollToBottom(this.messagesContainer)
  }

  private hideTypingIndicator(): void {
    const typingIndicator = this.messagesContainer.querySelector('.wc-typing-indicator')
    if (typingIndicator) {
      typingIndicator.remove()
    }
  }

  private updateNotificationBadge(): void {
    let badge = this.launcher.querySelector('.wc-notification-badge') as HTMLElement
    
    if (this.unreadCount > 0) {
      if (!badge) {
        badge = createElement('div', 'wc-notification-badge')
        this.launcher.appendChild(badge)
      }
      badge.textContent = this.unreadCount.toString()
    } else if (badge) {
      badge.remove()
    }
  }

  private async loadConversationHistory(): Promise<void> {
    try {
      const history = await this.apiClient.getConversationHistory()
      
      if (history.length > 0) {
        // Remove welcome message if we have conversation history
        const welcomeMsg = this.messagesContainer.querySelector('.wc-welcome-message')
        if (welcomeMsg) {
          welcomeMsg.remove()
        }
        
        // Add historical messages without triggering welcome message removal
        history.forEach(message => {
          this.messages.push(message)
          const messageElement = this.createMessageElement(message)
          this.messagesContainer.appendChild(messageElement)
        })
        
        scrollToBottom(this.messagesContainer)
        
        // Store conversation ID from history
        const conversationId = this.apiClient.getConversationId()
        if (conversationId) {
          this.conversationId = conversationId
          
          // Join the conversation via WebSocket if connected
          if (this.websocket?.isConnected()) {
            console.log('🔌 Joining conversation after loading history:', conversationId)
            this.websocket.joinConversation(conversationId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error)
    }
  }

  public open(): void {
    if (this.isOpen) return
    
    this.isOpen = true
    this.chatWindow.classList.add('open')
    this.launcher.classList.add('open')
    
    // Clear unread count
    this.unreadCount = 0
    this.updateNotificationBadge()
    
    // Focus input
    setTimeout(() => {
      this.messageInput.focus()
    }, 300)
  }

  public close(): void {
    if (!this.isOpen) return
    
    this.isOpen = false
    this.chatWindow.classList.remove('open')
    this.launcher.classList.remove('open')
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  public destroy(): void {
    // Clean up WebSocket connection
    if (this.websocket) {
      this.websocket.disconnect()
      this.websocket = null
    }
    
    // Clean up typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
      this.typingTimeout = null
    }
    
    // Remove DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}