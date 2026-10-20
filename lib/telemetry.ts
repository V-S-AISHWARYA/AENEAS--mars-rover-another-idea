'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Shape of the payload the Python backend should emit on GET /api/telemetry
 * and push over WS /ws/telemetry. Swap `useTelemetry` internals for a real
 * WebSocket to this contract without touching any component.
 */
export type Heading = 'FORWARD' | 'LEFT' | 'RIGHT' | 'HOLD'

export interface Detection {
  id: string
  label: string
  /** normalized 0..1 box relative to frame */
  x: number
  y: number
  w: number
  h: number
  confidence: number
  distanceM: number
  risk: 'low' | 'medium' | 'high'
}

export interface RiskFactor {
  label: string
  value: number // 0..100
}

export interface MaterialSample {
  t: number
  confidence: number
}

export interface RouteOption {
  id: string
  label: string
  headingDeg: number // divergence from current heading, negative = left
  distanceM: number
  slopeDeg: number
  risk: number // 0..100
  recommended: boolean
}

export interface Waypoint {
  x: number // 0..100 map space
  y: number
}

export interface Obstacle {
  x: number
  y: number
  r: number
  risk: 'low' | 'medium' | 'high'
}

export interface Telemetry {
  timestamp: number
  connection: 'streaming' | 'reconnecting'
  latencyMs: number
  fps: number
  heading: Heading
  steerConfidence: number
  speedMs: number
  battery: number
  detections: Detection[]
  overallRisk: number
  riskFactors: RiskFactor[]
  material: {
    name: string
    composition: { label: string; pct: number }[]
    grip: number
    history: MaterialSample[]
  }
  slope: {
    pitchDeg: number
    rollDeg: number
    roughness: number
    divergenceDeg: number
    profile: number[]
  }
  routes: RouteOption[]
  map: {
    rover: Waypoint
    planned: Waypoint[]
    alternate: Waypoint[]
    obstacles: Obstacle[]
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// deterministic initial state (no Math.random during render → no hydration drift)
const INITIAL: Telemetry = {
  timestamp: 0,
  connection: 'streaming',
  latencyMs: 42,
  fps: 11.8,
  heading: 'FORWARD',
  steerConfidence: 88,
  speedMs: 0.34,
  battery: 74,
  detections: [
    { id: 'b1', label: 'Boulder', x: 0.52, y: 0.44, w: 0.22, h: 0.3, confidence: 0.94, distanceM: 2.1, risk: 'high' },
    { id: 'r1', label: 'Rock cluster', x: 0.12, y: 0.62, w: 0.18, h: 0.18, confidence: 0.81, distanceM: 3.4, risk: 'medium' },
    { id: 'g1', label: 'Loose gravel', x: 0.7, y: 0.72, w: 0.24, h: 0.16, confidence: 0.68, distanceM: 1.6, risk: 'low' },
  ],
  overallRisk: 61,
  riskFactors: [
    { label: 'Collision', value: 72 },
    { label: 'Tip-over', value: 38 },
    { label: 'Traction loss', value: 55 },
    { label: 'Thermal', value: 21 },
  ],
  material: {
    name: 'Basaltic regolith',
    composition: [
      { label: 'Basalt', pct: 58 },
      { label: 'Iron oxide', pct: 24 },
      { label: 'Fine dust', pct: 12 },
      { label: 'Ice trace', pct: 6 },
    ],
    grip: 63,
    history: Array.from({ length: 24 }, (_, i) => ({ t: i, confidence: 60 + Math.round(20 * Math.sin(i / 3)) })),
  },
  slope: {
    pitchDeg: 6.4,
    rollDeg: -3.1,
    roughness: 44,
    divergenceDeg: -18,
    profile: [4, 6, 9, 7, 11, 8, 5, 6, 10, 12, 9, 7],
  },
  routes: [
    { id: 'r-l', label: 'Bearing 342° · left arc', headingDeg: -18, distanceM: 12.4, slopeDeg: 5.2, risk: 22, recommended: true },
    { id: 'r-c', label: 'Bearing 000° · straight', headingDeg: 0, distanceM: 8.1, slopeDeg: 9.8, risk: 68, recommended: false },
    { id: 'r-r', label: 'Bearing 021° · right arc', headingDeg: 24, distanceM: 14.9, slopeDeg: 6.6, risk: 41, recommended: false },
  ],
  map: {
    rover: { x: 50, y: 88 },
    planned: [
      { x: 50, y: 88 },
      { x: 44, y: 70 },
      { x: 38, y: 52 },
      { x: 40, y: 32 },
      { x: 46, y: 14 },
    ],
    alternate: [
      { x: 50, y: 88 },
      { x: 60, y: 68 },
      { x: 66, y: 46 },
      { x: 60, y: 24 },
    ],
    obstacles: [
      { x: 52, y: 60, r: 6, risk: 'high' },
      { x: 30, y: 44, r: 4, risk: 'medium' },
      { x: 70, y: 34, r: 3, risk: 'low' },
      { x: 44, y: 24, r: 3.5, risk: 'medium' },
    ],
  },
}

function drift(v: number, amt: number, min: number, max: number) {
  return clamp(v + (Math.random() - 0.5) * amt, min, max)
}

function nextState(prev: Telemetry): Telemetry {
  const overallRisk = drift(prev.overallRisk, 10, 8, 96)
  const heading: Heading = overallRisk > 70 ? (Math.random() > 0.5 ? 'LEFT' : 'HOLD') : overallRisk > 45 ? 'LEFT' : 'FORWARD'
  const history = [...prev.material.history.slice(1), {
    t: prev.material.history[prev.material.history.length - 1].t + 1,
    confidence: Math.round(drift(prev.material.history[prev.material.history.length - 1].confidence, 14, 40, 96)),
  }]
  return {
    ...prev,
    timestamp: Date.now(),
    connection: Math.random() > 0.97 ? 'reconnecting' : 'streaming',
    latencyMs: Math.round(drift(prev.latencyMs, 18, 22, 130)),
    fps: Number(drift(prev.fps, 1.6, 6, 15).toFixed(1)),
    heading,
    steerConfidence: Math.round(drift(prev.steerConfidence, 8, 45, 99)),
    speedMs: Number((heading === 'HOLD' ? 0 : drift(prev.speedMs, 0.12, 0.1, 0.6)).toFixed(2)),
    battery: clamp(prev.battery - Math.random() * 0.05, 5, 100),
    overallRisk: Math.round(overallRisk),
    detections: prev.detections.map((d) => ({
      ...d,
      confidence: Number(drift(d.confidence, 0.06, 0.4, 0.99).toFixed(2)),
      distanceM: Number(drift(d.distanceM, 0.3, 0.5, 6).toFixed(1)),
      x: clamp(d.x + (Math.random() - 0.5) * 0.015, 0.02, 1 - d.w - 0.02),
      y: clamp(d.y + (Math.random() - 0.5) * 0.01, 0.02, 1 - d.h - 0.02),
    })),
    riskFactors: prev.riskFactors.map((f) => ({ ...f, value: Math.round(drift(f.value, 12, 5, 98)) })),
    material: {
      ...prev.material,
      grip: Math.round(drift(prev.material.grip, 6, 30, 92)),
      history,
    },
    slope: {
      ...prev.slope,
      pitchDeg: Number(drift(prev.slope.pitchDeg, 1.4, -14, 20).toFixed(1)),
      rollDeg: Number(drift(prev.slope.rollDeg, 1.2, -14, 14).toFixed(1)),
      roughness: Math.round(drift(prev.slope.roughness, 8, 8, 92)),
      divergenceDeg: Math.round(drift(prev.slope.divergenceDeg, 6, -40, 40)),
      profile: [...prev.slope.profile.slice(1), clamp(prev.slope.profile[prev.slope.profile.length - 1] + (Math.random() - 0.5) * 4, 2, 14)],
    },
  }
}

export function useTelemetry(): Telemetry {
  const [state, setState] = useState<Telemetry>(INITIAL)
  const ref = useRef(INITIAL)

  useEffect(() => {
    // === Replace this block to go live ===
    // const ws = new WebSocket('ws://<laptop-ip>:8000/ws/telemetry')
    // ws.onmessage = (e) => setState(JSON.parse(e.data))
    // return () => ws.close()
    const id = setInterval(() => {
      ref.current = nextState(ref.current)
      setState(ref.current)
    }, 900)
    return () => clearInterval(id)
  }, [])

  return state
}
