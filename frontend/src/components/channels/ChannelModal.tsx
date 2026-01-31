'use client'

import { useState, useEffect } from 'react'
import { Channel } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { X } from 'lucide-react'

interface ChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (channel: Omit<Channel, 'status' | 'pid'>) => void
  mode: 'create' | 'edit'
  initialData?: Channel
}

export default function ChannelModal({ isOpen, onClose, onSave, mode, initialData }: ChannelModalProps) {
  const [formData, setFormData] = useState<Omit<Channel, 'status' | 'pid'>>({
    channel_name: '',
    input_protocol: 'srt',
    input_ip: '0.0.0.0',
    input_port: 9000,
    mode: 'listener',
    output_port: 9100,
    destination_host: '',
    passphrase: '',
    pbkeylen: 16,
    streamid: '',
    latency: 120,
    maxbw: -1,
    auto_reconnect: true,
  })

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData(initialData)
    }
  }, [initialData, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-3xl max-h-[90vh] overflow-auto"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {mode === 'create' ? 'Create New Channel' : 'Edit Channel'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    {/* Channel Name */}
                    <div>
                      <label className="text-sm font-medium">Channel Name</label>
                      <Input
                        value={formData.channel_name}
                        onChange={(e) => handleChange('channel_name', e.target.value)}
                        disabled={mode === 'edit'}
                        required
                        className="mt-1"
                      />
                    </div>

                    {/* Input Settings */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Input Settings</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium">Protocol</label>
                          <select
                            value={formData.input_protocol}
                            onChange={(e) => handleChange('input_protocol', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                          >
                            <option value="udp">UDP</option>
                            <option value="srt">SRT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">IP Address</label>
                          <Input
                            value={formData.input_ip}
                            onChange={(e) => handleChange('input_ip', e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Port</label>
                          <Input
                            type="number"
                            value={formData.input_port}
                            onChange={(e) => handleChange('input_port', parseInt(e.target.value))}
                            required
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Output Settings */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Output Settings</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-sm font-medium">Mode</label>
                          <select
                            value={formData.mode}
                            onChange={(e) => handleChange('mode', e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                          >
                            <option value="listener">Listener</option>
                            <option value="caller">Caller</option>
                            <option value="rendezvous">Rendezvous</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Port</label>
                          <Input
                            type="number"
                            value={formData.output_port}
                            onChange={(e) => handleChange('output_port', parseInt(e.target.value))}
                            required
                            className="mt-1"
                          />
                        </div>
                        {(formData.mode === 'caller' || formData.mode === 'rendezvous') && (
                          <div>
                            <label className="text-sm font-medium">Destination Host</label>
                            <Input
                              value={formData.destination_host}
                              onChange={(e) => handleChange('destination_host', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Security (Optional)</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">Passphrase</label>
                          <Input
                            type="password"
                            value={formData.passphrase}
                            onChange={(e) => handleChange('passphrase', e.target.value)}
                            placeholder="Leave empty for no encryption"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Key Length</label>
                          <select
                            value={formData.pbkeylen}
                            onChange={(e) => handleChange('pbkeylen', parseInt(e.target.value))}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                          >
                            <option value={16}>AES-128</option>
                            <option value={24}>AES-192</option>
                            <option value={32}>AES-256</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Advanced */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Advanced Settings</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">Stream ID</label>
                          <Input
                            value={formData.streamid}
                            onChange={(e) => handleChange('streamid', e.target.value)}
                            placeholder="Optional"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Latency (ms)</label>
                          <Input
                            type="number"
                            value={formData.latency}
                            onChange={(e) => handleChange('latency', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="auto_reconnect"
                          checked={formData.auto_reconnect}
                          onChange={(e) => handleChange('auto_reconnect', e.target.checked)}
                          className="h-4 w-4 rounded"
                        />
                        <label htmlFor="auto_reconnect" className="text-sm font-medium">
                          Enable Auto-Reconnect
                        </label>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="gap-2 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {mode === 'create' ? 'Create Channel' : 'Save Changes'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
