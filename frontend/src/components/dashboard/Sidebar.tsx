'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Radio,
  Settings,
  BarChart,
  Network,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Play,
  FileCode,
  Activity,
  Shield,
  Send,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const DRAWER_WIDTH = 280

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/',
  },
  {
    id: 'channels',
    label: 'Channels',
    icon: <Radio className="h-5 w-5" />,
    children: [
      { id: 'all-channels', label: 'All Channels', icon: <Play className="h-4 w-4" />, path: '/channels' },
      { id: 'templates', label: 'Templates', icon: <FileCode className="h-4 w-4" />, path: '/channels/templates' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: <BarChart className="h-5 w-5" />,
    children: [
      { id: 'analytics', label: 'Analytics', icon: <Activity className="h-4 w-4" />, path: '/monitoring/analytics' },
      { id: 'streams', label: 'Stream Health', icon: <Network className="h-4 w-4" />, path: '/monitoring/streams' },
    ],
  },
  {
    id: 'transmission',
    label: 'Transmission',
    icon: <Send className="h-5 w-5" />,
    path: '/transmission',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-5 w-5" />,
    path: '/security',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings',
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['channels', 'monitoring'])

  const handleToggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const isActive = (path?: string) => {
    if (!path) return false
    return pathname === path
  }

  const drawerContent = (
    <div className="h-full flex flex-col bg-gradient-to-b from-white via-[#FAFAF9] to-[#F8F6F4] dark:from-[#2B2520] dark:via-[#252019] dark:to-[#1F1A17] relative overflow-hidden">
      {/* Decorative background gradient */}
      <div className="absolute inset-0 bg-gradient-mesh-light dark:bg-gradient-mesh-dark opacity-50 pointer-events-none" />

      {/* Logo & Brand */}
      <div className="p-6 flex items-center justify-between border-b-2 border-border/40 relative z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 animate-slide-in-right">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#4A8B57] to-[#B8935E] shadow-luxury glow-green relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
            <Network className="h-7 w-7 text-white relative z-10 transition-smooth group-hover:scale-110" />
          </div>
          <div>
            <div className="font-black text-xl text-foreground leading-tight gradient-text-animated">
              SRT Manager
            </div>
            <div className="text-xs text-muted-foreground font-bold mt-0.5">
              v2.0 Professional
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-smooth interactive-scale"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 relative z-10">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div key={item.id} className="animate-slide-in-right" style={{ animationDelay: `${index * 0.05}s` }}>
              {/* Main Item */}
              {item.path ? (
                <Link href={item.path}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-smooth cursor-pointer group relative overflow-hidden shadow-soft',
                      isActive(item.path)
                        ? 'bg-gradient-primary text-white font-bold shadow-elegant glow-green'
                        : 'text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-soft font-semibold'
                    )}
                  >
                    {isActive(item.path) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                    )}
                    <div className={cn('flex-shrink-0 relative z-10 transition-smooth',
                      isActive(item.path) ? 'text-white' : 'text-muted-foreground group-hover:text-primary')}>
                      {item.icon}
                    </div>
                    <div className="flex-1 text-sm relative z-10">
                      {item.label}
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  onClick={() => item.children && handleToggleExpand(item.id)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-smooth cursor-pointer text-foreground hover:bg-primary/10 hover:text-primary font-semibold group shadow-soft hover:shadow-soft"
                >
                  <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-smooth">
                    {item.icon}
                  </div>
                  <div className="flex-1 text-sm">
                    {item.label}
                  </div>
                  {item.children && (
                    <div className="text-muted-foreground group-hover:text-primary transition-smooth">
                      {expandedItems.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submenu */}
              {item.children && expandedItems.includes(item.id) && (
                <div className="ml-5 mt-2 space-y-1.5 pl-4 border-l-2 border-primary/20">
                  {item.children.map((child) => (
                    <Link key={child.id} href={child.path || '#'}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-smooth cursor-pointer group',
                          isActive(child.path)
                            ? 'bg-primary/15 text-primary font-bold shadow-soft border-2 border-primary/30'
                            : 'text-foreground hover:bg-primary/5 hover:text-primary font-medium'
                        )}
                      >
                        <div className={cn('flex-shrink-0 transition-smooth',
                          isActive(child.path) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')}>
                          {child.icon}
                        </div>
                        <div className="flex-1 text-sm">
                          {child.label}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-border/40 relative z-10 backdrop-blur-sm">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 shadow-elegant relative overflow-hidden group hover:shadow-luxury transition-smooth">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft glow-green">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm font-bold text-primary">
              System Status
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </div>
            <div className="text-xs text-muted-foreground font-semibold">
              All services operational
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-[#1F1A17] border-r-2 border-border/40 z-50 transition-smooth shadow-luxury',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ width: DRAWER_WIDTH }}
      >
        {drawerContent}
      </aside>
    </>
  )
}

export { DRAWER_WIDTH }
