'use client'

import { useState, useEffect } from 'react'
import { Channel, NetworkInterface, DestinationOutput } from '@/types'
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

// Extra Parameters Templates
const inputParamsTemplates = [
  { name: 'Custom', value: '' },
  { name: 'Default SRT', value: 'rcvbuf=5000000' },
  { name: 'Low Latency', value: 'latency=50,rcvbuf=1000000' },
  { name: 'High Bandwidth', value: 'rcvbuf=10000000,sndbuf=10000000' },
  { name: 'Reliable Stream', value: 'rcvbuf=8000000,sndbuf=8000000,fc=60000' },
  { name: 'UDP Multicast Recv', value: 'rcvbuf=5000000' },
]

const outputParamsTemplates = [
  { name: 'Custom', value: '' },
  { name: 'Default SRT', value: 'sndbuf=5000000' },
  { name: 'Low Latency', value: 'latency=50,sndbuf=1000000' },
  { name: 'High Bandwidth', value: 'sndbuf=10000000,maxbw=0' },
  { name: 'UDP Multicast', value: 'ttl=32,mcloop=0' },
  { name: 'UDP High Quality', value: 'ttl=64,sndbuf=5000000,iptos=0xb8' },
]

interface OutputConfig {
  protocol: 'srt' | 'udp'
  mode: 'listener' | 'caller' | 'rendezvous'
  host: string
  port: number
  multicastIp: string
  interface: string
  passphrase: string
  extraParams: string
  expanded: boolean
}

const defaultOutput: OutputConfig = {
  protocol: 'srt',
  mode: 'listener',
  host: '',
  port: 9100,
  multicastIp: '',
  interface: '',
  passphrase: '',
  extraParams: '',
  expanded: true,
}

interface ChannelDialogProps {
  open: boolean
  onClose: () => void
  onSave: (channel: any) => void
  mode: 'create' | 'edit'
  initialData?: Channel
  interfaces?: NetworkInterface[]
}

export default function ChannelDialog({
  open,
  onClose,
  onSave,
  mode,
  initialData,
  interfaces = [],
}: ChannelDialogProps) {
  // Basic
  const [channelName, setChannelName] = useState('')

  // Input
  const [inputProtocol, setInputProtocol] = useState<'srt' | 'udp'>('srt')
  const [inputMode, setInputMode] = useState<'listener' | 'caller' | 'rendezvous'>('listener')
  const [inputIp, setInputIp] = useState('0.0.0.0')
  const [inputPort, setInputPort] = useState(9000)
  const [inputInterface, setInputInterface] = useState('')
  const [inputExtraParams, setInputExtraParams] = useState('')

  // Multiple outputs
  const [outputs, setOutputs] = useState<OutputConfig[]>([{ ...defaultOutput }])

  // Legacy single output (for backward compatibility when editing old channels)
  const [outputProtocol, setOutputProtocol] = useState<'srt' | 'udp'>('srt')
  const [outputMode, setOutputMode] = useState<'listener' | 'caller' | 'rendezvous'>('listener')
  const [outputHost, setOutputHost] = useState('')
  const [outputPort, setOutputPort] = useState(9100)
  const [outputInterface, setOutputInterface] = useState('')
  const [multicastIp, setMulticastIp] = useState('')
  const [outputExtraParams, setOutputExtraParams] = useState('')

  // SRT params
  const [latency, setLatency] = useState(120)
  const [passphrase, setPassphrase] = useState('')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData && mode === 'edit') {
        setChannelName(initialData.channel_name)
        setInputProtocol(initialData.input_protocol as 'srt' | 'udp')
        setInputMode(initialData.input_mode || 'listener')
        setInputIp(initialData.input_ip)
        setInputPort(initialData.input_port)
        setInputInterface(initialData.input_interface || '')
        setInputExtraParams(initialData.input_extra_params || '')
        setLatency(initialData.output_latency || 120)
        setPassphrase(initialData.passphrase || '')

        // Load destinations if present, otherwise use legacy single output
        if (initialData.destinations && initialData.destinations.length > 0) {
          const loadedOutputs: OutputConfig[] = initialData.destinations.map((dest, idx) => ({
            protocol: (dest.protocol || 'srt') as 'srt' | 'udp',
            mode: dest.mode as 'listener' | 'caller' | 'rendezvous',
            host: dest.host || '',
            port: dest.port || 9100,
            multicastIp: dest.multicast_ip || '',
            interface: dest.interface || dest.adapter || '',
            passphrase: dest.passphrase || '',
            extraParams: dest.extra_params || '',
            expanded: idx === 0,
          }))
          setOutputs(loadedOutputs)
        } else {
          // Legacy single output
          setOutputs([{
            protocol: (initialData.output_protocol || 'srt') as 'srt' | 'udp',
            mode: initialData.mode,
            host: initialData.destination_host || '',
            port: initialData.output_port,
            multicastIp: initialData.output_multicast_ip || '',
            interface: initialData.output_interface || '',
            passphrase: '',
            extraParams: initialData.output_extra_params || '',
            expanded: true,
          }])
        }

        // Keep legacy state in sync for backward compatibility
        setOutputProtocol((initialData.output_protocol || 'srt') as 'srt' | 'udp')
        setOutputMode(initialData.mode)
        setOutputHost(initialData.destination_host || '')
        setOutputPort(initialData.output_port)
        setOutputInterface(initialData.output_interface || '')
        setMulticastIp(initialData.output_multicast_ip || '')
        setOutputExtraParams(initialData.output_extra_params || '')
      } else {
        // Reset for create
        setChannelName('')
        setInputProtocol('srt')
        setInputMode('listener')
        setInputIp('0.0.0.0')
        setInputPort(9000)
        setInputInterface('')
        setInputExtraParams('')
        setOutputProtocol('srt')
        setOutputMode('listener')
        setOutputHost('')
        setOutputPort(9100)
        setOutputInterface('')
        setMulticastIp('')
        setOutputExtraParams('')
        setLatency(120)
        setPassphrase('')
        setOutputs([{ ...defaultOutput }])
      }
    }
  }, [open, initialData, mode])

  // Output management functions
  const addOutput = () => {
    const lastPort = outputs.length > 0 ? outputs[outputs.length - 1].port : 9000
    setOutputs([...outputs, { ...defaultOutput, port: lastPort + 100, expanded: true }])
  }

  const removeOutput = (idx: number) => {
    if (outputs.length > 1) {
      setOutputs(outputs.filter((_, i) => i !== idx))
    }
  }

  const updateOutput = (idx: number, field: keyof OutputConfig, value: any) => {
    setOutputs(outputs.map((out, i) => i === idx ? { ...out, [field]: value } : out))
  }

  const toggleOutputExpanded = (idx: number) => {
    setOutputs(outputs.map((out, i) => i === idx ? { ...out, expanded: !out.expanded } : out))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert outputs to destinations array
    const destinations = outputs.map(out => ({
      protocol: out.protocol,
      mode: out.mode,
      host: out.host,
      port: out.port,
      multicast_ip: out.multicastIp,
      adapter: out.interface,
      interface: out.interface,
      passphrase: out.passphrase,
      extra_params: out.extraParams,
    }))

    // Use first output for legacy fields (backward compatibility)
    const firstOutput = outputs[0]

    const channel = {
      channel_name: channelName,
      input_protocol: inputProtocol,
      input_mode: inputMode,
      input_ip: inputIp,
      input_port: inputPort,
      input_interface: inputInterface,
      input_extra_params: inputExtraParams,
      input_latency: latency,
      output_protocol: firstOutput.protocol,
      mode: firstOutput.mode,
      destination_host: firstOutput.host,
      output_port: firstOutput.port,
      output_interface: firstOutput.interface,
      output_multicast_ip: firstOutput.multicastIp,
      output_extra_params: firstOutput.extraParams,
      output_latency: latency,
      passphrase: passphrase,
      maxbw: -1,
      oheadbw: 25,
      destinations: destinations.length > 1 ? destinations : undefined,
    }

    onSave(channel)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] dark:border-[#333]">
          <h2 className="text-lg font-semibold text-[#111] dark:text-white">
            {mode === 'create' ? 'Create Channel' : 'Edit Channel'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded text-[#111] dark:text-[#ccc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-[#666] dark:text-[#999] mb-1">
              Channel Name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              required
              pattern="^[a-zA-Z0-9_-]+$"
              className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#222] text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
              placeholder="my_channel"
            />
          </div>

          {/* Input Section */}
          <div className="p-4 bg-[#f9f9f9] dark:bg-[#222] rounded-lg space-y-4">
            <h3 className="font-medium text-[#111] dark:text-white">Input Source</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Protocol</label>
                <select
                  value={inputProtocol}
                  onChange={(e) => setInputProtocol(e.target.value as 'srt' | 'udp')}
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                >
                  <option value="srt">SRT</option>
                  <option value="udp">UDP</option>
                </select>
              </div>

              {inputProtocol === 'srt' && (
                <div>
                  <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Mode</label>
                  <select
                    value={inputMode}
                    onChange={(e) => setInputMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                  >
                    <option value="listener">Listener</option>
                    <option value="caller">Caller</option>
                    <option value="rendezvous">Rendezvous</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                  {inputProtocol === 'udp' ? 'Multicast/Source IP' : 'Listen IP'}
                </label>
                <input
                  type="text"
                  value={inputIp}
                  onChange={(e) => setInputIp(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                  placeholder="0.0.0.0"
                />
              </div>

              <div>
                <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Port</label>
                <input
                  type="number"
                  value={inputPort}
                  onChange={(e) => setInputPort(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                  min={1}
                  max={65535}
                />
              </div>
            </div>

            {inputProtocol === 'udp' && interfaces.length > 0 && (
              <div>
                <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                  Network Interface (for multicast)
                </label>
                <select
                  value={inputInterface}
                  onChange={(e) => setInputInterface(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                >
                  <option value="">Auto</option>
                  {interfaces.map((iface) => (
                    <option key={iface.name} value={iface.ip}>
                      {iface.name} ({iface.ip})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                Extra Parameters
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) setInputExtraParams(e.target.value)
                  }}
                  className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white text-sm focus:outline-none"
                  value=""
                >
                  <option value="">Select template...</option>
                  {inputParamsTemplates.map((t) => (
                    <option key={t.name} value={t.value}>{t.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={inputExtraParams}
                onChange={(e) => setInputExtraParams(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                placeholder="rcvbuf=5000000,sndbuf=5000000"
              />
              <p className="text-xs text-[#999] mt-1">Select template or enter custom parameters</p>
            </div>
          </div>

          {/* Output Section */}
          <div className="p-4 bg-[#f9f9f9] dark:bg-[#222] rounded-lg space-y-4">
            <h3 className="font-medium text-[#111] dark:text-white">Output Destination</h3>

            {outputs.slice(0, 1).map((output, idx) => (
              <div key={idx} className="border border-[#e5e5e5] dark:border-[#444] rounded-lg overflow-hidden">
                {/* Output Header */}
                <div
                  className="flex items-center justify-between px-4 py-2 bg-[#f0f0f0] dark:bg-[#2a2a2a] cursor-pointer"
                  onClick={() => toggleOutputExpanded(idx)}
                >
                  <div className="flex items-center gap-2">
                    {output.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="font-medium text-sm text-[#111] dark:text-white">
                      {output.protocol.toUpperCase()} {output.mode}
                      {output.port > 0 && ` :${output.port}`}
                    </span>
                  </div>
                </div>

                {/* Output Body */}
                {output.expanded && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Protocol</label>
                        <select
                          value={output.protocol}
                          onChange={(e) => updateOutput(idx, 'protocol', e.target.value)}
                          className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                        >
                          <option value="srt">SRT</option>
                          <option value="udp">UDP</option>
                        </select>
                      </div>

                      {output.protocol === 'srt' && (
                        <div>
                          <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Mode</label>
                          <select
                            value={output.mode}
                            onChange={(e) => updateOutput(idx, 'mode', e.target.value)}
                            className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                          >
                            <option value="listener">Listener</option>
                            <option value="caller">Caller</option>
                            <option value="rendezvous">Rendezvous</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {output.protocol === 'udp' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                              Multicast IP <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={output.multicastIp}
                              onChange={(e) => updateOutput(idx, 'multicastIp', e.target.value)}
                              className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                              placeholder="239.1.1.1"
                            />
                            <p className="text-xs text-[#999] mt-1">Range: 224.0.0.0 - 239.255.255.255</p>
                          </div>

                          <div>
                            <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                              Port <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={output.port}
                              onChange={(e) => updateOutput(idx, 'port', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                              min={1}
                              max={65535}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                            Network Interface
                          </label>
                          <select
                            value={output.interface}
                            onChange={(e) => updateOutput(idx, 'interface', e.target.value)}
                            className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                          >
                            <option value="">Select interface...</option>
                            {interfaces.map((iface) => (
                              <option key={iface.name} value={iface.ip}>
                                {iface.name} ({iface.ip})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                            {output.mode === 'listener' ? 'Listen Address' : 'Destination Host'}
                          </label>
                          <input
                            type="text"
                            value={output.host}
                            onChange={(e) => updateOutput(idx, 'host', e.target.value)}
                            className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                            placeholder={output.mode === 'listener' ? '0.0.0.0 (optional)' : 'hostname or IP'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-[#666] dark:text-[#999] mb-1">Port</label>
                          <input
                            type="number"
                            value={output.port}
                            onChange={(e) => updateOutput(idx, 'port', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                            min={1}
                            max={65535}
                          />
                        </div>
                      </div>
                    )}

                    {/* Per-output passphrase for SRT */}
                    {output.protocol === 'srt' && (
                      <div>
                        <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                          Passphrase (optional, overrides global)
                        </label>
                        <input
                          type="password"
                          value={output.passphrase}
                          onChange={(e) => updateOutput(idx, 'passphrase', e.target.value)}
                          className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                          placeholder="Leave empty to use global passphrase"
                        />
                      </div>
                    )}

                    {/* Extra params per output */}
                    <div>
                      <label className="block text-sm text-[#666] dark:text-[#999] mb-1">
                        Extra Parameters
                      </label>
                      <div className="flex gap-2 mb-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) updateOutput(idx, 'extraParams', e.target.value)
                          }}
                          className="flex-1 px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white text-sm focus:outline-none"
                          value=""
                        >
                          <option value="">Select template...</option>
                          {outputParamsTemplates.map((t) => (
                            <option key={t.name} value={t.value}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={output.extraParams}
                        onChange={(e) => updateOutput(idx, 'extraParams', e.target.value)}
                        className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#111] dark:text-white focus:outline-none"
                        placeholder="sndbuf=5000000,ttl=32"
                      />
                      <p className="text-xs text-[#999] mt-1">Select template or enter custom parameters</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e5e5] dark:border-[#333]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e5e5e5] dark:border-[#333] rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-[#111] dark:text-[#ccc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName}
              className="px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-lg hover:bg-[#333] dark:hover:bg-[#eee] transition-colors disabled:opacity-50"
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
