'use client'

import type { Detection, Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'

const riskColor: Record<Detection['risk'], string> = {
  high: 'var(--destructive)',
  medium: 'var(--chart-4)',
  low: 'var(--chart-3)',
}

function bearing(x: number) {
  // map normalized center x (0..1) to a relative bearing in degrees
  const deg = Math.round((x - 0.5) * 90)
  if (deg === 0) return '0° C'
  return `${Math.abs(deg)}° ${deg < 0 ? 'L' : 'R'}`
}

export function DetectionsList({ t }: { t: Telemetry }) {
  const sorted = [...t.detections].sort((a, b) => b.confidence - a.confidence)
  const counts = {
    high: t.detections.filter((d) => d.risk === 'high').length,
    medium: t.detections.filter((d) => d.risk === 'medium').length,
    low: t.detections.filter((d) => d.risk === 'low').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tracked</p>
          <p className="mt-1 font-mono text-2xl text-foreground">{t.detections.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">High risk</p>
          <p className="mt-1 font-mono text-2xl" style={{ color: riskColor.high }}>{counts.high}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Medium</p>
          <p className="mt-1 font-mono text-2xl" style={{ color: riskColor.medium }}>{counts.medium}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nearest</p>
          <p className="mt-1 font-mono text-2xl text-foreground">
            {Math.min(...t.detections.map((d) => d.distanceM)).toFixed(1)}
            <span className="text-sm text-muted-foreground">m</span>
          </p>
        </div>
      </div>

      <Panel title="Detected Objects" code="YOLO / live">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-2 py-2 text-left font-medium">Object</th>
                <th className="px-2 py-2 text-left font-medium">Confidence</th>
                <th className="px-2 py-2 text-right font-medium">Distance</th>
                <th className="px-2 py-2 text-right font-medium">Bearing</th>
                <th className="px-2 py-2 text-right font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: riskColor[d.risk] }} />
                      <span className="font-mono text-[13px] text-foreground">{d.label}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${d.confidence * 100}%`, background: riskColor[d.risk] }}
                        />
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {Math.round(d.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-[12px] tabular-nums text-foreground">
                    {d.distanceM.toFixed(1)}m
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                    {bearing(d.x + d.w / 2)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                      style={{ background: `color-mix(in oklch, ${riskColor[d.risk]} 18%, transparent)`, color: riskColor[d.risk] }}
                    >
                      {d.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
