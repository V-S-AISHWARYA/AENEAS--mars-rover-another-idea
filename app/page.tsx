'use client'

import { useMemo, useState } from 'react'
import { useTelemetry } from '@/lib/telemetry'
import { useMissionLog } from '@/lib/mission-log'
import { AppSidebar, type ViewId } from '@/components/app-sidebar'
import { MissionHeader } from '@/components/mission-header'
import { CameraFeed } from '@/components/camera-feed'
import { LiveDetection } from '@/components/live-detection'
import { NavigationDecision } from '@/components/navigation-decision'
import { TerrainMap } from '@/components/terrain-map'
import { RiskAnalysis } from '@/components/risk-analysis'
import { MaterialAnalysis } from '@/components/material-analysis'
import { SlopeAnalysis } from '@/components/slope-analysis'
import { AlternateRoute } from '@/components/alternate-route'
import { DetectionsList } from '@/components/detections-list'
import { MissionLogView } from '@/components/mission-log-view'
import { SettingsView } from '@/components/settings-view'

const META: Record<ViewId, { title: string; subtitle: string }> = {
  overview: { title: 'MISSION OVERVIEW', subtitle: 'Full telemetry · obstacle avoidance' },
  live: { title: 'LIVE DETECTION', subtitle: 'Browser camera · real-time CV' },
  detections: { title: 'DETECTIONS', subtitle: 'Tracked objects · risk ranking' },
  map: { title: 'TERRAIN MAP', subtitle: 'SLAM · planned & alternate routes' },
  analysis: { title: 'ANALYSIS', subtitle: 'Risk · material · slope' },
  routes: { title: 'ROUTE PLANNER', subtitle: 'Divergence & slope optimization' },
  log: { title: 'MISSION LOG', subtitle: 'Event timeline · alerts' },
  settings: { title: 'SETTINGS', subtitle: 'Backend uplink · detection tuning' },
}

export default function Page() {
  const t = useTelemetry()
  const events = useMissionLog(t)
  const [view, setView] = useState<ViewId>('overview')
  const [navOpen, setNavOpen] = useState(false)

  const alerts = useMemo(() => events.filter((e) => e.level !== 'info').length, [events])

  const meta = META[view]

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        active={view}
        onNavigate={(v) => {
          setView(v)
          setNavOpen(false)
        }}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        t={t}
        alerts={alerts}
      />

      <div className="flex min-h-screen flex-col md:pl-60">
        <MissionHeader t={t} title={meta.title} subtitle={meta.subtitle} onMenu={() => setNavOpen(true)} />

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4">
          {view === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="flex flex-col gap-4 lg:col-span-7">
                <CameraFeed t={t} />
                <TerrainMap t={t} />
              </div>
              <div className="flex flex-col gap-4 lg:col-span-5">
                <NavigationDecision t={t} />
                <RiskAnalysis t={t} />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <MaterialAnalysis t={t} />
                  <SlopeAnalysis t={t} />
                </div>
                <AlternateRoute t={t} />
              </div>
            </div>
          )}

          {view === 'live' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <LiveDetection />
              </div>
              <div className="flex flex-col gap-4 lg:col-span-4">
                <NavigationDecision t={t} />
                <RiskAnalysis t={t} />
              </div>
            </div>
          )}

          {view === 'detections' && <DetectionsList t={t} />}

          {view === 'map' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <TerrainMap t={t} className="min-h-[560px]" />
              </div>
              <div className="flex flex-col gap-4 lg:col-span-4">
                <NavigationDecision t={t} />
                <SlopeAnalysis t={t} />
              </div>
            </div>
          )}

          {view === 'analysis' && (
            <div className="flex flex-col gap-4">
              <RiskAnalysis t={t} />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <MaterialAnalysis t={t} />
                <SlopeAnalysis t={t} />
              </div>
            </div>
          )}

          {view === 'routes' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <AlternateRoute t={t} />
              </div>
              <div className="flex flex-col gap-4 lg:col-span-5">
                <NavigationDecision t={t} />
                <SlopeAnalysis t={t} />
              </div>
            </div>
          )}

          {view === 'log' && <MissionLogView events={events} />}

          {view === 'settings' && <SettingsView />}

          <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>AENEAS Nav Console · mock telemetry stream</span>
            <span>swap lib/telemetry.ts → ws://&lt;laptop-ip&gt;:8000/ws/telemetry to go live</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
