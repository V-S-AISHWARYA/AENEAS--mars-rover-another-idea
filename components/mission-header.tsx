'use client'

import type { Telemetry } from '@/lib/telemetry'
import { Activity, Menu, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{value}</span>
    </div>
  )
}

export function MissionHeader({ t, title, subtitle, onMenu }: { t: Telemetry; title: string; subtitle: string; onMenu: () => void }) {
  const [clock, setClock] = useState('--:--:--')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const online = t.connection === 'streaming'

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card/60 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <div className="leading-tight">
          <h1 className="font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
            {title}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Stat label="Uplink" value={`${t.latencyMs} ms`} />
        <Stat label="Feed" value={`${t.fps} fps`} />
        <Stat label="Speed" value={`${t.speedMs} m/s`} />
        <Stat label="Battery" value={`${Math.round(t.battery)}%`} />
        <Stat label="MET" value={clock} />
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 ring-1 ${
            online ? 'bg-chart-3/10 text-chart-3 ring-chart-3/30' : 'bg-destructive/10 text-destructive ring-destructive/30'
          }`}
        >
          {online ? <Wifi className="size-4" /> : <Activity className="size-4 animate-pulse" />}
          <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
            {online ? 'IP WEBCAM · LIVE' : 'RECONNECTING'}
          </span>
        </div>
      </div>
    </header>
  )
}
