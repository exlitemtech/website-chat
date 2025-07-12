'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@website-chat/ui'
import { Globe, MessageSquare, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Websites',
      value: '2',
      icon: Globe,
      description: 'Active chat widgets',
      change: '+1 this month'
    },
    {
      title: 'Conversations',
      value: '47',
      icon: MessageSquare,
      description: 'Total conversations',
      change: '+12 this week'
    },
    {
      title: 'Visitors',
      value: '324',
      icon: Users,
      description: 'Unique visitors',
      change: '+23% from last week'
    },
    {
      title: 'Response Rate',
      value: '94%',
      icon: TrendingUp,
      description: 'Average response rate',
      change: '+2% improvement'
    }
  ]

  const recentConversations = [
    {
      id: '1',
      website: 'My E-commerce Store',
      visitor: 'John D.',
      lastMessage: 'Thank you for the help!',
      time: '2 minutes ago',
      status: 'resolved'
    },
    {
      id: '2',
      website: 'Company Blog',
      visitor: 'Sarah M.',
      lastMessage: 'Do you have pricing information?',
      time: '15 minutes ago',
      status: 'active'
    },
    {
      id: '3',
      website: 'My E-commerce Store',
      visitor: 'Mike R.',
      lastMessage: 'I need help with my order',
      time: '1 hour ago',
      status: 'waiting'
    }
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening with your chat widgets.</p>
        </div>
        
        <Link href="/websites">
          <Button className="gradient-bg">
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-2">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest customer interactions across all websites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{conversation.visitor}</span>
                      <Badge variant="outline" className="text-xs">
                        {conversation.website}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{conversation.time}</p>
                  </div>
                  <Badge 
                    variant={
                      conversation.status === 'active' ? 'default' :
                      conversation.status === 'resolved' ? 'secondary' : 'destructive'
                    }
                    className="ml-4"
                  >
                    {conversation.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/conversations">
                <Button variant="outline" className="w-full">
                  View All Conversations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/websites">
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Manage Websites
                </Button>
              </Link>
              
              <Link href="/conversations">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View All Conversations
                </Button>
              </Link>
              
              <Link href="/team">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </Button>
              </Link>
              
              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Check out our documentation or contact support for assistance.
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Documentation
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}