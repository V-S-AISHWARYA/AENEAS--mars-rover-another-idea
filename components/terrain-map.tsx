'use client'

import type { Telemetry, Waypoint } from '@/lib/telemetry'
import { Panel } from '@/components/panel'
import { cn } from '@/lib/utils'

const obsColor = { high: 'var(--destructive)', medium: 'var(--chart-4)', low: 'var(--chart-3)' } as const

function path(points: Waypoint[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

export function TerrainMap({ t, className }: { t: Telemetry; className?: string }) {
  const { rover, planned, alternate, obstacles } = t.map
  return (
    <Panel
      title="Terrain Map"
      code="TOP-DOWN / SLAM"
      className={cn('min-h-[340px]', className)}
      right={<span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">grid 1m</span>}
    >
      <div className="relative flex-1 overflow-hidden rounded-md bg-secondary/30 ring-1 ring-border">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* alternate route */}
          <path d={path(alternate)} fill="none" stroke="var(--chart-2)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
          {/* planned route */}
          <path d={path(planned)} fill="none" stroke="var(--primary)" strokeWidth="1.1" strokeLinejoin="round" />
          {planned.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.9" fill="var(--primary)" />
          ))}

          {/* obstacles */}
          {obstacles.map((o, i) => (
            <g key={i}>
              <circle cx={o.x} cy={o.y} r={o.r} fill={obsColor[o.risk]} opacity="0.18" />
              <circle cx={o.x} cy={o.y} r={o.r} fill="none" stroke={obsColor[o.risk]} strokeWidth="0.5" />
            </g>
          ))}

          {/* rover */}
          <g>
            <circle cx={rover.x} cy={rover.y} r="2.4" fill="var(--chart-3)" />
            <circle cx={rover.x} cy={rover.y} r="4.5" fill="none" stroke="var(--chart-3)" strokeWidth="0.4" opacity="0.6" />
          </g>
        </svg>

        <div className="absolute bottom-2 left-2 flex gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1 text-primary"><span className="inline-block h-0.5 w-3 bg-primary" />planned</span>
          <span className="flex items-center gap-1 text-chart-2"><span className="inline-block h-0.5 w-3 border-t border-dashed border-chart-2" />alternate</span>
        </div>
        <div className="absolute right-2 top-2 font-mono text-[10px] text-chart-3">◎ rover</div>
      </div>
    </Panel>
  )
}
