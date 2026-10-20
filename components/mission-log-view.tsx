'use client'

import type { LogEvent } from '@/lib/mission-log'
import { Panel } from '@/components/panel'
import { Info, AlertTriangle, ShieldAlert } from 'lucide-react'

const meta = {
  info: { color: 'var(--chart-3)', Icon: Info, label: 'INFO' },
  warn: { color: 'var(--chart-4)', Icon: AlertTriangle, label: 'WARN' },
  crit: { color: 'var(--destructive)', Icon: ShieldAlert, label: 'CRIT' },
} as const

function ts(t: number) {
  return new Date(t).toLocaleTimeString('en-GB', { hour12: false })
}

export function MissionLogView({ events }: { events: LogEvent[] }) {
  const counts = {
    info: events.filter((e) => e.level === 'info').length,
    warn: events.filter((e) => e.level === 'warn').length,
    crit: events.filter((e) => e.level === 'crit').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {(['info', 'warn', 'crit'] as const).map((k) => (
          <div key={k} className="rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{meta[k].label}</p>
            <p className="mt-1 font-mono text-2xl" style={{ color: meta[k].color }}>
              {counts[k]}
            </p>
          </div>
        ))}
      </div>

      <Panel title="Mission Event Log" code={`${events.length} entries`}>
        <ol className="flex flex-col">
          {events.map((e) => {
            const m = meta[e.level]
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 border-b border-border/40 py-2.5 last:border-0"
              >
                <span className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">{ts(e.t)}</span>
                <span
                  className="mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider"
                  style={{ background: `color-mix(in oklch, ${m.color} 18%, transparent)`, color: m.color }}
                >
                  <m.Icon className="size-3" />
                  {m.label}
                </span>
                <span className="flex-1 font-mono text-[12px] leading-relaxed text-foreground">{e.msg}</span>
              </li>
            )
          })}
        </ol>
      </Panel>
    </div>
  )
}
