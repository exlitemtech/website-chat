'use client'

import AppLayout from '@/components/AppLayout'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  LayoutContent
} from '@website-chat/ui'
import { 
  MessageCircle, 
  Users, 
  Globe, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react'

export default function DashboardPage() {
  // Mock data - in real app this would come from API
  const stats = [
    {
      title: "Active Conversations",
      value: "12",
      description: "+3 from yesterday",
      icon: MessageCircle,
      trend: "up"
    },
    {
      title: "Total Visitors",
      value: "1,247",
      description: "+18% from last week",
      icon: Users,
      trend: "up"
    },
    {
      title: "Websites Connected",
      value: "3",
      description: "All systems operational",
      icon: Globe,
      trend: "stable"
    },
    {
      title: "Response Time",
      value: "2.4s",
      description: "Avg response time",
      icon: Clock,
      trend: "stable"
    }
  ]

  const recentConversations = [
    {
      id: "1",
      visitor: "John Doe",
      website: "example.com",
      status: "active",
      lastMessage: "Need help with pricing",
      timestamp: "2 minutes ago",
      agent: "Sarah"
    },
    {
      id: "2",
      visitor: "Jane Smith", 
      website: "shop.example.com",
      status: "waiting",
      lastMessage: "Product availability question",
      timestamp: "5 minutes ago",
      agent: null
    },
    {
      id: "3",
      visitor: "Mike Johnson",
      website: "blog.example.com", 
      status: "resolved",
      lastMessage: "Thank you for the help!",
      timestamp: "15 minutes ago",
      agent: "Tom"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'waiting':
        return <Badge variant="warning">Waiting</Badge>
      case 'resolved':
        return <Badge variant="secondary">Resolved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <AppLayout>
      <LayoutContent>
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                  <stat.icon className="h-5 w-5 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <p className="text-sm text-slate-500 flex items-center">
                  {stat.trend === "up" && <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Conversations */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg font-bold text-slate-900">
                Recent Conversations
                <Button variant="outline" size="sm" className="gradient-bg text-white border-0 hover:opacity-90">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-500">
                Latest customer interactions across all websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-700">
                          {conversation.visitor.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {conversation.visitor}
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center mt-1">
                          <Globe className="h-3 w-3 mr-1" />
                          {conversation.website} • {conversation.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(conversation.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-500">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <MessageCircle className="h-5 w-5 mr-3" />
                Start New Conversation
              </Button>
              <Button className="w-full justify-start h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200">
                <Users className="h-5 w-5 mr-3 text-emerald-500" />
                Invite Team Member
              </Button>
              <Button className="w-full justify-start h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200">
                <Globe className="h-5 w-5 mr-3 text-blue-500" />
                Add New Website
              </Button>
              <Button className="w-full justify-start h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200">
                <TrendingUp className="h-5 w-5 mr-3 text-orange-500" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8 card-hover">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Team Activity</CardTitle>
            <CardDescription className="text-slate-500">
              Recent actions by your team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-700">Agent</TableHead>
                    <TableHead className="font-semibold text-slate-700">Action</TableHead>
                    <TableHead className="font-semibold text-slate-700">Website</TableHead>
                    <TableHead className="font-semibold text-slate-700">Time</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-emerald-700">SJ</span>
                        </div>
                        <span className="font-medium text-slate-900">Sarah Johnson</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">Resolved conversation</TableCell>
                    <TableCell className="text-slate-500">example.com</TableCell>
                    <TableCell className="text-slate-500">5 minutes ago</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                        <span className="text-xs font-medium text-emerald-700">Completed</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">TW</span>
                        </div>
                        <span className="font-medium text-slate-900">Tom Wilson</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">Joined conversation</TableCell>
                    <TableCell className="text-slate-500">shop.example.com</TableCell>
                    <TableCell className="text-slate-500">12 minutes ago</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-xs font-medium text-blue-700">Active</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-orange-700">MD</span>
                        </div>
                        <span className="font-medium text-slate-900">Mike Davis</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">Updated widget settings</TableCell>
                    <TableCell className="text-slate-500">blog.example.com</TableCell>
                    <TableCell className="text-slate-500">1 hour ago</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-xs font-medium text-orange-700">Updated</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </LayoutContent>
    </AppLayout>
  )
}