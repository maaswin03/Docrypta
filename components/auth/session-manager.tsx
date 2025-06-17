"use client"

import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'

export function SessionManager() {
  const { logout } = useAuth()

  useEffect(() => {
    const checkSession = () => {
      const sessionExpiry = localStorage.getItem('sessionExpiry')
      
      if (sessionExpiry) {
        const expiryDate = new Date(sessionExpiry)
        const now = new Date()
        
        if (now >= expiryDate) {
          // Session expired
          logout()
        }
      }
    }

    // Check session every minute
    const interval = setInterval(checkSession, 60000)

    // Check on window focus
    const handleFocus = () => checkSession()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [logout])

  return null
}