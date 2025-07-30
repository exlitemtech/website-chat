import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { RouteGuard } from '@/components/RouteGuard'

export const metadata: Metadata = {
  title: 'Website Chat Admin',
  description: 'Admin dashboard for website chat management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  )
}