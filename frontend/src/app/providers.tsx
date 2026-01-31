'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from '@/theme/theme'
import NotificationProvider from '@/components/providers/NotificationProvider'
import AuthGuard from '@/components/auth/AuthGuard'

interface ThemeContextType {
  mode: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
})

export const useThemeMode = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null
    if (savedMode) {
      setMode(savedMode)
      // Apply dark class to document for Tailwind CSS
      if (savedMode === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Default is dark mode
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark'
    setMode(newMode)
    localStorage.setItem('themeMode', newMode)
    // Apply dark class to document for Tailwind CSS
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const theme = getTheme(mode)

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </NotificationProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
