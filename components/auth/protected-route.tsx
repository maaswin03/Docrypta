"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    console.log('ProtectedRoute check:', { 
      user: user?.full_name, 
      userType: user?.user_type, 
      allowedRoles,
      isAuthenticated: !!user 
    })

    if (!user) {
      console.log('No user found, redirecting to:', redirectTo)
      router.push(redirectTo)
      return
    }

    if (!allowedRoles.includes(user.user_type)) {
      console.log('User role not allowed, redirecting to 404')
      router.push('/404')
      return
    }
  }, [user, isLoading, allowedRoles, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!allowedRoles.includes(user.user_type)) {
    return null
  }

  return <>{children}</>
}