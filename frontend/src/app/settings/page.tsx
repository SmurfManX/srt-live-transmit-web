'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Settings, Save, Moon, Sun, Bell, Zap, Radio, Shield, Database, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SystemSettings {
  theme: 'light' | 'dark' | 'auto'
  autoRefresh: boolean
  refreshInterval: number
  notifications: {
    channelStart: boolean
    channelStop: boolean
    channelError: boolean
    systemAlerts: boolean
  }
  defaults: {
    protocol: 'srt' | 'udp'
    mode: 'caller' | 'listener' | 'rendezvous'
    latency: number
    encryption: boolean
    keyLength: 16 | 24 | 32
  }
  system: {
    maxChannels: number
    logRetention: number
    statsRetention: number
    backupEnabled: boolean
    backupInterval: number
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    theme: 'auto',
    autoRefresh: true,
    refreshInterval: 5,
    notifications: {
      channelStart: true,
      channelStop: true,
      channelError: true,
      systemAlerts: true,
    },
    defaults: {
      protocol: 'srt',
      mode: 'caller',
      latency: 200,
      encryption: false,
      keyLength: 32,
    },
    system: {
      maxChannels: 50,
      logRetention: 30,
      statsRetention: 7,
      backupEnabled: false,
      backupInterval: 24,
    },
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Load from localStorage
    const stored = localStorage.getItem('systemSettings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }

  const saveSettings = () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    // Apply theme change
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // Auto mode - use system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const resetToDefaults = () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return

    const defaultSettings: SystemSettings = {
      theme: 'auto',
      autoRefresh: true,
      refreshInterval: 5,
      notifications: {
        channelStart: true,
        channelStop: true,
        channelError: true,
        systemAlerts: true,
      },
      defaults: {
        protocol: 'srt',
        mode: 'caller',
        latency: 200,
        encryption: false,
        keyLength: 32,
      },
      system: {
        maxChannels: 50,
        logRetention: 30,
        statsRetention: 7,
        backupEnabled: false,
        backupInterval: 24,
      },
    }
    setSettings(defaultSettings)
    localStorage.setItem('systemSettings', JSON.stringify(defaultSettings))
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">System Settings</h1>
            <p className="text-[#6B7280] mt-1">Configure application preferences and defaults</p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <Badge variant="success">Settings Saved</Badge>
            )}
            <Button onClick={saveSettings}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-[#B8935E]" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme Mode</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'light'
                      ? 'border-[#4A8B57] bg-[#4A8B57]/10'
                      : 'border-[#E5E7EB] hover:border-[#4A8B57]/50'
                  }`}
                >
                  <Sun className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Light</div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-[#4A8B57] bg-[#4A8B57]/10'
                      : 'border-[#E5E7EB] hover:border-[#4A8B57]/50'
                  }`}
                >
                  <Moon className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Dark</div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'auto' })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'auto'
                      ? 'border-[#4A8B57] bg-[#4A8B57]/10'
                      : 'border-[#E5E7EB] hover:border-[#4A8B57]/50'
                  }`}
                >
                  <Zap className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Auto</div>
                </button>
              </div>
              <div className="text-xs text-[#6B7280] mt-2">
                Auto mode follows your system preferences
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F6F4] dark:bg-[#2A2522]">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <div className="flex-1">
                <label htmlFor="autoRefresh" className="text-sm font-medium cursor-pointer">
                  Auto-refresh Dashboard
                </label>
                <div className="text-xs text-[#6B7280]">Automatically refresh channel data</div>
              </div>
              {settings.autoRefresh && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                    className="w-20"
                    min="1"
                    max="60"
                  />
                  <span className="text-sm text-[#6B7280]">seconds</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#3B82F6]" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F6F4] dark:hover:bg-[#2A2522] transition-colors">
              <input
                type="checkbox"
                id="notifChannelStart"
                checked={settings.notifications.channelStart}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, channelStart: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="notifChannelStart" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">Channel Started</div>
                <div className="text-xs text-[#6B7280]">Show notification when a channel starts</div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F6F4] dark:hover:bg-[#2A2522] transition-colors">
              <input
                type="checkbox"
                id="notifChannelStop"
                checked={settings.notifications.channelStop}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, channelStop: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="notifChannelStop" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">Channel Stopped</div>
                <div className="text-xs text-[#6B7280]">Show notification when a channel stops</div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F6F4] dark:hover:bg-[#2A2522] transition-colors">
              <input
                type="checkbox"
                id="notifChannelError"
                checked={settings.notifications.channelError}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, channelError: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="notifChannelError" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">Channel Errors</div>
                <div className="text-xs text-[#6B7280]">Show notification when a channel encounters an error</div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F6F4] dark:hover:bg-[#2A2522] transition-colors">
              <input
                type="checkbox"
                id="notifSystemAlerts"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, systemAlerts: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="notifSystemAlerts" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">System Alerts</div>
                <div className="text-xs text-[#6B7280]">Show notification for system-wide alerts</div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Default Channel Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-[#4A8B57]" />
              Default Channel Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Default Protocol</label>
                <select
                  value={settings.defaults.protocol}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaults: { ...settings.defaults, protocol: e.target.value as 'srt' | 'udp' }
                  })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                >
                  <option value="srt">SRT (Secure Reliable Transport)</option>
                  <option value="udp">UDP (User Datagram Protocol)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Default Mode</label>
                <select
                  value={settings.defaults.mode}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaults: { ...settings.defaults, mode: e.target.value as 'caller' | 'listener' | 'rendezvous' }
                  })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                >
                  <option value="caller">Caller (Client)</option>
                  <option value="listener">Listener (Server)</option>
                  <option value="rendezvous">Rendezvous (Peer-to-Peer)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Default Latency (ms)</label>
                <Input
                  type="number"
                  value={settings.defaults.latency}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaults: { ...settings.defaults, latency: parseInt(e.target.value) }
                  })}
                  min="20"
                  max="8000"
                />
                <div className="text-xs text-[#6B7280] mt-1">Recommended: 120-200ms for LAN, 500-2000ms for WAN</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Default AES Key Length</label>
                <select
                  value={settings.defaults.keyLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaults: { ...settings.defaults, keyLength: parseInt(e.target.value) as 16 | 24 | 32 }
                  })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                >
                  <option value="16">AES-128 (16 bytes)</option>
                  <option value="24">AES-192 (24 bytes)</option>
                  <option value="32">AES-256 (32 bytes) - Recommended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F6F4] dark:bg-[#2A2522]">
              <input
                type="checkbox"
                id="defaultEncryption"
                checked={settings.defaults.encryption}
                onChange={(e) => setSettings({
                  ...settings,
                  defaults: { ...settings.defaults, encryption: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="defaultEncryption" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">Enable Encryption by Default</div>
                <div className="text-xs text-[#6B7280]">New channels will have AES encryption enabled</div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#B8935E]" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Maximum Channels</label>
                <Input
                  type="number"
                  value={settings.system.maxChannels}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, maxChannels: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="100"
                />
                <div className="text-xs text-[#6B7280] mt-1">Maximum number of concurrent channels</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Log Retention (days)</label>
                <Input
                  type="number"
                  value={settings.system.logRetention}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, logRetention: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="365"
                />
                <div className="text-xs text-[#6B7280] mt-1">How long to keep channel logs</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Statistics Retention (days)</label>
                <Input
                  type="number"
                  value={settings.system.statsRetention}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, statsRetention: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="90"
                />
                <div className="text-xs text-[#6B7280] mt-1">How long to keep performance statistics</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Backup Interval (hours)</label>
                <Input
                  type="number"
                  value={settings.system.backupInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: { ...settings.system, backupInterval: parseInt(e.target.value) }
                  })}
                  min="1"
                  max="168"
                  disabled={!settings.system.backupEnabled}
                />
                <div className="text-xs text-[#6B7280] mt-1">Automatic database backup frequency</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F6F4] dark:bg-[#2A2522]">
              <input
                type="checkbox"
                id="backupEnabled"
                checked={settings.system.backupEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, backupEnabled: e.target.checked }
                })}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
              />
              <label htmlFor="backupEnabled" className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">Enable Automatic Backups</div>
                <div className="text-xs text-[#6B7280]">Automatically backup database and configuration</div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-[#2A2522] rounded-lg border-2 border-[#E5E7EB]">
          <div>
            <div className="font-semibold text-[#1F2937] dark:text-[#F9FAFB]">Reset Settings</div>
            <div className="text-sm text-[#6B7280]">Restore all settings to their default values</div>
          </div>
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-[#3B82F6]/10 border-[#3B82F6]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#3B82F6]/20">
                <Shield className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1F2937] dark:text-[#F9FAFB] mb-1">
                  Settings Storage
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Settings are stored locally in your browser. Some settings require a page refresh to take effect.
                  Server-side configuration changes may require backend restart.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
