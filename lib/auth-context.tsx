"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: number
  full_name: string
  email: string
  user_type: 'doctor' | 'user'
  wallet_address?: string
  is_verified?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const sessionExpiry = localStorage.getItem('sessionExpiry')
        
        if (storedUser && sessionExpiry) {
          const expiryDate = new Date(sessionExpiry)
          const now = new Date()
          
          if (now < expiryDate) {
            // Session is still valid
            setUser(JSON.parse(storedUser))
          } else {
            // Session expired, clear storage
            localStorage.removeItem('user')
            localStorage.removeItem('sessionExpiry')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('sessionExpiry')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Route protection logic
  useEffect(() => {
    if (isLoading) return

    const publicRoutes = ['/signin', '/signup/user', '/signup/doctor', '/test']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (!user && !isPublicRoute) {
      // User not authenticated and trying to access protected route
      router.push('/signin')
      return
    }

    if (user && isPublicRoute && pathname !== '/test') {
      // User authenticated but on public route, redirect to appropriate dashboard
      const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
      router.push(dashboardRoute)
      return
    }

    if (user) {
      // Role-based route protection
      const isDoctorRoute = pathname.startsWith('/doctor/')
      const isUserRoute = pathname.startsWith('/user/')
      const isDashboardRoute = pathname === '/dashboard'

      if (isDoctorRoute && user.user_type !== 'doctor') {
        // User trying to access doctor route
        router.push('/404')
        return
      }

      if (isUserRoute && user.user_type !== 'user') {
        // Doctor trying to access user route
        router.push('/404')
        return
      }

      if (isDashboardRoute) {
        // Redirect generic dashboard to specific dashboard
        const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
        router.push(dashboardRoute)
        return
      }
    }
  }, [user, isLoading, pathname, router])

  const login = (userData: User) => {
    setUser(userData)
    
    // Set session expiry to 30 days from now
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('sessionExpiry', expiryDate.toISOString())
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('sessionExpiry')
    router.push('/signin')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}