'use client'

import type { Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'

function Gauge({ label, deg, max = 20 }: { label: string; deg: number; max?: number }) {
  const pct = Math.min(Math.abs(deg) / max, 1)
  const danger = Math.abs(deg) > max * 0.6
  return (
    <div className="rounded-md border border-border bg-secondary/40 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold" style={{ color: danger ? 'var(--destructive)' : 'var(--foreground)' }}>
        {deg > 0 ? '+' : ''}
        {deg}°
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: danger ? 'var(--destructive)' : 'var(--primary)' }} />
      </div>
    </div>
  )
}

export function SlopeAnalysis({ t }: { t: Telemetry }) {
  const p = t.slope.profile
  const w = 100
  const step = w / (p.length - 1)
  const line = p.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${28 - (v / 16) * 24}`).join(' ')

  return (
    <Panel title="Slope / Terrain" code="IMU + VISION">
      <div className="grid grid-cols-2 gap-2">
        <Gauge label="Pitch" deg={t.slope.pitchDeg} />
        <Gauge label="Roll" deg={t.slope.rollDeg} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="rounded-md border border-border bg-secondary/40 px-2.5 py-2">
          <div className="text-muted-foreground">ROUGHNESS</div>
          <div className="text-foreground">{t.slope.roughness}/100</div>
        </div>
        <div className="rounded-md border border-border bg-secondary/40 px-2.5 py-2">
          <div className="text-muted-foreground">DIVERGENCE</div>
          <div className="text-foreground">
            {t.slope.divergenceDeg > 0 ? '+' : ''}
            {t.slope.divergenceDeg}° {t.slope.divergenceDeg < 0 ? 'L' : t.slope.divergenceDeg > 0 ? 'R' : ''}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Elevation profile ahead</div>
        <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-12 w-full">
          <path d={`${line} L 100 28 L 0 28 Z`} fill="var(--primary)" opacity="0.12" />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </Panel>
  )
}
