import './globals.css'
import type { Metadata } from 'next'

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
        {children}
      </body>
    </html>
  )
}