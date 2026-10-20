'use client'

import type { Heading, Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'
import { ArrowLeft, ArrowRight, ArrowUp, Hand } from 'lucide-react'

const config: Record<Heading, { label: string; Icon: typeof ArrowUp; tone: string }> = {
  FORWARD: { label: 'PROCEED', Icon: ArrowUp, tone: 'var(--chart-3)' },
  LEFT: { label: 'STEER LEFT', Icon: ArrowLeft, tone: 'var(--primary)' },
  RIGHT: { label: 'STEER RIGHT', Icon: ArrowRight, tone: 'var(--primary)' },
  HOLD: { label: 'HOLD / STOP', Icon: Hand, tone: 'var(--destructive)' },
}

export function NavigationDecision({ t }: { t: Telemetry }) {
  const { label, Icon, tone } = config[t.heading]
  return (
    <Panel title="Nav Decision" code="AUTOPILOT">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <div
          className="flex size-28 items-center justify-center rounded-full ring-2 transition-colors"
          style={{ background: `color-mix(in oklch, ${tone} 12%, transparent)`, color: tone, borderColor: tone, boxShadow: `0 0 40px color-mix(in oklch, ${tone} 25%, transparent)` }}
        >
          <Icon className="size-14" strokeWidth={2.4} />
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-semibold tracking-[0.14em]" style={{ color: tone }}>
            {label}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            confidence {t.steerConfidence}%
          </div>
        </div>

        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full transition-all" style={{ width: `${t.steerConfidence}%`, background: tone }} />
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="rounded-md border border-border bg-secondary/40 px-2 py-1.5">
            <div className="text-muted-foreground">HEADING</div>
            <div className="text-foreground">{t.map.planned.length} wpts queued</div>
          </div>
          <div className="rounded-md border border-border bg-secondary/40 px-2 py-1.5">
            <div className="text-muted-foreground">DRIVE</div>
            <div className="text-foreground">{t.speedMs} m/s</div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
