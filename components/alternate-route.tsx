'use client'

import type { RouteOption, Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'
import { ArrowLeft, ArrowRight, ArrowUp, CheckCircle2 } from 'lucide-react'

function DirIcon({ deg }: { deg: number }) {
  if (deg < -5) return <ArrowLeft className="size-4" />
  if (deg > 5) return <ArrowRight className="size-4" />
  return <ArrowUp className="size-4" />
}

function riskTone(v: number) {
  if (v >= 60) return 'var(--destructive)'
  if (v >= 35) return 'var(--chart-4)'
  return 'var(--chart-3)'
}

function Row({ r }: { r: RouteOption }) {
  return (
    <div
      className={`rounded-md border p-2.5 ${r.recommended ? 'border-chart-3/50 bg-chart-3/5' : 'border-border bg-secondary/30'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded text-primary" style={{ background: 'color-mix(in oklch, var(--primary) 14%, transparent)' }}>
            <DirIcon deg={r.headingDeg} />
          </span>
          <span className="font-mono text-[11px] text-foreground">{r.label}</span>
        </div>
        {r.recommended && (
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-chart-3">
            <CheckCircle2 className="size-3.5" /> best
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px]">
        <div>
          <div className="text-muted-foreground">DIVERGE</div>
          <div className="text-foreground">
            {r.headingDeg > 0 ? '+' : ''}
            {r.headingDeg}°
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">DIST · SLOPE</div>
          <div className="text-foreground">
            {r.distanceM}m · {r.slopeDeg}°
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">RISK</div>
          <div style={{ color: riskTone(r.risk) }}>{r.risk}%</div>
        </div>
      </div>
    </div>
  )
}

export function AlternateRoute({ t }: { t: Telemetry }) {
  return (
    <Panel title="Route Planner" code="DIVERGENCE">
      <div className="flex flex-1 flex-col gap-2">
        {t.routes.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </div>
    </Panel>
  )
}
