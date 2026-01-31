'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Share2, GitMerge, Users, Radio, Download, Upload, Copy, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Template {
  id: string
  name: string
  description: string
  icon: any
  category: 'distribution' | 'backup' | 'contribution' | 'production'
  config: {
    input_protocol: string
    output_protocol: string
    mode: string
    use_case: string
    recommended_settings: string[]
  }
}

const templates: Template[] = [
  {
    id: 'one-to-many',
    name: '1 Input → Multiple Outputs',
    description: 'Broadcast one source to 10+ clients via multicast distribution',
    icon: Share2,
    category: 'distribution',
    config: {
      input_protocol: 'srt',
      output_protocol: 'udp',
      mode: 'multicast',
      use_case: 'Live event streaming, IPTV distribution',
      recommended_settings: ['Multicast: 239.1.1.1', 'TTL: 32', 'Bitrate: 5-15 Mbps']
    }
  },
  {
    id: 'failover',
    name: 'Redundant Input Failover',
    description: 'Primary + backup inputs with automatic failover',
    icon: GitMerge,
    category: 'backup',
    config: {
      input_protocol: 'srt',
      output_protocol: 'srt',
      mode: 'caller',
      use_case: 'Mission-critical broadcasts',
      recommended_settings: ['Priority: Primary=1, Backup=2', 'Latency: 200ms', 'Auto-reconnect: enabled']
    }
  },
  {
    id: 'contribution',
    name: 'Remote Contribution Feed',
    description: 'Secure encrypted feed from remote location',
    icon: Radio,
    category: 'contribution',
    config: {
      input_protocol: 'srt',
      output_protocol: 'srt',
      mode: 'caller',
      use_case: 'News gathering, remote production',
      recommended_settings: ['AES-256 encryption', 'Latency: 500-2000ms', 'Adaptive bitrate']
    }
  },
  {
    id: 'studio-to-studio',
    name: 'Studio-to-Studio Link',
    description: 'High-quality uncompressed link between facilities',
    icon: Users,
    category: 'production',
    config: {
      input_protocol: 'srt',
      output_protocol: 'srt',
      mode: 'rendezvous',
      use_case: 'Inter-studio connectivity',
      recommended_settings: ['Latency: 40-120ms', 'Bitrate: 50+ Mbps', 'FEC: enabled']
    }
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyConfig = (template: Template) => {
    const config = JSON.stringify(template.config, null, 2)
    navigator.clipboard.writeText(config)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const useTemplate = (template: Template) => {
    // Store template in localStorage and redirect to main page
    localStorage.setItem('selectedTemplate', JSON.stringify(template))
    router.push('/?openDialog=true')
  }

  const exportTemplate = (template: Template) => {
    const data = JSON.stringify(template, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-${template.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">Channel Templates</h1>
            <p className="text-[#6B7280] mt-1">Pre-configured templates for common scenarios</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              Import Template
            </Button>
            <Button onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'distribution', 'backup', 'contribution', 'production'].map(cat => (
            <button
              key={cat}
              className="px-4 py-2 rounded-lg border-2 border-[#E5E7EB] hover:border-[#4A8B57] hover:bg-[#4A8B57]/10 transition-colors capitalize"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Card key={template.id} className="hover:shadow-xl transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-[#4A8B57]/10 text-[#4A8B57] group-hover:bg-[#4A8B57] group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="mt-1 px-2 py-0.5 rounded text-xs bg-[#B8935E]/10 text-[#B8935E] inline-block capitalize">
                          {template.category}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#6B7280] uppercase">Use Case</div>
                    <div className="text-sm text-[#1F2937] dark:text-[#F9FAFB]">
                      {template.config.use_case}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#6B7280] uppercase">Recommended Settings</div>
                    <ul className="space-y-1">
                      {template.config.recommended_settings.map((setting, idx) => (
                        <li key={idx} className="text-xs text-[#6B7280] flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-[#4A8B57]" />
                          {setting}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => useTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyConfig(template)}
                    >
                      {copiedId === template.id ? (
                        <CheckCircle className="h-4 w-4 text-[#4A8B57]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportTemplate(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-[#3B82F6]/10 border-[#3B82F6]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#3B82F6]/20">
                <Radio className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1F2937] dark:text-[#F9FAFB] mb-1">
                  Custom Templates
                </h3>
                <p className="text-sm text-[#6B7280]">
                  You can create and save your own templates. Export any channel configuration from the main dashboard
                  and import it here to reuse across multiple channels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
