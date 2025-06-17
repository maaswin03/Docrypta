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
  const [isInitialized, setIsInitialized] = useState(false)
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
            const userData = JSON.parse(storedUser)
            setUser(userData)
            console.log('Session restored for user:', userData.full_name, 'Type:', userData.user_type)
          } else {
            // Session expired, clear storage
            console.log('Session expired, clearing storage')
            localStorage.removeItem('user')
            localStorage.removeItem('sessionExpiry')
          }
        } else {
          console.log('No stored session found')
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('sessionExpiry')
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    checkSession()
  }, [])

  // Route protection logic - only run after initialization
  useEffect(() => {
    if (!isInitialized || isLoading) return

    console.log('Route protection check:', { 
      pathname, 
      user: user?.full_name, 
      userType: user?.user_type,
      isAuthenticated: !!user 
    })

    const publicRoutes = ['/signin', '/signup/user', '/signup/doctor', '/test', '/']
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || (route !== '/' && pathname.startsWith(route))
    )

    // Handle root path
    if (pathname === '/') {
      if (user) {
        const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
        console.log('Redirecting authenticated user from root to:', dashboardRoute)
        router.push(dashboardRoute)
      } else {
        console.log('Redirecting unauthenticated user from root to signin')
        router.push('/signin')
      }
      return
    }

    // Handle unauthenticated users
    if (!user && !isPublicRoute) {
      console.log('Unauthenticated user accessing protected route, redirecting to signin')
      router.push('/signin')
      return
    }

    // Handle authenticated users on public routes
    if (user && (pathname === '/signin' || pathname.startsWith('/signup'))) {
      const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
      console.log('Authenticated user on public route, redirecting to:', dashboardRoute)
      router.push(dashboardRoute)
      return
    }

    // Handle authenticated users
    if (user) {
      const isDoctorRoute = pathname.startsWith('/doctor/')
      const isUserRoute = pathname.startsWith('/user/')
      const isDashboardRoute = pathname === '/dashboard'

      if (isDoctorRoute && user.user_type !== 'doctor') {
        console.log('User trying to access doctor route, redirecting to 404')
        router.push('/404')
        return
      }

      if (isUserRoute && user.user_type !== 'user') {
        console.log('Doctor trying to access user route, redirecting to 404')
        router.push('/404')
        return
      }

      if (isDashboardRoute) {
        const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
        console.log('Redirecting generic dashboard to specific dashboard:', dashboardRoute)
        router.push(dashboardRoute)
        return
      }
    }
  }, [user, isLoading, isInitialized, pathname, router])

  const login = (userData: User) => {
    console.log('Logging in user:', userData.full_name, 'Type:', userData.user_type)
    setUser(userData)
    
    // Set session expiry to 30 days from now
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('sessionExpiry', expiryDate.toISOString())
    
    // Don't redirect here - let the useEffect handle it
  }

  const logout = () => {
    console.log('Logging out user')
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