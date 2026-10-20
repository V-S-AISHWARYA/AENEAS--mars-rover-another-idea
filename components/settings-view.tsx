'use client'

import { useState } from 'react'
import { Panel } from '@/components/panel'
import { Server, Camera, SlidersHorizontal, Check } from 'lucide-react'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-[13px] text-foreground outline-none ring-primary/40 transition-shadow placeholder:text-muted-foreground/50 focus:ring-2'

export function SettingsView() {
  const [wsUrl, setWsUrl] = useState('ws://192.168.1.42:8000/ws/telemetry')
  const [camUrl, setCamUrl] = useState('http://192.168.1.55:8080/video')
  const [sensitivity, setSensitivity] = useState(60)
  const [minConf, setMinConf] = useState(50)
  const [autoStop, setAutoStop] = useState(true)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Backend Uplink" code="CFG / core" right={<Server className="size-4 text-muted-foreground" />}>
        <div className="flex flex-col gap-4">
          <Field label="Telemetry WebSocket" hint="Your laptop FastAPI service. Replaces the mock stream in lib/telemetry.ts.">
            <input className={inputCls} value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} spellCheck={false} />
          </Field>
          <Field label="IP Webcam MJPEG" hint="Phone camera on the RC (Android IP Webcam / DroidCam).">
            <input className={inputCls} value={camUrl} onChange={(e) => setCamUrl(e.target.value)} spellCheck={false} />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2">
            <span className="font-mono text-[12px] text-foreground">Auto-halt on link loss</span>
            <button
              onClick={() => setAutoStop((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${autoStop ? 'bg-primary' : 'bg-border'}`}
              aria-pressed={autoStop}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${autoStop ? 'left-4' : 'left-0.5'}`}
              />
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Detection Tuning" code="CFG / vision" right={<SlidersHorizontal className="size-4 text-muted-foreground" />}>
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Motion sensitivity</span>
              <span className="font-mono text-[12px] text-foreground">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Min. confidence</span>
              <span className="font-mono text-[12px] text-foreground">{minConf}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>
          <div className="rounded-md border border-border bg-secondary/40 p-3">
            <div className="flex items-center gap-2">
              <Camera className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Model</span>
            </div>
            <p className="mt-1.5 font-mono text-[12px] text-foreground">YOLOv8n · monocular MiDaS depth</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">Browser fallback: frame-diff motion CV</p>
          </div>
        </div>
      </Panel>

      <div className="lg:col-span-2">
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
        >
          {saved ? <Check className="size-4" /> : null}
          {saved ? 'Saved' : 'Save configuration'}
        </button>
      </div>
    </div>
  )
}
