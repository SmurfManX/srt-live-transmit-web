'use client'

import { useState } from 'react'
import { Menu, Moon, Sun, User, LogOut, Bell } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useThemeMode } from '@/app/providers'
import { DRAWER_WIDTH } from './Sidebar'
import { cn } from '@/lib/utils'

import Badge from '@/components/ui/Badge'
const getUserLabel = (user: unknown) => {
  if (typeof user === "string") return user;

  if (user && typeof user === "object") {
    const u = user as { name?: unknown; email?: unknown };
    if (typeof u.name === "string" && u.name.trim()) return u.name;
    if (typeof u.email === "string" && u.email.trim()) return u.email;
  }

  return "";
};

const getUserInitial = (user: unknown) => {
  const label = getUserLabel(user).trim();
  return label ? label[0]!.toUpperCase() : "U";
};

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { currentUser, setAuth } = useStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { mode, toggleTheme } = useThemeMode()

  const handleLogout = () => {
    setAuth(false, null, null)
    setShowUserMenu(false)
  }

  return (
    <nav
      className="sticky top-0 z-30 glass-light dark:glass-dark border-b-2 border-border/40 backdrop-blur-xl shadow-elegant"
      style={{
        marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? DRAWER_WIDTH : 0,
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-smooth interactive-scale"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden md:block">
              <div className="text-sm text-muted-foreground font-medium">
                Welcome back, <span className="font-bold text-foreground gradient-text-animated text-base">{currentUser?.username || 'User'}</span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-smooth interactive-scale shadow-soft"
              title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {mode === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <button
              className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-smooth interactive-scale relative shadow-soft"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-elegant animate-pulse"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 pr-4 hover:bg-primary/10 rounded-xl transition-smooth interactive-scale shadow-soft border-2 border-transparent hover:border-primary/30"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A8B57] to-[#B8935E] flex items-center justify-center text-white font-bold text-base shadow-elegant glow-green">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-bold text-foreground">
                    {currentUser?.username || 'User'}
                  </div>
                  <Badge variant="success" className="text-xs mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                  </Badge>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-64 animate-scale-in glass-light dark:glass-dark rounded-2xl shadow-luxury border-2 border-border/60 z-50 overflow-hidden">
                    <div className="p-5 border-b-2 border-border/40 bg-gradient-to-br from-primary/5 to-secondary/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A8B57] to-[#B8935E] flex items-center justify-center text-white font-bold text-lg shadow-elegant glow-green">
                          {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-base text-foreground">
                            {currentUser?.username || 'User'}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            Administrator
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" className="w-full justify-center">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active Session
                      </Badge>
                    </div>

                    <div className="py-2">
                      <button
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-primary/10 hover:text-primary transition-smooth text-left group"
                        onClick={() => {
                          setShowUserMenu(false)
                        }}
                      >
                        <User className="h-5 w-5 transition-smooth" />
                        <span className="text-sm font-semibold">
                          Profile Settings
                        </span>
                      </button>

                      <button
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-500/10 hover:text-red-600 transition-smooth text-left border-t-2 border-border/40 group"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5 transition-smooth" />
                        <span className="text-sm font-semibold">
                          Sign Out
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
