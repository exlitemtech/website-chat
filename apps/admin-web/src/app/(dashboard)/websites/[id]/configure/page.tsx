'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from '@website-chat/ui'
import { ArrowLeft, Eye, Save } from 'lucide-react'
import Link from 'next/link'

interface WidgetConfig {
  primaryColor: string
  position: 'bottom-right' | 'bottom-left'
  welcomeMessage: string
  agentName: string
  agentAvatar?: string
  enableFileUpload: boolean
  enableEmoji: boolean
}

interface Website {
  id: string
  name: string
  domain: string
  widget_config: WidgetConfig
  is_active: boolean
}

export default function ConfigurePage() {
  const params = useParams()
  const websiteId = params.id as string
  
  const [website, setWebsite] = useState<Website | null>(null)
  const [config, setConfig] = useState<WidgetConfig>({
    primaryColor: '#6366f1',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help you today?',
    agentName: 'Support Team',
    agentAvatar: '',
    enableFileUpload: true,
    enableEmoji: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Mock data loading
  useEffect(() => {
    setTimeout(() => {
      const mockWebsite: Website = {
        id: websiteId,
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
        is_active: true
      }
      setWebsite(mockWebsite)
      setConfig(mockWebsite.widget_config)
      setLoading(false)
    }, 500)
  }, [websiteId])

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement API call
    setTimeout(() => {
      setSaving(false)
      if (website) {
        setWebsite({ ...website, widget_config: config })
      }
    }, 1000)
  }

  const colorPresets = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#84cc16'  // Lime
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="p-8">
        <Card className="text-center py-16">
          <CardContent>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Website not found</h3>
            <p className="text-gray-600 mb-6">The website you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/websites">
              <Button>Back to Websites</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/websites">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configure Widget</h1>
            <p className="text-gray-600 mt-1">{website.name} • {website.domain}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-bg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="appearance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Design</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your chat widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                        className="w-12 h-10 p-1 rounded-md"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                        className="flex-1"
                        placeholder="#6366f1"
                      />
                    </div>
                    <div className="flex space-x-2 mt-3">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => setConfig({...config, primaryColor: color})}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Widget Position</Label>
                    <Select 
                      value={config.position} 
                      onValueChange={(value: string) => 
                        setConfig({...config, position: value as 'bottom-right' | 'bottom-left'})
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Information</CardTitle>
                  <CardDescription>
                    Set up your support agent details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="agentName">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={config.agentName}
                      onChange={(e) => setConfig({...config, agentName: e.target.value})}
                      placeholder="Support Team"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agentAvatar">Agent Avatar URL</Label>
                    <Input
                      id="agentAvatar"
                      value={config.agentAvatar || ''}
                      onChange={(e) => setConfig({...config, agentAvatar: e.target.value})}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Features</CardTitle>
                  <CardDescription>
                    Enable or disable widget functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>File Upload</Label>
                      <p className="text-sm text-gray-600">Allow visitors to send files</p>
                    </div>
                    <Switch
                      checked={config.enableFileUpload}
                      onCheckedChange={(checked) => setConfig({...config, enableFileUpload: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emoji Support</Label>
                      <p className="text-sm text-gray-600">Enable emoji picker in chat</p>
                    </div>
                    <Switch
                      checked={config.enableEmoji}
                      onCheckedChange={(checked) => setConfig({...config, enableEmoji: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Message</CardTitle>
                  <CardDescription>
                    Set the first message visitors see
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                    placeholder="Hi! How can we help you today?"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your widget will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-100 rounded-lg p-6 h-96 overflow-hidden">
                  {/* Mock website background */}
                  <div className="text-gray-400 text-sm">
                    <p>Your website content...</p>
                    <div className="h-2 bg-gray-300 rounded w-3/4 mt-2"></div>
                    <div className="h-2 bg-gray-300 rounded w-1/2 mt-2"></div>
                  </div>
                  
                  {/* Widget Preview */}
                  <div 
                    className={`absolute bottom-4 ${config.position === 'bottom-right' ? 'right-4' : 'left-4'}`}
                  >
                    {/* Launcher Button */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
                      style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)` }}
                    >
                      💬
                    </div>
                    
                    {/* Chat Window Preview */}
                    <div className="absolute bottom-16 right-0 w-80 h-60 bg-white rounded-lg shadow-xl border overflow-hidden">
                      <div 
                        className="p-4 text-white"
                        style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)` }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-sm font-semibold">
                            {config.agentName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{config.agentName}</h4>
                            <p className="text-xs opacity-90">Online now</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 flex-1">
                        <div className="text-center text-gray-600">
                          <h4 className="font-semibold mb-1">Welcome!</h4>
                          <p className="text-xs">{config.welcomeMessage}</p>
                        </div>
                      </div>
                      
                      <div className="p-3 border-t bg-white">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-100 rounded-full px-3 py-1">
                            <span className="text-xs text-gray-400">Type your message...</span>
                          </div>
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            →
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}