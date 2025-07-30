'use client'

import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@website-chat/ui'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Search className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              404
            </CardTitle>
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Page Not Found
            </p>
            <p className="text-gray-500 text-sm">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>

              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Need help? Contact our support team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 