'use client'

import { useEffect, useState } from 'react'
import { Channel } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Play, Square, Trash2, Edit, Search, Download, Upload, CheckSquare, XSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChannelsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'protocol'>('name')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    let filtered = channels.filter(ch =>
      ch.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.input_protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.mode.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.channel_name.localeCompare(b.channel_name)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      if (sortBy === 'protocol') return a.input_protocol.localeCompare(b.input_protocol)
      return 0
    })

    setFilteredChannels(filtered)
  }, [channels, searchQuery, sortBy])

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(data)
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectChannel = (name: string) => {
    const newSelected = new Set(selectedChannels)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelectedChannels(newSelected)
  }

  const selectAll = () => {
    setSelectedChannels(new Set(filteredChannels.map(ch => ch.channel_name)))
  }

  const deselectAll = () => {
    setSelectedChannels(new Set())
  }

  const bulkStart = async () => {
    const token = localStorage.getItem('token')
    for (const name of Array.from(selectedChannels)) {
      const channel = channels.find(ch => ch.channel_name === name)
      if (channel?.status !== 'running') {
        try {
          await fetch(`/api/channels/${name}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } catch (error) {
          console.error(`Failed to start ${name}:`, error)
        }
      }
    }
    fetchChannels()
    deselectAll()
  }

  const bulkStop = async () => {
    const token = localStorage.getItem('token')
    for (const name of Array.from(selectedChannels)) {
      const channel = channels.find(ch => ch.channel_name === name)
      if (channel?.status === 'running') {
        try {
          await fetch(`/api/channels/${name}/stop`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } catch (error) {
          console.error(`Failed to stop ${name}:`, error)
        }
      }
    }
    fetchChannels()
    deselectAll()
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedChannels.size} channels? This cannot be undone.`)) return

    const token = localStorage.getItem('token')
    for (const name of Array.from(selectedChannels)) {
      try {
        await fetch(`/api/channels/${name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (error) {
        console.error(`Failed to delete ${name}:`, error)
      }
    }
    fetchChannels()
    deselectAll()
  }

  const exportConfig = () => {
    const data = JSON.stringify(channels, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `channels-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">All Channels</h1>
            <p className="text-[#6B7280] mt-1">Manage and monitor all SRT streaming channels</p>
          </div>
          <Button onClick={() => router.push('/')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] focus:border-[#4A8B57] outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="protocol">Sort by Protocol</option>
              </select>

              {/* Export */}
              <Button variant="outline" onClick={exportConfig}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedChannels.size > 0 && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-[#4A8B57]/10 rounded-lg border-2 border-[#4A8B57]/20">
                <span className="text-sm font-medium text-[#4A8B57]">
                  {selectedChannels.size} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" onClick={bulkStart}>
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                  <Button size="sm" variant="outline" onClick={bulkStop}>
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={deselectAll}>
                    <XSquare className="h-4 w-4" />
                    Deselect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-[#6B7280]">Loading channels...</div>
            ) : filteredChannels.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">No channels found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F8F6F4] dark:bg-[#2A2522] border-b-2 border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <button onClick={selectAll} className="text-[#4A8B57] hover:text-[#3d7347]">
                          <CheckSquare className="h-5 w-5" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Input</th>
                      <th className="px-4 py-3 text-left font-semibold">Output</th>
                      <th className="px-4 py-3 text-left font-semibold">Mode</th>
                      <th className="px-4 py-3 text-left font-semibold">Encryption</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredChannels.map((channel) => (
                      <tr
                        key={channel.channel_name}
                        className="hover:bg-[#F8F6F4] dark:hover:bg-[#2A2522] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedChannels.has(channel.channel_name)}
                            onChange={() => toggleSelectChannel(channel.channel_name)}
                            className="w-4 h-4 rounded border-[#E5E7EB] text-[#4A8B57] focus:ring-[#4A8B57]"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{channel.channel_name}</td>
                        <td className="px-4 py-3">
                          <Badge variant={channel.status === 'running' ? 'success' : 'destructive'}>
                            {channel.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {channel.input_protocol}://{channel.input_ip}:{channel.input_port}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {channel.destination_host || 'listener'}:{channel.output_port}
                        </td>
                        <td className="px-4 py-3 text-sm">{channel.mode}</td>
                        <td className="px-4 py-3 text-sm">
                          {channel.passphrase ? (
                            <span className="text-[#4A8B57]">AES-{(channel.pbkeylen || 16) * 8}</span>
                          ) : (
                            <span className="text-[#6B7280]">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {channel.status === 'running' ? (
                              <Button size="sm" variant="outline" onClick={() => {}}>
                                <Square className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => {}}>
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" disabled={channel.status === 'running'}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" disabled={channel.status === 'running'}>
                              <Trash2 className="h-3 w-3 text-[#B91C1C]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#4A8B57]">{channels.length}</div>
              <div className="text-sm text-[#6B7280]">Total Channels</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#4A8B57]">
                {channels.filter(ch => ch.status === 'running').length}
              </div>
              <div className="text-sm text-[#6B7280]">Running</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#6B7280]">
                {channels.filter(ch => ch.status === 'stopped').length}
              </div>
              <div className="text-sm text-[#6B7280]">Stopped</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#B8935E]">
                {channels.filter(ch => ch.passphrase).length}
              </div>
              <div className="text-sm text-[#6B7280]">Encrypted</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
