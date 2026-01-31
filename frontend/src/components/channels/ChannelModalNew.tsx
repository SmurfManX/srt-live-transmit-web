'use client'

import { useState, useEffect } from 'react'
import { Channel, SourceInput, DestinationOutput, NetworkInterface } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Radio, Lock, Settings, Network } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { systemAPI } from '@/lib/api'

interface ChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (channel: Omit<Channel, 'status' | 'pid'>) => void
  mode: 'create' | 'edit'
  initialData?: Channel
}

export default function ChannelModalNew({ isOpen, onClose, onSave, mode, initialData }: ChannelModalProps) {
  const [channelName, setChannelName] = useState('')
  const [source, setSource] = useState<SourceInput>({
    protocol: 'srt', ip: '0.0.0.0', port: 9000, mode: 'listener', priority: 1, interface: '', extra_params: ''
  })
  const [destination, setDestination] = useState<DestinationOutput>({
    protocol: 'srt', mode: 'listener', host: '', port: 9100, multicast_ip: '', adapter: '', ttl: 32, interface: '', extra_params: ''
  })
  const [passphrase, setPassphrase] = useState('')
  const [pbkeylen, setPbkeylen] = useState<16 | 24 | 32>(16)
  const [streamid, setStreamid] = useState('')
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([])
  const [loadingInterfaces, setLoadingInterfaces] = useState(false)

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setChannelName(initialData.channel_name)
      if (initialData.sources && initialData.sources.length > 0) {
        setSource(initialData.sources[0])
      } else {
        setSource({
          protocol: initialData.input_protocol,
          ip: initialData.input_ip,
          port: initialData.input_port,
          mode: 'listener',
          priority: 1
        })
      }
      if (initialData.destinations && initialData.destinations.length > 0) {
        setDestination(initialData.destinations[0])
      } else {
        setDestination({
          protocol: initialData.output_protocol || 'srt',
          mode: initialData.mode,
          host: initialData.destination_host || '',
          port: initialData.output_port
        })
      }
      setPassphrase(initialData.passphrase || '')
      setPbkeylen(initialData.pbkeylen || 16)
      setStreamid(initialData.streamid || '')
    }
  }, [initialData, mode])

  // Fetch network interfaces
  useEffect(() => {
    if (isOpen) {
      setLoadingInterfaces(true)
      systemAPI.getInterfaces()
        .then(setNetworkInterfaces)
        .catch(err => console.error('Failed to fetch interfaces:', err))
        .finally(() => setLoadingInterfaces(false))
    }
  }, [isOpen])

  const updateSource = (field: keyof SourceInput, value: any) => {
    setSource({ ...source, [field]: value })
  }

  const handleSourceModeChange = (newMode: string) => {
    setSource({
      ...source,
      mode: newMode as 'listener' | 'caller' | 'rendezvous',
      ip: newMode === 'listener' ? '0.0.0.0' : ''
    })
  }

  const updateDestination = (field: keyof DestinationOutput, value: any) => {
    const updated = { ...destination, [field]: value }

    if (field === 'multicast_ip' && updated.protocol === 'udp') {
      const error = validateMulticastIP(value)
      if (error) {
        console.error('Multicast validation:', error)
      }
    }

    setDestination(updated)
  }

  const handleDestinationModeChange = (newMode: string) => {
    setDestination({
      ...destination,
      mode: newMode as 'listener' | 'caller' | 'rendezvous',
      host: newMode === 'listener' ? '' : destination.host
    })
  }

  const validateMulticastIP = (ip: string): string | null => {
    if (!ip || ip.trim() === '') return null
    const parts = ip.split('.')
    if (parts.length !== 4) return 'Invalid IP format'
    const octets = parts.map(p => parseInt(p))
    if (octets.some(o => isNaN(o) || o < 0 || o > 255)) {
      return 'Invalid IP octets'
    }
    if (octets[0] < 224 || octets[0] > 239) {
      return 'Multicast IP must be in range 224.0.0.0-239.255.255.255'
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate UDP multicast destination
    if (destination.protocol === 'udp' && destination.multicast_ip) {
      const error = validateMulticastIP(destination.multicast_ip)
      if (error) {
        alert(`Invalid multicast IP: ${error}`)
        return
      }
    }

    const channel: Omit<Channel, 'status' | 'pid'> = {
      channel_name: channelName,
      input_protocol: source.protocol,
      input_ip: source.ip,
      input_port: source.port,
      output_protocol: destination.protocol || 'srt',
      mode: destination.mode,
      output_port: destination.port,
      destination_host: destination.host,
      passphrase,
      pbkeylen,
      streamid,
      latency: 120,
      maxbw: -1,
      auto_reconnect: true,
      sources: [source],
      destinations: [destination],
    }

    onSave(channel)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {mode === 'create' ? 'Create New Channel' : 'Edit Channel'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-6">
                  {/* Channel Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-500" />
                      Channel Name
                    </label>
                    <Input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      disabled={mode === 'edit'}
                      required
                      placeholder="Enter channel name"
                      className="w-full"
                    />
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

                  {/* Input Source */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-indigo-500" />
                      Input Source
                    </h3>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 space-y-3">
                      {source.protocol === 'udp' ? (
                        /* UDP Input Fields */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Protocol
                              </label>
                              <select
                                value={source.protocol}
                                onChange={(e) => updateSource('protocol', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="srt">SRT</option>
                                <option value="udp">UDP</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                IP Address
                              </label>
                              <Input
                                type="text"
                                value={source.ip}
                                onChange={(e) => updateSource('ip', e.target.value)}
                                required
                                placeholder="0.0.0.0"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Port
                              </label>
                              <Input
                                type="number"
                                value={source.port}
                                onChange={(e) => updateSource('port', parseInt(e.target.value))}
                                required
                                placeholder="9000"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <Network className="w-3 h-3" />
                                Interface
                              </label>
                              <select
                                value={source.interface || ''}
                                onChange={(e) => updateSource('interface', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="">Auto (default)</option>
                                {networkInterfaces.map((iface) => (
                                  <option key={iface.name} value={iface.name}>
                                    {iface.name} ({iface.ip})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Extra Parameters
                              </label>
                              <Input
                                type="text"
                                value={source.extra_params || ''}
                                onChange={(e) => updateSource('extra_params', e.target.value)}
                                placeholder="e.g., pkt_size=1316"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* SRT Input Fields */
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Protocol
                              </label>
                              <select
                                value={source.protocol}
                                onChange={(e) => updateSource('protocol', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="srt">SRT</option>
                                <option value="udp">UDP</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Mode
                              </label>
                              <select
                                value={source.mode || 'listener'}
                                onChange={(e) => handleSourceModeChange(e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="listener">Listener</option>
                                <option value="caller">Caller</option>
                                <option value="rendezvous">Rendezvous</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                IP Address
                              </label>
                              {source.mode === 'listener' ? (
                                <select
                                  value={source.ip}
                                  onChange={(e) => updateSource('ip', e.target.value)}
                                  required
                                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                  <option value="0.0.0.0">0.0.0.0 (All interfaces)</option>
                                  {networkInterfaces.map((iface) => (
                                    <option key={iface.name} value={iface.ip}>
                                      {iface.ip} ({iface.name})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  type="text"
                                  value={source.ip}
                                  onChange={(e) => updateSource('ip', e.target.value)}
                                  required
                                  placeholder="Destination IP"
                                />
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Port
                              </label>
                              <Input
                                type="number"
                                value={source.port}
                                onChange={(e) => updateSource('port', parseInt(e.target.value))}
                                required
                                placeholder="9000"
                              />
                            </div>
                          </div>

                          {/* SRT Extra Parameters */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                              Extra Parameters
                            </label>
                            <Input
                              type="text"
                              value={source.extra_params || ''}
                              onChange={(e) => updateSource('extra_params', e.target.value)}
                              placeholder="e.g., latency=120,maxbw=-1"
                            />
                          </div>

                          {/* SRT Security Settings - Per Source */}
                          {source.protocol === 'srt' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-3 h-3 text-indigo-500" />
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Security (Optional)
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Input
                                    type="password"
                                    value={source.passphrase || ''}
                                    onChange={(e) => updateSource('passphrase', e.target.value)}
                                    placeholder="Passphrase"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={source.pbkeylen || 16}
                                    onChange={(e) => updateSource('pbkeylen', parseInt(e.target.value) as 16 | 24 | 32)}
                                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                  >
                                    <option value={16}>AES-128</option>
                                    <option value={24}>AES-192</option>
                                    <option value={32}>AES-256</option>
                                  </select>
                                </div>
                                <div>
                                  <Input
                                    type="text"
                                    value={source.streamid || ''}
                                    onChange={(e) => updateSource('streamid', e.target.value)}
                                    placeholder="Stream ID"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

                  {/* Output Destination */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-purple-500 rotate-180" />
                        Output Destination
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Common: SRT to UDP, SRT to SRT, UDP to SRT
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 space-y-3">
                      {destination.protocol === 'udp' ? (
                        /* UDP Output Fields */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Protocol
                              </label>
                              <select
                                value={destination.protocol || 'srt'}
                                onChange={(e) => updateDestination('protocol', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="srt">SRT</option>
                                <option value="udp">UDP</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <Radio className="w-3 h-3" />
                                Multicast IP
                              </label>
                              <Input
                                type="text"
                                value={destination.multicast_ip || ''}
                                onChange={(e) => updateDestination('multicast_ip', e.target.value)}
                                placeholder="e.g., 239.1.1.1 (optional)"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Port
                              </label>
                              <Input
                                type="number"
                                value={destination.port}
                                onChange={(e) => updateDestination('port', parseInt(e.target.value))}
                                required
                                placeholder="9100"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                  <Network className="w-3 h-3" />
                                  Adapter (multicast)
                                </label>
                                <select
                                  value={destination.adapter || ''}
                                  onChange={(e) => updateDestination('adapter', e.target.value)}
                                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  disabled={!destination.multicast_ip}
                                >
                                  <option value="">Auto (default)</option>
                                  {networkInterfaces.map((iface) => (
                                    <option key={iface.ip} value={iface.ip}>
                                      {iface.ip} ({iface.name})
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Local interface for multicast
                                </p>
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                  TTL (Time-To-Live)
                                </label>
                                <Input
                                  type="number"
                                  value={destination.ttl || 32}
                                  onChange={(e) => updateDestination('ttl', parseInt(e.target.value) || 0)}
                                  placeholder="32"
                                  min="1"
                                  max="255"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Default: 32
                                </p>
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                  Extra Parameters
                                </label>
                                <Input
                                  type="text"
                                  value={destination.extra_params || ''}
                                  onChange={(e) => updateDestination('extra_params', e.target.value)}
                                  placeholder="e.g., iptos=0xb8,mcloop=0"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  iptos, mcloop, sndbuf, rcvbuf
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* SRT Output Fields */
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Protocol
                              </label>
                              <select
                                value={destination.protocol || 'srt'}
                                onChange={(e) => updateDestination('protocol', e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="srt">SRT</option>
                                <option value="udp">UDP</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Mode
                              </label>
                              <select
                                value={destination.mode}
                                onChange={(e) => handleDestinationModeChange(e.target.value)}
                                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="listener">Listener</option>
                                <option value="caller">Caller</option>
                                <option value="rendezvous">Rendezvous</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Host
                              </label>
                              {destination.mode === 'listener' ? (
                                <select
                                  value={destination.host || '0.0.0.0'}
                                  onChange={(e) => updateDestination('host', e.target.value)}
                                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                  <option value="">Not required (all interfaces)</option>
                                  <option value="0.0.0.0">0.0.0.0 (All interfaces)</option>
                                  {networkInterfaces.map((iface) => (
                                    <option key={iface.name} value={iface.ip}>
                                      {iface.ip} ({iface.name})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  type="text"
                                  value={destination.host}
                                  onChange={(e) => updateDestination('host', e.target.value)}
                                  required
                                  placeholder="Enter host"
                                />
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Port
                              </label>
                              <Input
                                type="number"
                                value={destination.port}
                                onChange={(e) => updateDestination('port', parseInt(e.target.value))}
                                required
                                placeholder="9100"
                              />
                            </div>
                          </div>

                          {/* SRT Extra Parameters */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                              Extra Parameters
                            </label>
                            <Input
                              type="text"
                              value={destination.extra_params || ''}
                              onChange={(e) => updateDestination('extra_params', e.target.value)}
                              placeholder="e.g., oheadbw=50,maxbw=5000000"
                            />
                          </div>

                          {/* SRT Security Settings - Per Destination */}
                          {destination.protocol === 'srt' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-3 h-3 text-purple-500" />
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Security (Optional)
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Input
                                    type="password"
                                    value={destination.passphrase || ''}
                                    onChange={(e) => updateDestination('passphrase', e.target.value)}
                                    placeholder="Passphrase"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={destination.pbkeylen || 16}
                                    onChange={(e) => updateDestination('pbkeylen', parseInt(e.target.value) as 16 | 24 | 32)}
                                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                  >
                                    <option value={16}>AES-128</option>
                                    <option value={24}>AES-192</option>
                                    <option value={32}>AES-256</option>
                                  </select>
                                </div>
                                <div>
                                  <Input
                                    type="text"
                                    value={destination.streamid || ''}
                                    onChange={(e) => updateDestination('streamid', e.target.value)}
                                    placeholder="Stream ID"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

                  {/* Global Security Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-500" />
                      Global Security Settings (Optional)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          Passphrase
                        </label>
                        <Input
                          type="password"
                          value={passphrase}
                          onChange={(e) => setPassphrase(e.target.value)}
                          placeholder="Leave empty for no encryption"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          Key Length
                        </label>
                        <select
                          value={pbkeylen}
                          onChange={(e) => setPbkeylen(parseInt(e.target.value) as 16 | 24 | 32)}
                          className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value={16}>AES-128</option>
                          <option value={24}>AES-192</option>
                          <option value={32}>AES-256</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                          Stream ID
                        </label>
                        <Input
                          type="text"
                          value={streamid}
                          onChange={(e) => setStreamid(e.target.value)}
                          placeholder="Optional stream identifier"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {mode === 'create' ? 'Create Channel' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
