'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Shield, UserPlus, Trash2, Key, Lock, Users, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type UserRole = 'admin' | 'readonly'

interface User {
  username: string
  email?: string
  role: UserRole
  created_at: string
  last_login?: string
}

// Get token from the app's storage format
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = localStorage.getItem('srt-manager-storage')
    if (!storage) return null
    const parsed = JSON.parse(storage)
    return parsed?.state?.currentUser?.token || null
  } catch {
    return null
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SecurityPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'readonly' as UserRole })
  const [currentUser, setCurrentUser] = useState<string>('')

  useEffect(() => {
    fetchUsers()
    fetchCurrentUser()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        console.error('No auth token found')
        return
      }
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken()
      if (!token) return
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.username)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return
    try {
      const token = getAuthToken()
      if (!token) return
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      if (res.ok) {
        setNewUser({ username: '', email: '', password: '', role: 'readonly' })
        setShowAddUser(false)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.detail || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to add user:', error)
    }
  }

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      const token = getAuthToken()
      if (!token) return
      const res = await fetch(`${API_BASE}/api/users/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleChangeRole = async (username: string, newRole: UserRole) => {
    try {
      const token = getAuthToken()
      if (!token) return
      const res = await fetch(`${API_BASE}/api/users/${username}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to change role:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">Security</h1>
            <p className="text-[#6B7280] mt-1">User management and access control</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddUser(!showAddUser)}>
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-[#4A8B57]">{users.length}</div>
                </div>
                <Users className="h-8 w-8 text-[#4A8B57]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Admin Users</div>
                  <div className="text-3xl font-bold text-[#3B82F6]">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
                <Shield className="h-8 w-8 text-[#3B82F6]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Active Sessions</div>
                  <div className="text-3xl font-bold text-[#B8935E]">1</div>
                </div>
                <Key className="h-8 w-8 text-[#B8935E]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Encrypted Channels</div>
                  <div className="text-3xl font-bold text-[#D97706]">--</div>
                </div>
                <Lock className="h-8 w-8 text-[#D97706]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <Card className="border-2 border-[#4A8B57]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#4A8B57]" />
                Add New User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-[#1F2937] dark:text-[#F9FAFB]">Username *</label>
                  <input
                    type="text"
                    placeholder="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 h-11 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] dark:text-white focus:border-[#4A8B57] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-[#1F2937] dark:text-[#F9FAFB]">Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 h-11 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] dark:text-white focus:border-[#4A8B57] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-[#1F2937] dark:text-[#F9FAFB]">Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 h-11 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] dark:text-white focus:border-[#4A8B57] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-[#1F2937] dark:text-[#F9FAFB]">Role *</label>
                  <select
                    className="w-full px-4 py-2 h-11 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] dark:text-white focus:border-[#4A8B57] outline-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  >
                    <option value="readonly">Readonly</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddUser}>
                  Create User
                </Button>
                <Button variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">No users found</div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.username}
                    className="p-4 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] hover:border-[#4A8B57] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-[#4A8B57]/10">
                          <Users className="h-5 w-5 text-[#4A8B57]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{user.username}</div>
                            {user.role === 'admin' ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="outline">Readonly</Badge>
                            )}
                            {user.username === currentUser && (
                              <Badge variant="success">Current</Badge>
                            )}
                          </div>
                          {user.email && (
                            <div className="text-sm text-[#6B7280]">{user.email}</div>
                          )}
                          <div className="text-xs text-[#6B7280] mt-1">
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.username !== 'admin' && (
                          <select
                            className="px-3 py-1.5 text-sm rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.username, e.target.value as UserRole)}
                          >
                            <option value="readonly">Readonly</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={user.username === 'admin'}
                        >
                          <Key className="h-4 w-4" />
                          Reset Password
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={user.username === 'admin' || user.username === currentUser}
                        >
                          <Trash2 className="h-4 w-4 text-[#B91C1C]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#B8935E]" />
                AES Encryption Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Default Key Length</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                  defaultValue="32"
                >
                  <option value="16">AES-128 (16 bytes)</option>
                  <option value="24">AES-192 (24 bytes)</option>
                  <option value="32">AES-256 (32 bytes)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Require Encryption</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]" />
                  <span className="text-sm text-[#6B7280]">Force encryption on all new channels</span>
                </div>
              </div>
              <Button variant="outline">
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#3B82F6]" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Token Expiration (minutes)</label>
                <input
                  type="number"
                  defaultValue="1440"
                  className="w-full px-4 py-2 h-11 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] dark:text-white focus:border-[#4A8B57] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Auto Logout After</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
                  defaultValue="60"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="0">Never</option>
                </select>
              </div>
              <Button variant="outline">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Warning */}
        <Card className="bg-[#D97706]/10 border-[#D97706]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#D97706]/20">
                <AlertTriangle className="h-5 w-5 text-[#D97706]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1F2937] dark:text-[#F9FAFB] mb-1">
                  Security Best Practices
                </h3>
                <ul className="text-sm text-[#6B7280] space-y-1 list-disc list-inside">
                  <li>Always use AES-256 encryption for sensitive streams</li>
                  <li>Rotate passphrases regularly (recommended: every 90 days)</li>
                  <li>Use strong, unique passwords for all user accounts</li>
                  <li>Monitor access logs for suspicious activity</li>
                  <li>Keep SRT-live-transmit and all dependencies up to date</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
