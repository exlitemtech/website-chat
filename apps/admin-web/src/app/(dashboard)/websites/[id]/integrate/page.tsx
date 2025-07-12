'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from '@website-chat/ui'
import { ArrowLeft, Copy, Check, ExternalLink, Code2 } from 'lucide-react'
import Link from 'next/link'

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
}

export default function IntegratePage() {
  const params = useParams()
  const websiteId = params.id as string
  
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
      setLoading(false)
    }, 500)
  }, [websiteId])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
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

  const config = website.widget_config
  
  const htmlCode = `<!-- Website Chat Widget -->
<link rel="stylesheet" href="https://cdn.websitechat.com/widget.css">
<script 
    src="https://cdn.websitechat.com/widget.js"
    data-website-id="${website.id}"
    data-api-url="https://api.websitechat.com"
    data-primary-color="${config.primaryColor}"
    data-position="${config.position}"
    data-welcome-message="${config.welcomeMessage}"
    data-agent-name="${config.agentName}"${config.agentAvatar ? `
    data-agent-avatar="${config.agentAvatar}"` : ''}
    data-enable-file-upload="${config.enableFileUpload.toString()}"
    data-enable-emoji="${config.enableEmoji.toString()}"
></script>`

  const jsCode = `// Load CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.websitechat.com/widget.css';
document.head.appendChild(link);

// Load and initialize widget
const script = document.createElement('script');
script.src = 'https://cdn.websitechat.com/widget.js';
script.onload = function() {
  WebsiteChat.init({
    websiteId: '${website.id}',
    apiUrl: 'https://api.websitechat.com',
    primaryColor: '${config.primaryColor}',
    position: '${config.position}',
    welcomeMessage: '${config.welcomeMessage}',
    agentName: '${config.agentName}',${config.agentAvatar ? `
    agentAvatar: '${config.agentAvatar}',` : ''}
    enableFileUpload: ${config.enableFileUpload},
    enableEmoji: ${config.enableEmoji}
  });
};
document.head.appendChild(script);`

  const reactCode = `import { useEffect } from 'react';

export function ChatWidget() {
  useEffect(() => {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.websitechat.com/widget.css';
    document.head.appendChild(link);

    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.websitechat.com/widget.js';
    script.onload = () => {
      if (window.WebsiteChat) {
        window.WebsiteChat.init({
          websiteId: '${website.id}',
          apiUrl: 'https://api.websitechat.com',
          primaryColor: '${config.primaryColor}',
          position: '${config.position}',
          welcomeMessage: '${config.welcomeMessage}',
          agentName: '${config.agentName}',${config.agentAvatar ? `
          agentAvatar: '${config.agentAvatar}',` : ''}
          enableFileUpload: ${config.enableFileUpload},
          enableEmoji: ${config.enableEmoji}
        });
      }
    };
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (window.WebsiteChat) {
        window.WebsiteChat.destroy();
      }
      script.remove();
      link.remove();
    };
  }, []);

  return null; // Widget renders globally
}`

  const wordpressCode = `<?php
// Add to your theme's functions.php file

function add_website_chat_widget() {
    ?>
    <link rel="stylesheet" href="https://cdn.websitechat.com/widget.css">
    <script 
        src="https://cdn.websitechat.com/widget.js"
        data-website-id="${website.id}"
        data-api-url="https://api.websitechat.com"
        data-primary-color="${config.primaryColor}"
        data-position="${config.position}"
        data-welcome-message="${config.welcomeMessage}"
        data-agent-name="${config.agentName}"${config.agentAvatar ? `
        data-agent-avatar="${config.agentAvatar}"` : ''}
        data-enable-file-upload="${config.enableFileUpload.toString()}"
        data-enable-emoji="${config.enableEmoji.toString()}"
    ></script>
    <?php
}
add_action('wp_footer', 'add_website_chat_widget');`

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
            <h1 className="text-3xl font-bold text-gray-900">Integration Code</h1>
            <p className="text-gray-600 mt-1">{website.name} • {website.domain}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant={website.is_active ? "default" : "secondary"}>
            {website.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/websites/${website.id}/configure`}>
            <Button variant="outline">
              <Code2 className="w-4 h-4 mr-2" />
              Configure Widget
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="html" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            </TabsList>

            <TabsContent value="html">
              <Card>
                <CardHeader>
                  <CardTitle>HTML Integration</CardTitle>
                  <CardDescription>
                    Add this code to your HTML file, preferably before the closing &lt;/body&gt; tag
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{htmlCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(htmlCode, 'html')}
                    >
                      {copiedCode === 'html' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="javascript">
              <Card>
                <CardHeader>
                  <CardTitle>JavaScript Integration</CardTitle>
                  <CardDescription>
                    Dynamically load and initialize the widget using JavaScript
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{jsCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(jsCode, 'javascript')}
                    >
                      {copiedCode === 'javascript' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="react">
              <Card>
                <CardHeader>
                  <CardTitle>React Integration</CardTitle>
                  <CardDescription>
                    Use this React component to add the chat widget to your React application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{reactCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(reactCode, 'react')}
                    >
                      {copiedCode === 'react' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wordpress">
              <Card>
                <CardHeader>
                  <CardTitle>WordPress Integration</CardTitle>
                  <CardDescription>
                    Add this code to your theme&apos;s functions.php file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{wordpressCode}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(wordpressCode, 'wordpress')}
                    >
                      {copiedCode === 'wordpress' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Setup</CardTitle>
                <CardDescription>
                  Get your widget running in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Choose your platform</p>
                    <p className="text-sm text-gray-600">Select the integration method that fits your website</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Copy the code</p>
                    <p className="text-sm text-gray-600">Copy the integration code from the tabs above</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Paste and deploy</p>
                    <p className="text-sm text-gray-600">Add the code to your website and publish</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Website ID</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {website.id}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Color</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <span className="text-sm font-mono">{config.primaryColor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Position</span>
                  <span className="text-sm">{config.position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Agent</span>
                  <span className="text-sm">{config.agentName}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}