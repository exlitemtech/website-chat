'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Switch,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator
} from '@website-chat/ui'
import { 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  BellOff, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react'

interface NotificationSettingsProps {
  children?: React.ReactNode
}

export default function NotificationSettings({ children }: NotificationSettingsProps) {
  const notifications = useNotifications()
  const [open, setOpen] = useState(false)

  const handlePermissionRequest = async () => {
    await notifications.requestPermission()
  }

  const handleDoNotDisturbToggle = () => {
    if (notifications.preferences.doNotDisturb) {
      notifications.disableDoNotDisturb()
    } else {
      // Enable DND for 1 hour by default
      notifications.enableDoNotDisturb(60 * 60 * 1000)
    }
  }

  const getPermissionStatus = () => {
    if (!notifications.permission.isSupported) {
      return { status: 'unsupported', color: 'gray', icon: AlertCircle }
    }
    if (notifications.permission.isGranted) {
      return { status: 'granted', color: 'green', icon: CheckCircle }
    }
    if (notifications.permission.isDenied) {
      return { status: 'denied', color: 'red', icon: AlertCircle }
    }
    return { status: 'pending', color: 'yellow', icon: Clock }
  }

  const permissionInfo = getPermissionStatus()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Permission Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <permissionInfo.icon className="h-4 w-4" />
                Browser Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={permissionInfo.color === 'green' ? 'default' : 'secondary'}
                    className={`${
                      permissionInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      permissionInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                      permissionInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {permissionInfo.status}
                  </Badge>
                  <span className="text-sm text-gray-600 capitalize">
                    {permissionInfo.status}
                  </span>
                </div>
                
                {notifications.permission.isPending && (
                  <Button
                    size="sm"
                    onClick={handlePermissionRequest}
                    className="h-8"
                  >
                    Grant Permission
                  </Button>
                )}
              </div>
              
              {!notifications.permission.isSupported && (
                <p className="text-xs text-gray-500">
                  Your browser doesn't support notifications.
                </p>
              )}
              
              {notifications.permission.isDenied && (
                <p className="text-xs text-gray-500">
                  Please enable notifications in your browser settings to receive alerts.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notification Types */}
          {notifications.permission.isGranted && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-notifications" className="text-sm font-medium">
                      Enable Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Master switch for all notification types
                    </p>
                  </div>
                  <Switch
                    id="enable-notifications"
                    checked={notifications.preferences.enabled}
                    onCheckedChange={(checked) => 
                      notifications.updatePreferences({ enabled: checked })
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-messages" className="text-sm">
                        New Messages
                      </Label>
                      <p className="text-xs text-gray-500">
                        Notify when visitors send new messages
                      </p>
                    </div>
                    <Switch
                      id="new-messages"
                      checked={notifications.preferences.newMessages}
                      onCheckedChange={(checked) => 
                        notifications.updatePreferences({ newMessages: checked })
                      }
                      disabled={!notifications.preferences.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-conversations" className="text-sm">
                        New Conversations
                      </Label>
                      <p className="text-xs text-gray-500">
                        Notify when new conversations start
                      </p>
                    </div>
                    <Switch
                      id="new-conversations"
                      checked={notifications.preferences.newConversations}
                      onCheckedChange={(checked) => 
                        notifications.updatePreferences({ newConversations: checked })
                      }
                      disabled={!notifications.preferences.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="urgent-messages" className="text-sm">
                        Urgent Messages
                      </Label>
                      <p className="text-xs text-gray-500">
                        High priority alerts that require attention
                      </p>
                    </div>
                    <Switch
                      id="urgent-messages"
                      checked={notifications.preferences.urgentMessages}
                      onCheckedChange={(checked) => 
                        notifications.updatePreferences({ urgentMessages: checked })
                      }
                      disabled={!notifications.preferences.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="visitor-activity" className="text-sm">
                        Visitor Activity
                      </Label>
                      <p className="text-xs text-gray-500">
                        Notify about visitor presence on websites
                      </p>
                    </div>
                    <Switch
                      id="visitor-activity"
                      checked={notifications.preferences.visitorActivity}
                      onCheckedChange={(checked) => 
                        notifications.updatePreferences({ visitorActivity: checked })
                      }
                      disabled={!notifications.preferences.enabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sound & Do Not Disturb */}
          {notifications.permission.isGranted && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sound & Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-enabled" className="text-sm font-medium flex items-center gap-2">
                      {notifications.preferences.soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                      Notification Sounds
                    </Label>
                    <p className="text-xs text-gray-500">
                      Play sound when notifications appear
                    </p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={notifications.preferences.soundEnabled}
                    onCheckedChange={(checked) => 
                      notifications.updatePreferences({ soundEnabled: checked })
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="do-not-disturb" className="text-sm font-medium flex items-center gap-2">
                      {notifications.preferences.doNotDisturb ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      Do Not Disturb
                    </Label>
                    <p className="text-xs text-gray-500">
                      Temporarily disable all notifications
                    </p>
                  </div>
                  <Switch
                    id="do-not-disturb"
                    checked={notifications.preferences.doNotDisturb}
                    onCheckedChange={handleDoNotDisturbToggle}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Test Notification */}
          {notifications.permission.isGranted && notifications.preferences.enabled && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  notifications.showNewMessage(
                    'test-conversation',
                    'Test Visitor',
                    'This is a test notification to verify everything is working correctly!'
                  )
                }}
                disabled={notifications.preferences.doNotDisturb}
              >
                Send Test Notification
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}