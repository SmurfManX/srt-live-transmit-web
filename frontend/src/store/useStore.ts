import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Channel, User } from '@/types'

interface AppState {
  // Auth
  isAuthenticated: boolean
  currentUser: { username: string; token: string; role?: string } | null
  setAuth: (authenticated: boolean, user: string | null, token?: string, role?: string) => void
  logout: () => void

  // Channels
  channels: Channel[]
  setChannels: (channels: Channel[]) => void
  updateChannel: (channelName: string, updates: Partial<Channel>) => void
  removeChannel: (channelName: string) => void

  // UI State
  darkMode: boolean
  toggleDarkMode: () => void
  viewMode: 'grid' | 'list'
  toggleViewMode: () => void

  // Users
  users: User[]
  setUsers: (users: User[]) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      isAuthenticated: false,
      currentUser: null,
      setAuth: (authenticated, user, token, role) =>
        set({
          isAuthenticated: authenticated,
          currentUser: user && token ? { username: user, token, role } : null
        }),
      logout: () => set({ isAuthenticated: false, currentUser: null, channels: [] }),

      // Channels
      channels: [],
      setChannels: (channels) => set({ channels }),
      updateChannel: (channelName, updates) =>
        set((state) => ({
          channels: state.channels.map((ch) =>
            ch.channel_name === channelName ? { ...ch, ...updates } : ch
          ),
        })),
      removeChannel: (channelName) =>
        set((state) => ({
          channels: state.channels.filter((ch) => ch.channel_name !== channelName),
        })),

      // UI State
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      viewMode: 'grid',
      toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'grid' ? 'list' : 'grid' })),

      // Users
      users: [],
      setUsers: (users) => set({ users }),
    }),
    {
      name: 'srt-manager-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        darkMode: state.darkMode,
        viewMode: state.viewMode,
      }),
    }
  )
)
