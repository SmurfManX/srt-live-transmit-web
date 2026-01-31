'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import LoginForm from '@/components/auth/LoginForm'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, currentUser } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = () => {
      try {
        const storage = localStorage.getItem('srt-manager-storage')
        if (storage) {
          const parsed = JSON.parse(storage)
          const user = parsed?.state?.currentUser
          if (user && user.token) {
            // User is authenticated
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    setIsLoading(false)
  }

  // Minimalist loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#111] dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666] dark:text-[#888]">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    return <LoginForm onLogin={handleLoginSuccess} />
  }

  return <>{children}</>
}
