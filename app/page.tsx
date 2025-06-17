"use client"

import { useAuth } from '@/lib/auth-context'

export default function HomePage() {
  const { isLoading } = useAuth()

  // The AuthProvider will handle all redirects automatically
  // Just show loading while it determines where to go
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}