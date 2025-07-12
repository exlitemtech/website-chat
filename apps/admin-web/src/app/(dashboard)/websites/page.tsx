'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@website-chat/ui'
import { Plus, Settings, Code, Globe } from 'lucide-react'

interface Website {
  id: string
  name: string
  domain: string
  widget_config: {
    primaryColor: string
    position: string
    welcomeMessage: string
    agentName: string
    agentAvatar?: string
    enableFileUpload: boolean
    enableEmoji: boolean
  }
  is_active: boolean
  created_at: string
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWebsite, setNewWebsite] = useState({
    name: '',
    domain: '',
    widget_config: {
      primaryColor: '#6366f1',
      position: 'bottom-right',
      welcomeMessage: 'Hi! How can we help you today?',
      agentName: 'Support Team',
      enableFileUpload: true,
      enableEmoji: true
    }
  })

  // Mock data for now
  useEffect(() => {
    setTimeout(() => {
      setWebsites([
        {
          id: '1',
          name: 'My E-commerce Store',
          domain: 'store.example.com',
          widget_config: {
            primaryColor: '#6366f1',
            position: 'bottom-right',
            welcomeMessage: 'Welcome to our store! How can we help you today?',
            agentName: 'Store Support',
            enableFileUpload: true,
            enableEmoji: true
          },
          is_active: true,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Company Blog',
          domain: 'blog.company.com',
          widget_config: {
            primaryColor: '#8b5cf6',
            position: 'bottom-left',
            welcomeMessage: 'Hi there! Questions about our articles?',
            agentName: 'Editorial Team',
            enableFileUpload: false,
            enableEmoji: true
          },
          is_active: true,
          created_at: '2024-01-10T14:20:00Z'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreateWebsite = () => {
    // TODO: Implement API call
    const website: Website = {
      id: Date.now().toString(),
      ...newWebsite,
      is_active: true,
      created_at: new Date().toISOString()
    }
    setWebsites([...websites, website])
    setShowCreateDialog(false)
    setNewWebsite({
      name: '',
      domain: '',
      widget_config: {
        primaryColor: '#6366f1',
        position: 'bottom-right',
        welcomeMessage: 'Hi! How can we help you today?',
        agentName: 'Support Team',
        enableFileUpload: true,
        enableEmoji: true
      }
    })
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
          <p className="text-gray-600 mt-2">Manage your chat widgets across different websites</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-bg">
              <Plus className="w-4 h-4 mr-2" />
              Add Website
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Website</DialogTitle>
              <DialogDescription>
                Create a chat widget for your website
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Website Name</Label>
                <Input
                  id="name"
                  placeholder="My Website"
                  value={newWebsite.name}
                  onChange={(e) => setNewWebsite({...newWebsite, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newWebsite.domain}
                  onChange={(e) => setNewWebsite({...newWebsite, domain: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebsite} disabled={!newWebsite.name || !newWebsite.domain}>
                  Create Website
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {websites.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites yet</h3>
            <p className="text-gray-600 mb-6">Add your first website to start using chat widgets</p>
            <Button onClick={() => setShowCreateDialog(true)} className="gradient-bg">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <Card key={website.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{website.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Globe className="w-4 h-4 mr-1" />
                      {website.domain}
                    </CardDescription>
                  </div>
                  <Badge variant={website.is_active ? "default" : "secondary"}>
                    {website.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: website.widget_config.primaryColor }}
                    />
                    <span className="text-sm text-gray-600">
                      {website.widget_config.primaryColor}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Position:</strong> {website.widget_config.position}</p>
                    <p><strong>Agent:</strong> {website.widget_config.agentName}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {/* TODO: Navigate to widget config */}}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {/* TODO: Show integration code */}}
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Integrate
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Created {new Date(website.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}