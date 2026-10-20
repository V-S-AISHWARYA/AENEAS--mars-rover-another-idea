'use client'

import { useEffect, useRef, useState } from 'react'
import type { Telemetry } from './telemetry'

export type LogLevel = 'info' | 'warn' | 'crit'

export interface LogEvent {
  id: number
  t: number
  level: LogLevel
  msg: string
}

/**
 * Derives a running mission event log from the live telemetry stream.
 * Lifted to the page so the log persists while switching views.
 */
export function useMissionLog(t: Telemetry): LogEvent[] {
  const [events, setEvents] = useState<LogEvent[]>([
    { id: -1, t: Date.now(), level: 'info', msg: 'AENEAS core online · telemetry link established' },
  ])
  const idRef = useRef(0)
  const prev = useRef<{ heading?: string; risk?: number; conn?: string }>({})

  useEffect(() => {
    const push = (level: LogLevel, msg: string) =>
      setEvents((e) => [{ id: idRef.current++, t: Date.now(), level, msg }, ...e].slice(0, 120))

    const p = prev.current
    if (p.heading && p.heading !== t.heading) push('info', `Steering command → ${t.heading}`)
    if (t.overallRisk >= 80 && (p.risk ?? 0) < 80) push('crit', `Risk spike ${t.overallRisk}% · executing evasive maneuver`)
    else if (t.overallRisk >= 60 && (p.risk ?? 0) < 60) push('warn', `Elevated hazard ${t.overallRisk}% · slowing traverse`)
    if (p.conn && p.conn !== t.connection)
      push(t.connection === 'streaming' ? 'info' : 'warn', `Uplink ${t.connection === 'streaming' ? 'restored' : 'degraded — reconnecting'}`)

    prev.current = { heading: t.heading, risk: t.overallRisk, conn: t.connection }
  }, [t])

  return events
}
