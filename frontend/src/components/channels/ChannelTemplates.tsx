'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Radio, Share2, GitMerge, Users, Copy } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  icon: any
  config: any
}

const templates: Template[] = [
  {
    id: 'one-to-many',
    name: '1 Input → Multiple Outputs',
    description: 'One source, broadcast to 10 clients (multicast distribution)',
    icon: Share2,
    config: {
      type: 'one-to-many',
      input: {
        protocol: 'srt',
        ip: '0.0.0.0',
        port: 9000,
      },
      outputs: Array.from({ length: 10 }, (_, i) => ({
        mode: 'caller',
        port: 9001 + i,
        host: `192.168.1.${100 + i}`,
      })),
    },
  },
  {
    id: 'many-to-one',
    name: 'Multiple Inputs → 1 Output',
    description: 'Two sources with priority failover (redundancy)',
    icon: GitMerge,
    config: {
      type: 'many-to-one',
      inputs: [
        {
          name: 'Primary Source',
          protocol: 'srt',
          ip: '0.0.0.0',
          port: 9000,
          priority: 1,
        },
        {
          name: 'Backup Source',
          protocol: 'srt',
          ip: '0.0.0.0',
          port: 9001,
          priority: 2,
        },
      ],
      output: {
        mode: 'listener',
        port: 9100,
      },
    },
  },
  {
    id: 'loadbalancer',
    name: 'Load Balancer',
    description: 'Distribute load across multiple destinations',
    icon: Users,
    config: {
      type: 'loadbalancer',
      input: {
        protocol: 'srt',
        ip: '0.0.0.0',
        port: 9000,
      },
      outputs: [
        { host: '192.168.1.100', port: 9100 },
        { host: '192.168.1.101', port: 9100 },
        { host: '192.168.1.102', port: 9100 },
      ],
    },
  },
]

interface ChannelTemplatesProps {
  onSelectTemplate: (template: Template) => void
  onClose: () => void
}

export default function ChannelTemplates({ onSelectTemplate, onClose }: ChannelTemplatesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Channel Templates</h2>
        <p className="text-muted-foreground">Select a template to quickly set up common configurations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, index) => (
          <div
            key={template.id}
          >
            <Card className="h-full hover:shadow-xl transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 p-3 text-white shadow-lg">
                      <template.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription className="mt-2">{template.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 text-sm">
                  {template.id === 'one-to-many' && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Radio className="h-3 w-3" />
                        Configuration
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>• Input: SRT Listener on port 9000</div>
                        <div>• Outputs: 10 SRT Callers (9001-9010)</div>
                        <div>• Auto-reconnect enabled</div>
                      </div>
                    </div>
                  )}

                  {template.id === 'many-to-one' && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Radio className="h-3 w-3" />
                        Configuration
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>• Primary: Port 9000 (Priority 1)</div>
                        <div>• Backup: Port 9001 (Priority 2)</div>
                        <div>• Output: Listener on port 9100</div>
                        <div>• Automatic failover</div>
                      </div>
                    </div>
                  )}

                  {template.id === 'loadbalancer' && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <Radio className="h-3 w-3" />
                        Configuration
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>• Input: SRT on port 9000</div>
                        <div>• 3 output destinations</div>
                        <div>• Round-robin distribution</div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => onSelectTemplate(template)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Create Custom Channel
        </Button>
      </div>
    </div>
  )
}
