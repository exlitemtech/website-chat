'use client'

import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@website-chat/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PreChatFormSettings from '@/components/PreChatFormSettings'

export default function SettingsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Settings Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="pre-chat-form" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pre-chat-form">Pre Chat Form</TabsTrigger>
            <TabsTrigger value="notifications">Tab 2</TabsTrigger>
            <TabsTrigger value="appearance">Tab 3</TabsTrigger>
            <TabsTrigger value="advanced">Tab 4</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pre-chat-form" className="mt-6">
            <PreChatFormSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 