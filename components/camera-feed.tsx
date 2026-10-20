'use client'

import type { Detection, Telemetry } from '@/lib/telemetry'
import { Panel } from '@/components/panel'

const riskColor: Record<Detection['risk'], string> = {
  high: 'var(--destructive)',
  medium: 'var(--chart-4)',
  low: 'var(--chart-3)',
}

function Box({ d }: { d: Detection }) {
  const color = riskColor[d.risk]
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${d.x * 100}%`,
        top: `${d.y * 100}%`,
        width: `${d.w * 100}%`,
        height: `${d.h * 100}%`,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 0 1px color-mix(in oklch, ${color} 30%, transparent), inset 0 0 24px color-mix(in oklch, ${color} 14%, transparent)`,
        transition: 'left .8s linear, top .8s linear',
      }}
    >
      <span
        className="absolute -top-[18px] left-0 whitespace-nowrap px-1 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider"
        style={{ background: color, color: 'oklch(0.16 0.01 55)' }}
      >
        {d.label} · {Math.round(d.confidence * 100)}% · {d.distanceM}m
      </span>
    </div>
  )
}

export function CameraFeed({ t }: { t: Telemetry }) {
  return (
    <Panel
      title="Live Camera"
      code="CAM-0 / MJPEG"
      className="min-h-[340px]"
      right={
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-destructive">REC</span>
        </div>
      }
    >
      <div className="relative flex-1 overflow-hidden rounded-md ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rover-camera-view.png"
          alt="Forward-facing rover camera view of rocky terrain with detected obstacles"
          className="absolute inset-0 size-full object-cover"
        />
        {/* scan + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.1_0.01_55/0.55))]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, oklch(0 0 0/0.35) 2px 4px)' }}
        />
        {/* reticle */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-primary/50" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/50" />

        {t.detections.map((d) => (
          <Box key={d.id} d={d} />
        ))}

        {/* corner HUD */}
        <div className="absolute left-2 top-2 font-mono text-[10px] leading-tight text-primary/90">
          <div>OBJ · {t.detections.length}</div>
          <div>CONF · {Math.round((t.detections.reduce((a, d) => a + d.confidence, 0) / t.detections.length) * 100)}%</div>
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[10px] text-primary/90">
          {t.fps.toFixed(1)} FPS · {t.latencyMs}ms
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {t.detections.map((d) => (
          <div key={d.id} className="rounded-md border border-border bg-secondary/40 px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: riskColor[d.risk] }} />
              <span className="truncate font-mono text-[11px] text-foreground">{d.label}</span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {d.distanceM}m · {Math.round(d.confidence * 100)}%
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
