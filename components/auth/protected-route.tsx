"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('doctor' | 'user')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['doctor', 'user'],
  redirectTo = '/signin'
}: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Wait for auth to be initialized
    if (!isInitialized || isLoading) {
      console.log('⏳ Waiting for auth initialization...')
      setShouldRender(false)
      return
    }

    console.log('🛡️ ProtectedRoute check:', { 
      user: user?.full_name, 
      userType: user?.user_type, 
      allowedRoles,
      isAuthenticated: !!user,
      isInitialized
    })

    if (!user) {
      console.log('❌ No user found, redirecting to:', redirectTo)
      router.push(redirectTo)
      setShouldRender(false)
      return
    }

    if (!allowedRoles.includes(user.user_type)) {
      console.log('🚫 User role not allowed, showing 404')
      router.push('/404')
      setShouldRender(false)
      return
    }

    console.log('✅ Access granted, rendering protected content')
    setShouldRender(true)
  }, [user, isLoading, isInitialized, allowedRoles, redirectTo, router])

  // Show loading while auth is initializing or checking
  if (!isInitialized || isLoading || !shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}