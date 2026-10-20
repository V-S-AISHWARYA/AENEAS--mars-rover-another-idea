'use client'

import type { Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'

function tone(v: number) {
  if (v >= 70) return 'var(--destructive)'
  if (v >= 45) return 'var(--chart-4)'
  return 'var(--chart-3)'
}

export function RiskAnalysis({ t }: { t: Telemetry }) {
  const r = t.overallRisk
  const dash = 2 * Math.PI * 34
  const level = r >= 70 ? 'CRITICAL' : r >= 45 ? 'ELEVATED' : 'NOMINAL'
  return (
    <Panel title="Risk Analysis" code="REAL-TIME">
      <div className="flex flex-1 items-center gap-5">
        <div className="relative size-[92px] shrink-0">
          <svg viewBox="0 0 80 80" className="size-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--secondary)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={tone(r)}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - r / 100)}
              style={{ transition: 'stroke-dashoffset .6s ease, stroke .6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-semibold text-foreground">{r}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: tone(r) }}>
              {level}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {t.riskFactors.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-foreground">{f.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full transition-all" style={{ width: `${f.value}%`, background: tone(f.value) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
