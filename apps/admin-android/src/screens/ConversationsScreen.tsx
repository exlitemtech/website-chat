import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator
} from 'react-native'
import { Conversation } from '../types/chat'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { AuthUtils } from '../utils/auth'

interface ConversationsScreenProps {
  onConversationSelect: (conversation: Conversation) => void
}

export default function ConversationsScreen({ onConversationSelect }: ConversationsScreenProps) {
  console.log('ConversationsScreen mounted')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchConversations = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const token = await AuthUtils.getToken()
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.conversations}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Fetched conversations:', data)
        // Convert date strings to Date objects
        const conversationsWithDates = data.map((conv: any) => ({
          ...conv,
          priority: conv.priority || 'normal', // Default to 'normal' if missing
          tags: conv.tags || [], // Default to empty array if missing
          lastMessage: conv.last_message || 'No messages yet', // Add last message
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined,
          closedAt: conv.closedAt ? new Date(conv.closedAt) : undefined,
        }))
        console.log('Conversations with dates:', conversationsWithDates)
        setConversations(conversationsWithDates)
      } else {
        console.error('Failed to fetch conversations:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const onRefresh = () => {
    fetchConversations(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF6B6B'
      case 'assigned': return '#4ECDC4'
      case 'closed': return '#95A5A6'
      case 'archived': return '#BDC3C7'
      default: return '#95A5A6'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C'
      case 'high': return '#F39C12'
      case 'normal': return '#3498DB'
      case 'low': return '#95A5A6'
      default: return '#3498DB'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const renderConversation = ({ item }: { item: Conversation }) => {
    console.log('Rendering conversation:', item)
    return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onConversationSelect(item)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.leftSection}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.conversationTitle}>
            {item.subject || `Conversation ${item.id.slice(-6)}`}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || 'normal') }]}>
            <Text style={styles.priorityText}>{(item.priority || 'normal').toUpperCase()}</Text>
          </View>
          <Text style={styles.timeText}>
            {item.lastMessageAt ? formatTime(item.lastMessageAt) : formatTime(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Last Message Preview */}
      {item.lastMessage && (
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessageText} numberOfLines={2}>
            {item.lastMessage}
          </Text>
        </View>
      )}
      
      <View style={styles.conversationMeta}>
        <Text style={styles.statusText}>{(item.status || 'unknown').toUpperCase()}</Text>
        {(item.tags || []).length > 0 && (
          <View style={styles.tags}>
            {(item.tags || []).slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {(item.tags || []).length > 2 && (
              <Text style={styles.moreTagsText}>+{(item.tags || []).length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    )
  }

  console.log('Rendering conversations list, count:', conversations.length)
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations ({conversations.length})</Text>
      </View>
      
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptyText}>New conversations will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  lastMessageContainer: {
    marginVertical: 8,
    paddingLeft: 16, // Align with conversation title
  },
  lastMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})