'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { authAPI } from '@/lib/api'
import { useSnackbar } from 'notistack'
import { motion, AnimatePresence } from 'framer-motion'

interface LoginFormProps {
  onLogin?: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const { setAuth } = useStore()
  const { enqueueSnackbar } = useSnackbar()

  // Load remembered username
  useEffect(() => {
    const savedUsername = localStorage.getItem('srt-remembered-username')
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(username, password)

      // Save to store
      setAuth(true, username, response.access_token)

      // Save to localStorage
      const storageData = {
        state: {
          isAuthenticated: true,
          currentUser: {
            username: username,
            token: response.access_token
          },
          darkMode: false,
          viewMode: 'grid'
        },
        version: 0
      }
      localStorage.setItem('srt-manager-storage', JSON.stringify(storageData))

      // Remember username if checked
      if (rememberMe) {
        localStorage.setItem('srt-remembered-username', username)
      } else {
        localStorage.removeItem('srt-remembered-username')
      }

      enqueueSnackbar('Welcome back!', { variant: 'success' })

      setTimeout(() => {
        window.location.reload()
      }, 600)

      if (onLogin) {
        onLogin()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed'
      setError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[380px] px-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex justify-center mb-10"
        >
          <div className="w-14 h-14 rounded-xl bg-[#111] dark:bg-white flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-7 h-7 text-white dark:text-[#111]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-semibold text-[#111] dark:text-white mb-2">
            SRT Manager
          </h1>
          <p className="text-sm text-[#666] dark:text-[#888]">
            Sign in to your account
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              className="w-full h-11 px-4 rounded-lg border border-[#e0e0e0] dark:border-[#333]
                         bg-white dark:bg-[#111] text-[#111] dark:text-white
                         placeholder-[#999] dark:placeholder-[#555]
                         focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white
                         focus:border-transparent transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter username"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#333] dark:text-[#ccc] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full h-11 px-4 rounded-lg border border-[#e0e0e0] dark:border-[#333]
                         bg-white dark:bg-[#111] text-[#111] dark:text-white
                         placeholder-[#999] dark:placeholder-[#555]
                         focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white
                         focus:border-transparent transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter password"
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#ccc] dark:border-[#444]
                         text-[#111] dark:text-white bg-white dark:bg-[#111]
                         focus:ring-[#111] dark:focus:ring-white focus:ring-2"
            />
            <label
              htmlFor="remember"
              className="ml-2 text-sm text-[#666] dark:text-[#888]"
            >
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[#111] dark:bg-white
                       text-white dark:text-[#111] font-medium
                       hover:bg-[#333] dark:hover:bg-[#eee]
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       focus:ring-[#111] dark:focus:ring-white
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 pt-6 border-t border-[#eee] dark:border-[#222]"
        >
          <p className="text-xs text-center text-[#999] dark:text-[#666]">
            Default: <span className="font-mono">admin / admin</span>
          </p>
          <p className="text-xs text-center text-[#bbb] dark:text-[#444] mt-3">
            SRT Live Transmit Web v3.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
