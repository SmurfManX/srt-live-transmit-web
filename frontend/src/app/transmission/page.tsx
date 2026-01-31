'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Network, Wifi, Globe, Settings, Plus, Trash2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NetworkInterface {
  name: string
  ip: string
  type: string
  status: 'active' | 'inactive'
}

interface MulticastGroup {
  id: string
  address: string
  port: number
  ttl: number
  description: string
  channels: number
}

export default function TransmissionPage() {
  const router = useRouter()
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [multicastGroups, setMulticastGroups] = useState<MulticastGroup[]>([
    { id: '1', address: '239.1.1.1', port: 5000, ttl: 32, description: 'Primary Distribution', channels: 3 },
    { id: '2', address: '239.1.1.2', port: 5001, ttl: 16, description: 'Secondary Distribution', channels: 1 },
  ])
  const [newGroup, setNewGroup] = useState({ address: '', port: 5000, ttl: 32, description: '' })

  useEffect(() => {
    fetchInterfaces()
  }, [])

  const fetchInterfaces = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/system/interfaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInterfaces(data.map((iface: any) => ({ ...iface, status: 'active' })))
      }
    } catch (error) {
      console.error('Failed to fetch interfaces:', error)
    }
  }

  const addMulticastGroup = () => {
    if (!newGroup.address || !newGroup.port) return
    const group: MulticastGroup = {
      id: Date.now().toString(),
      ...newGroup,
      channels: 0
    }
    setMulticastGroups([...multicastGroups, group])
    setNewGroup({ address: '', port: 5000, ttl: 32, description: '' })
  }

  const deleteGroup = (id: string) => {
    setMulticastGroups(multicastGroups.filter(g => g.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">Transmission</h1>
            <p className="text-[#6B7280] mt-1">Network interfaces and multicast group management</p>
          </div>
          <Button onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Network Interfaces */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-[#4A8B57]" />
                Network Interfaces
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchInterfaces}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {interfaces.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280]">No interfaces detected</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {interfaces.map((iface) => (
                  <div
                    key={iface.name}
                    className="p-4 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] hover:border-[#4A8B57] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-[#4A8B57]" />
                        <div className="font-semibold">{iface.name}</div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        iface.status === 'active'
                          ? 'bg-[#4A8B57]/10 text-[#4A8B57]'
                          : 'bg-[#6B7280]/10 text-[#6B7280]'
                      }`}>
                        {iface.status}
                      </div>
                    </div>
                    <div className="text-sm text-[#6B7280] mb-1">{iface.type}</div>
                    <div className="font-mono text-sm text-[#1F2937] dark:text-[#F9FAFB]">{iface.ip}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multicast Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#3B82F6]" />
              Multicast Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Group */}
            <div className="p-4 rounded-lg bg-[#F8F6F4] dark:bg-[#2A2522] border-2 border-dashed border-[#E5E7EB]">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Multicast Group
              </h3>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Multicast Address (e.g., 239.1.1.1)"
                    value={newGroup.address}
                    onChange={(e) => setNewGroup({ ...newGroup, address: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Port"
                    value={newGroup.port}
                    onChange={(e) => setNewGroup({ ...newGroup, port: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="TTL"
                    value={newGroup.ttl}
                    onChange={(e) => setNewGroup({ ...newGroup, ttl: parseInt(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-1">
                  <Button onClick={addMulticastGroup} className="w-full">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <Input
                  placeholder="Description (optional)"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                />
              </div>
            </div>

            {/* Groups List */}
            <div className="space-y-3">
              {multicastGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-lg border-2 border-[#E5E7EB] bg-white dark:bg-[#2A2522] hover:border-[#3B82F6] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-mono font-semibold text-lg">{group.address}:{group.port}</div>
                        <div className="px-2 py-0.5 rounded text-xs bg-[#3B82F6]/10 text-[#3B82F6]">
                          TTL: {group.ttl}
                        </div>
                        {group.channels > 0 && (
                          <div className="px-2 py-0.5 rounded text-xs bg-[#4A8B57]/10 text-[#4A8B57]">
                            {group.channels} channel{group.channels > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {group.description && (
                        <div className="text-sm text-[#6B7280]">{group.description}</div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGroup(group.id)}
                      disabled={group.channels > 0}
                    >
                      <Trash2 className="h-4 w-4 text-[#B91C1C]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {multicastGroups.length === 0 && (
              <div className="p-8 text-center text-[#6B7280]">
                No multicast groups configured
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bandwidth Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#B8935E]" />
              Bandwidth Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Total Bandwidth (Mbps)</label>
                <Input type="number" defaultValue="100" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Reserved Bandwidth (%)</label>
                <Input type="number" defaultValue="20" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bandwidth Distribution</label>
              <div className="w-full h-4 bg-[#E5E7EB] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#4A8B57]" style={{ width: '45%' }} title="SRT Channels: 45%" />
                <div className="h-full bg-[#3B82F6]" style={{ width: '30%' }} title="UDP Channels: 30%" />
                <div className="h-full bg-[#6B7280]" style={{ width: '5%' }} title="Reserved: 5%" />
              </div>
              <div className="flex gap-4 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#4A8B57]" />
                  SRT: 45 Mbps
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#3B82F6]" />
                  UDP: 30 Mbps
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#6B7280]" />
                  Available: 25 Mbps
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Multicast Info */}
        <Card className="bg-[#3B82F6]/10 border-[#3B82F6]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#3B82F6]/20">
                <Globe className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1F2937] dark:text-[#F9FAFB] mb-2">
                  Multicast Address Ranges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-[#3B82F6]">Local Network (224.0.0.0/24)</div>
                    <div className="text-[#6B7280]">Never forwarded by routers</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#3B82F6]">Organization (239.0.0.0/8)</div>
                    <div className="text-[#6B7280]">Private use within organization</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#3B82F6]">Global (224.0.1.0-238.255.255.255)</div>
                    <div className="text-[#6B7280]">Internet-wide multicast</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
