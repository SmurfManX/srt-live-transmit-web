'use client'

import { SnackbarProvider } from 'notistack'
import { ReactNode } from 'react'

interface NotificationProviderProps {
  children: ReactNode
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      autoHideDuration={4000}
      preventDuplicate
    >
      {children}
    </SnackbarProvider>
  )
}
