'use client'

import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input } from '@website-chat/ui'
import { MessageCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    try {
      // ✅ Use the login function from AuthContext
      const { success, error } = await login(email, password)
      if (success) {
        // Redirect to dashboard after successful login
        router.push('/dashboard')
      } else {
        setError(error || 'Invalid email or password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            Sign in to your admin dashboard
          </CardDescription>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Demo Account</p>
            <p className="text-xs text-blue-600">admin@example.com • password123</p>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="h-12 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-12 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
          
          <CardFooter className="pt-6">
            <Button 
              type="submit" 
              className="w-full h-12 gradient-bg text-white border-0 shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in to Dashboard'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}