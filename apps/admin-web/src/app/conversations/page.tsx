'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@website-chat/ui'
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle, Filter, User, Globe, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  visitor: string
  email?: string
  website: string
  status: 'active' | 'waiting' | 'resolved'
  priority: 'high' | 'normal' | 'low'
  lastMessage: string
  timestamp: string
  agent?: string
  messages: number
  waitTime: string
  tags: string[]
  unreadCount?: number
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load conversations with caching
  useEffect(() => {
    let isMounted = true
    
    const loadConversations = async () => {
      try {
        if (typeof window === 'undefined') return
        
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          console.log('No token found, using demo mode')
          if (isMounted) {
            setConversations([])
            setLoading(false)
          }
          return
        }

        const response = await fetch('http://localhost:8000/api/v1/conversations/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-cache' // Prevent aggressive caching for real-time data
        })

        if (response.ok) {
          const data = await response.json()
          
          // Transform backend data to frontend format
          const transformedConversations = data.map((conv: any) => ({
            id: conv.id,
            visitor: conv.visitor_name || 'Anonymous User',
            email: conv.visitor_email || null,
            website: conv.website_domain || 'Unknown',
            status: conv.status || 'active',
            priority: conv.priority || 'normal',
            lastMessage: conv.last_message || 'No messages yet',
            timestamp: new Date(conv.last_message_time || conv.created_at).toLocaleString(),
            agent: conv.agent?.name || null,
            messages: conv.message_count || 0,
            waitTime: '0m', // Calculate from timestamps if needed
            tags: conv.tags || [],
            unreadCount: conv.unread_count || 0
          }))
          
          if (isMounted) {
            setConversations(transformedConversations)
          }
        } else {
          console.error('Failed to fetch conversations:', response.status)
          if (isMounted) {
            setConversations([])
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        if (isMounted) {
          setConversations([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadConversations()
    
    return () => {
      isMounted = false
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'waiting':
        return <Badge variant="warning">Waiting</Badge>
      case 'resolved':
        return <Badge variant="secondary">Resolved</Badge>
      case 'closed':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'normal':
        return <Badge variant="outline">Normal</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesTab = activeTab === 'all' || conv.status === activeTab
      const matchesSearch = conv.visitor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesTab && matchesSearch
    })
  }, [conversations, activeTab, searchQuery])

  const stats = useMemo(() => ({
    all: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    waiting: conversations.filter(c => c.status === 'waiting').length,
    resolved: conversations.filter(c => c.status === 'resolved').length
  }), [conversations])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
        {/* Header with Stats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
              <p className="text-gray-600 mt-2">Manage customer conversations across all websites</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.all}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Waiting</p>
                    <p className="text-2xl font-bold text-red-600">{stats.waiting}</p>
                  </div>
                  <Clock className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversations Table */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="waiting">Waiting ({stats.waiting})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
              </TabsList>
              
              <CardContent>
                <TabsContent value={activeTab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Wait Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.map((conversation) => (
                    <TableRow key={conversation.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Link href={`/conversations/${conversation.id}`}>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">{conversation.visitor}</p>
                                {conversation.unreadCount && conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount} new
                                  </Badge>
                                )}
                              </div>
                              {conversation.email && (
                                <p className="text-xs text-gray-500">{conversation.email}</p>
                              )}
                              <p className="text-xs text-gray-500">{conversation.timestamp}</p>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {conversation.website}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{conversation.lastMessage}</p>
                        <div className="flex gap-1 mt-1">
                          {conversation.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {conversation.agent ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {conversation.agent}
                          </div>
                        ) : (
                          <Badge variant="outline">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(conversation.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(conversation.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {conversation.waitTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
    </div>
  )
}