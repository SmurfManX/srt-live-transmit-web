'use client'

import { useEffect, useState } from 'react'
import { Shield, UserPlus, Trash2, Key, Lock, Users, ArrowLeft, Moon, Sun } from 'lucide-react'
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
  const [darkMode, setDarkMode] = useState(false)

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111] dark:bg-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-white dark:text-[#111]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111] dark:text-white">Security & Users</h1>
              <p className="text-sm text-[#666] dark:text-[#888]">Manage users and access control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] text-[#111] dark:text-white rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-lg transition-colors text-[#111] dark:text-[#ccc]"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#111] dark:text-white">{users.length}</div>
                <div className="text-sm text-[#666] dark:text-[#888]">Total Users</div>
              </div>
              <Users className="w-8 h-8 text-[#666] dark:text-[#888]" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'admin').length}</div>
                <div className="text-sm text-[#666] dark:text-[#888]">Admin Users</div>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'readonly').length}</div>
                <div className="text-sm text-[#666] dark:text-[#888]">Readonly Users</div>
              </div>
              <Key className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">1</div>
                <div className="text-sm text-[#666] dark:text-[#888]">Active Sessions</div>
              </div>
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#111] dark:text-white">User Accounts</h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-lg hover:bg-[#333] dark:hover:bg-[#eee] transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#e5e5e5] dark:border-[#333] p-6 mb-6">
            <h3 className="text-lg font-semibold text-[#111] dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-1">Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#111] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
                >
                  <option value="readonly">Readonly</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-lg hover:bg-[#333] dark:hover:bg-[#eee] transition-colors text-sm font-medium"
              >
                Create User
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] text-[#111] dark:text-white rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#e5e5e5] dark:border-[#333] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f9f9f9] dark:bg-[#222] border-b border-[#e5e5e5] dark:border-[#333]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] dark:text-[#888] uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] dark:text-[#888] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] dark:text-[#888] uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] dark:text-[#888] uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#666] dark:text-[#888] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#333]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#666] dark:text-[#888]">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.username} className="hover:bg-[#f9f9f9] dark:hover:bg-[#222]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-[#111] text-sm font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[#111] dark:text-white">{user.username}</div>
                          {user.username === currentUser && (
                            <span className="text-xs text-green-600">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#666] dark:text-[#888]">
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {user.username === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          Admin
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.username, e.target.value as UserRole)}
                          className="px-2 py-1 rounded text-xs border border-[#e5e5e5] dark:border-[#333] bg-white dark:bg-[#111] text-[#111] dark:text-white"
                        >
                          <option value="readonly">Readonly</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#666] dark:text-[#888]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded transition-colors text-[#666] dark:text-[#888] disabled:opacity-50"
                          disabled={user.username === 'admin'}
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-red-600 disabled:opacity-50"
                          disabled={user.username === 'admin' || user.username === currentUser}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}
