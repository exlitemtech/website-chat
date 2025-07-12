/**
 * Main entry point for the embeddable chat widget
 * This file exports the widget to the global scope for easy integration
 */

import { ChatWidget } from './components/ChatWidget'
import './styles/widget.css'

// Types for global scope
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

interface WebsiteChatWidget {
  init: (config: WidgetConfig) => ChatWidget
  destroy: () => void
  getInstance: () => ChatWidget | null
}

// Global widget instance
let widgetInstance: ChatWidget | null = null

// Create the global WebsiteChat object
const WebsiteChat: WebsiteChatWidget = {
  /**
   * Initialize the chat widget
   */
  init(config: WidgetConfig): ChatWidget {
    if (widgetInstance) {
      console.warn('WebsiteChat widget is already initialized. Call destroy() first if you want to reinitialize.')
      return widgetInstance
    }

    if (!config.websiteId) {
      throw new Error('websiteId is required to initialize the chat widget')
    }

    try {
      widgetInstance = new ChatWidget(config)
      console.log('WebsiteChat widget initialized successfully')
      return widgetInstance
    } catch (error) {
      console.error('Failed to initialize WebsiteChat widget:', error)
      throw error
    }
  },

  /**
   * Destroy the current widget instance
   */
  destroy(): void {
    if (widgetInstance) {
      widgetInstance.destroy()
      widgetInstance = null
      console.log('WebsiteChat widget destroyed')
    }
  },

  /**
   * Get the current widget instance
   */
  getInstance(): ChatWidget | null {
    return widgetInstance
  }
}

// Add to global scope
declare global {
  interface Window {
    WebsiteChat: WebsiteChatWidget
  }
}

// Export to global scope
window.WebsiteChat = WebsiteChat

// Also export as ES module for modern bundlers
export { ChatWidget, WebsiteChat }
export default WebsiteChat

// Auto-initialize if config is provided via data attributes
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-website-id]') as HTMLScriptElement
  
  if (script) {
    const config: WidgetConfig = {
      websiteId: script.dataset.websiteId!,
      apiUrl: script.dataset.apiUrl,
      primaryColor: script.dataset.primaryColor,
      position: (script.dataset.position as WidgetConfig['position']) || 'bottom-right',
      welcomeMessage: script.dataset.welcomeMessage,
      agentName: script.dataset.agentName,
      agentAvatar: script.dataset.agentAvatar,
      enableFileUpload: script.dataset.enableFileUpload !== 'false',
      enableEmoji: script.dataset.enableEmoji !== 'false'
    }

    try {
      WebsiteChat.init(config)
    } catch (error) {
      console.error('Failed to auto-initialize WebsiteChat widget:', error)
    }
  }
})