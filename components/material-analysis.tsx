'use client'

import type { Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'

export function MaterialAnalysis({ t }: { t: Telemetry }) {
  const h = t.material.history
  const max = 100
  const w = 100
  const step = w / (h.length - 1)
  const line = h.map((s, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${28 - (s.confidence / max) * 26}`).join(' ')
  const area = `${line} L ${w} 28 L 0 28 Z`

  return (
    <Panel title="Material Analysis" code="SURFACE ID">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-sm text-foreground">{t.material.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">estimated composition</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-chart-2">{t.material.grip}%</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">grip index</div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {t.material.composition.map((c, i) => (
          <div key={c.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-[11px] text-muted-foreground">{c.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{ width: `${c.pct}%`, background: `var(--chart-${(i % 5) + 1})` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[11px] text-foreground">{c.pct}%</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Confidence · historical</span>
          <span>{h[h.length - 1].confidence}%</span>
        </div>
        <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-14 w-full">
          <path d={area} fill="var(--chart-2)" opacity="0.14" />
          <path d={line} fill="none" stroke="var(--chart-2)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </Panel>
  )
}
