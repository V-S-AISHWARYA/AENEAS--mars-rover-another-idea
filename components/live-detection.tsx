'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/panel'
import { Camera, CameraOff, RefreshCw, Activity, AlertTriangle } from 'lucide-react'

interface LiveBox {
  id: number
  x: number
  y: number
  w: number
  h: number
  intensity: number
}

type Facing = 'user' | 'environment'

function classify(area: number): { label: string; risk: 'low' | 'medium' | 'high'; color: string } {
  if (area > 0.16) return { label: 'OBSTACLE', risk: 'high', color: 'var(--destructive)' }
  if (area > 0.05) return { label: 'OBJECT', risk: 'medium', color: 'var(--chart-4)' }
  return { label: 'MOTION', risk: 'low', color: 'var(--chart-3)' }
}

/**
 * Real webcam capture via getUserMedia + genuine in-browser motion detection.
 * Frame differencing on a downscaled canvas → grid → connected-component boxes.
 * This is the browser-side stand-in for the YOLO boxes your Python backend
 * would draw; swap the source to your IP Webcam MJPEG when going live.
 */
export function LiveDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const workRef = useRef<HTMLCanvasElement>(null)
  const prevRef = useRef<Uint8ClampedArray | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [active, setActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<Facing>('environment')
  const [boxes, setBoxes] = useState<LiveBox[]>([])
  const [activity, setActivity] = useState(0)
  const [peak, setPeak] = useState(0)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    prevRef.current = null
    setActive(false)
    setBoxes([])
    setActivity(0)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera access was denied or is unavailable.')
    } finally {
      setStarting(false)
    }
  }, [facing])

  // restart stream when the facing mode changes while active
  useEffect(() => {
    if (!active) return
    let cancelled = false
    ;(async () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false })
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        /* keep previous stream */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing])

  useEffect(() => () => stop(), [stop])

  // detection loop
  useEffect(() => {
    if (!active) return
    const CW = 160
    const CH = 120
    const GW = 20
    const GH = 15
    const cellW = CW / GW
    const cellH = CH / GH

    const id = setInterval(() => {
      const v = videoRef.current
      const c = workRef.current
      if (!v || !c || v.videoWidth === 0) return
      const ctx = c.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(v, 0, 0, CW, CH)
      const cur = ctx.getImageData(0, 0, CW, CH).data
      const prev = prevRef.current

      if (prev) {
        const cell = new Float32Array(GW * GH)
        let total = 0
        for (let i = 0; i < cur.length; i += 4) {
          const p = i >> 2
          const px = p % CW
          const py = (p / CW) | 0
          const d = Math.abs(cur[i] - prev[i]) + Math.abs(cur[i + 1] - prev[i + 1]) + Math.abs(cur[i + 2] - prev[i + 2])
          if (d > 60) {
            const gx = Math.min(GW - 1, (px / cellW) | 0)
            const gy = Math.min(GH - 1, (py / cellH) | 0)
            cell[gy * GW + gx] += 1
            total++
          }
        }

        const act = Math.min(100, Math.round((total / (CW * CH)) * 400))
        setActivity(act)
        setPeak((pk) => Math.max(pk, act))

        const th = cellW * cellH * 0.16
        const on = new Uint8Array(GW * GH)
        for (let k = 0; k < cell.length; k++) on[k] = cell[k] > th ? 1 : 0

        const seen = new Uint8Array(GW * GH)
        const found: LiveBox[] = []
        let bid = 0
        for (let gy = 0; gy < GH; gy++) {
          for (let gx = 0; gx < GW; gx++) {
            const idx = gy * GW + gx
            if (!on[idx] || seen[idx]) continue
            let minx = gx
            let maxx = gx
            let miny = gy
            let maxy = gy
            let count = 0
            const q = [idx]
            seen[idx] = 1
            while (q.length) {
              const cell2 = q.pop() as number
              const cx = cell2 % GW
              const cy = (cell2 / GW) | 0
              count++
              if (cx < minx) minx = cx
              if (cx > maxx) maxx = cx
              if (cy < miny) miny = cy
              if (cy > maxy) maxy = cy
              const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
              ]
              for (const [nx, ny] of neighbors) {
                if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue
                const nidx = ny * GW + nx
                if (on[nidx] && !seen[nidx]) {
                  seen[nidx] = 1
                  q.push(nidx)
                }
              }
            }
            if (count >= 3) {
              found.push({
                id: bid++,
                x: minx / GW,
                y: miny / GH,
                w: (maxx - minx + 1) / GW,
                h: (maxy - miny + 1) / GH,
                intensity: Math.min(1, count / 24),
              })
            }
          }
        }
        found.sort((a, b) => b.w * b.h - a.w * a.h)
        setBoxes(found.slice(0, 5))
      }

      prevRef.current = cur
    }, 140)

    return () => clearInterval(id)
  }, [active])

  const mirror = facing === 'user'

  return (
    <Panel
      title="Live Detection"
      code="CAM-01 / getUserMedia"
      right={
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${active ? 'animate-pulse bg-destructive' : 'bg-muted-foreground/40'}`} />
          <span className={`font-mono text-[10px] uppercase tracking-widest ${active ? 'text-destructive' : 'text-muted-foreground'}`}>
            {active ? 'LIVE' : 'STANDBY'}
          </span>
        </div>
      }
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black ring-1 ring-border">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 size-full object-cover"
          style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
        />

        {/* scanlines + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0.1_0.01_55/0.55))]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, oklch(0 0 0/0.4) 2px 4px)' }}
        />

        {/* detection boxes */}
        {active &&
          boxes.map((b) => {
            const area = b.w * b.h
            const { label, color } = classify(area)
            const left = mirror ? 1 - b.x - b.w : b.x
            const dist = (Math.max(0.4, (1 - area) * 4.5)).toFixed(1)
            const conf = Math.round((0.5 + b.intensity * 0.49) * 100)
            return (
              <div
                key={b.id}
                className="pointer-events-none absolute"
                style={{
                  left: `${left * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                  border: `1.5px solid ${color}`,
                  boxShadow: `inset 0 0 20px color-mix(in oklch, ${color} 16%, transparent)`,
                }}
              >
                <span
                  className="absolute -top-[17px] left-0 whitespace-nowrap px-1 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider"
                  style={{ background: color, color: 'oklch(0.16 0.01 55)' }}
                >
                  {label} · {conf}% · {dist}m
                </span>
              </div>
            )
          })}

        {/* reticle */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 bg-primary/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/40" />

        {/* HUD */}
        {active && (
          <>
            <div className="absolute left-2 top-2 font-mono text-[10px] leading-tight text-primary/90">
              <div>TRK · {boxes.length}</div>
              <div>ACT · {activity}%</div>
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[10px] text-primary/90">
              MOTION-CV · {facing === 'user' ? 'FRONT' : 'REAR'}
            </div>
          </>
        )}

        {/* idle / error overlay */}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/40 px-6 text-center">
            {error ? (
              <>
                <AlertTriangle className="size-7 text-destructive" />
                <p className="max-w-xs font-mono text-[11px] leading-relaxed text-muted-foreground">{error}</p>
              </>
            ) : (
              <>
                <Camera className="size-7 text-muted-foreground" />
                <p className="max-w-xs font-mono text-[11px] leading-relaxed text-muted-foreground">
                  Grant camera access to run live obstacle detection in the browser.
                </p>
              </>
            )}
            <button
              onClick={start}
              disabled={starting}
              className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Camera className="size-4" />
              {starting ? 'Starting…' : 'Start Camera'}
            </button>
          </div>
        )}
      </div>

      <canvas ref={workRef} width={160} height={120} className="hidden" />

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {active ? (
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-foreground hover:bg-secondary"
          >
            <CameraOff className="size-3.5" /> Stop
          </button>
        ) : (
          <button
            onClick={start}
            disabled={starting}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Camera className="size-3.5" /> Start
          </button>
        )}
        <button
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          className="flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-foreground hover:bg-secondary"
        >
          <RefreshCw className="size-3.5" /> {facing === 'user' ? 'Front' : 'Rear'} cam
        </button>

        <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5">
          <Activity className="size-3.5 text-chart-3" />
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{ width: `${activity}%`, background: activity > 60 ? 'var(--destructive)' : 'var(--chart-3)' }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">pk {peak}%</span>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Detection runs client-side via frame differencing. Point the camera at movement to draw boxes. For the RC rover,
        swap this source for your phone&apos;s IP Webcam MJPEG and the backend YOLO stream.
      </p>
    </Panel>
  )
}
