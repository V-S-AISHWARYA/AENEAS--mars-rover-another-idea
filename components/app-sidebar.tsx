'use client'

import { cn } from '@/lib/utils'
import type { Telemetry } from '@/lib/telemetry'
import {
  LayoutDashboard,
  Video,
  ScanEye,
  Map as MapIcon,
  ShieldAlert,
  Route,
  ScrollText,
  Settings,
  Radio,
  X,
} from 'lucide-react'

export type ViewId = 'overview' | 'live' | 'detections' | 'map' | 'analysis' | 'routes' | 'log' | 'settings'

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard; code: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, code: 'DSH-00' },
  { id: 'live', label: 'Live Detection', icon: Video, code: 'CAM-01' },
  { id: 'detections', label: 'Detections', icon: ScanEye, code: 'OBJ-02' },
  { id: 'map', label: 'Terrain Map', icon: MapIcon, code: 'NAV-03' },
  { id: 'analysis', label: 'Analysis', icon: ShieldAlert, code: 'ANL-04' },
  { id: 'routes', label: 'Route Planner', icon: Route, code: 'RTE-05' },
  { id: 'log', label: 'Mission Log', icon: ScrollText, code: 'LOG-06' },
  { id: 'settings', label: 'Settings', icon: Settings, code: 'CFG-07' },
]

export function AppSidebar({
  active,
  onNavigate,
  open,
  onClose,
  t,
  alerts,
}: {
  active: ViewId
  onNavigate: (v: ViewId) => void
  open: boolean
  onClose: () => void
  t: Telemetry
  alerts: number
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
              <Radio className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="font-mono text-xs font-semibold tracking-[0.16em] text-foreground">AENEAS</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Nav Core</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Subsystems</p>
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const isActive = active === item.id
              const Icon = item.icon
              const showAlert = item.id === 'log' && alerts > 0
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 font-mono text-[13px] tracking-wide">{item.label}</span>
                    {showAlert ? (
                      <span className="flex size-4 items-center justify-center rounded-full bg-destructive font-mono text-[9px] font-bold text-destructive-foreground">
                        {alerts > 9 ? '9+' : alerts}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'font-mono text-[9px] tracking-widest',
                          isActive ? 'text-primary/70' : 'text-muted-foreground/50',
                        )}
                      >
                        {item.code}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-md bg-secondary/50 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Power</span>
              <span className="font-mono text-[11px] text-foreground">{Math.round(t.battery)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${t.battery}%`,
                  background: t.battery < 20 ? 'var(--destructive)' : 'var(--chart-3)',
                }}
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  t.connection === 'streaming' ? 'animate-pulse bg-chart-3' : 'bg-destructive',
                )}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {t.connection === 'streaming' ? 'Link nominal' : 'Reconnecting'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
