# AENEAS · Autonomous Terrain Navigation Console

> Mission-control dashboard for a Mars rover that sees hazards, scores the risk, and steers itself out of danger.

**AENEAS** is a full-stack hackathon project built around one question: *how does a rover survive terrain it has never seen before?* The console gives operators a live view of everything the rover "thinks" while it drives: what it detects, how dangerous the ground ahead is, what the surface is made of, how steep it is, and which alternate route it would take to stay safe.

---

## The Problem

Mars rovers operate far from help, with communication delays measured in minutes. A single bad decision (a tip-over on a slope, a wheel stuck in loose regolith, a collision with a boulder) can end a mission. Rovers need to **perceive danger and react on their own**, and operators need a clear way to trust and monitor those decisions.

## The Solution

AENEAS combines onboard-style perception with a mission-control interface:

- **Detects** obstacles (boulders, rock clusters, loose gravel) from the rover camera, with confidence and estimated distance.
- **Scores risk** across four hazard types: collision, tip-over, traction loss, and thermal.
- **Classifies the surface material** and estimates grip.
- **Analyses slope** (pitch, roll, roughness) along the path.
- **Re-plans automatically**, comparing the planned route against alternates by distance, slope and risk, and recommending the safest one.
- **Logs every decision** (steering changes, risk spikes, evasive maneuvers, uplink drops) as a mission timeline.

---

## Features

| View | What it does |
| --- | --- |
| **Overview** | Full telemetry at a glance: camera feed, terrain map, navigation decision, risk, material, slope and alternate route. |
| **Live Detection** | Real browser-camera capture with in-browser computer vision (frame differencing, grid, connected-component boxes). Obstacles are labelled `OBSTACLE`, `OBJECT` or `MOTION` by size. Supports front and rear cameras. |
| **Detections** | Tracked objects ranked by risk, with confidence and distance. |
| **Terrain Map** | 2D map with the rover, planned path, alternate path and obstacles shaded by risk level. |
| **Analysis** | Risk breakdown, material composition and grip history, slope profile. |
| **Route Planner** | Compares routes by heading divergence, distance, slope and risk, and flags the recommended one. |
| **Mission Log** | Auto-generated event timeline with info, warning and critical alerts. |
| **Settings** | Backend WebSocket URL, IP Webcam stream URL, auto-halt on link loss, detection sensitivity and minimum confidence. |

### How the rover "withstands dangers"

The navigation decision is driven by overall risk. As risk climbs, the rover changes behaviour:

| Overall risk | Behaviour |
| --- | --- |
| Low | Continue `FORWARD` |
| Elevated (≥ 45) | Steer `LEFT`/`RIGHT` toward the lower-risk route |
| High (≥ 70) | Evasive maneuver or `HOLD` (speed drops to 0) |

The mission log records each transition (for example *"Elevated hazard · slowing traverse"* and *"Risk spike · executing evasive maneuver"*).

---

## Tech Stack

**Frontend (this repository)**

- [Next.js](https://nextjs.org/) 16 (App Router) with [React](https://react.dev/) 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) (base-nova style) with [Base UI](https://base-ui.com/)
- [lucide-react](https://lucide.dev/) icons
- Browser APIs: `getUserMedia` and Canvas for live camera detection
- [pnpm](https://pnpm.io/) for package management

**Backend (planned uplink)**

- Python **FastAPI** service streaming telemetry over WebSocket and REST
- **YOLOv8n** for object detection and monocular **MiDaS** for depth estimation
- Phone camera mounted on the rover (Android *IP Webcam* / DroidCam) streaming MJPEG

> **Note:** the Python backend is not included in this repository. The frontend currently runs on a built-in mock telemetry stream so the full UI can be demoed without hardware. See [Going Live](#going-live-connecting-the-backend).

---

## Architecture

```
┌────────────────────┐   MJPEG    ┌──────────────────────────┐   WebSocket   ┌─────────────────────┐
│  Rover + phone cam │ ─────────► │  Python FastAPI backend  │ ────────────► │  AENEAS console     │
│  (IP Webcam)       │            │  YOLOv8n · MiDaS · SLAM  │  /ws/telemetry│  (Next.js dashboard)│
└────────────────────┘            │  risk · slope · routing  │               └─────────────────────┘
                                  └──────────────────────────┘
```

The whole UI is driven by a single `Telemetry` object, so the data source can be swapped without touching any component.

---

## Project Structure

```
├── app/
│   ├── layout.tsx            # Root layout, fonts, metadata
│   ├── page.tsx              # Console shell + view routing
│   └── globals.css           # Theme tokens (Mars-dusk dark palette)
├── components/
│   ├── app-sidebar.tsx       # Navigation (8 views)
│   ├── mission-header.tsx    # Status bar: link, latency, FPS, battery
│   ├── camera-feed.tsx       # Rover camera with detection overlays
│   ├── live-detection.tsx    # Browser webcam + frame-diff CV
│   ├── detections-list.tsx   # Risk-ranked detections
│   ├── terrain-map.tsx       # Rover, routes and obstacles map
│   ├── navigation-decision.tsx
│   ├── risk-analysis.tsx
│   ├── material-analysis.tsx
│   ├── slope-analysis.tsx
│   ├── alternate-route.tsx
│   ├── mission-log-view.tsx
│   ├── settings-view.tsx
│   ├── panel.tsx             # Shared panel wrapper
│   └── ui/                   # shadcn primitives
├── lib/
│   ├── telemetry.ts          # Telemetry types + mock stream hook (swap point)
│   ├── mission-log.ts        # Derives event log from telemetry
│   └── utils.ts
└── public/                   # Icons and sample rover camera frame
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (required by Next.js 16)
- [pnpm](https://pnpm.io/installation)

### Install and run

```bash
# 1. Install dependencies
pnpm install

# 2. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
pnpm build
pnpm start
```

### Trying the Live Detection view

1. Open **Live Detection** in the sidebar.
2. Click **Start Camera** and allow camera access.
3. Move something in front of the camera. Boxes appear around moving regions, labelled by size and risk.

> Camera access requires `localhost` or HTTPS.

---

## Going Live: Connecting the Backend

The dashboard expects the backend to push JSON matching the `Telemetry` interface in [`lib/telemetry.ts`](lib/telemetry.ts) over **`WS /ws/telemetry`** (also available as `GET /api/telemetry`).

In `useTelemetry()`, replace the mock interval with a WebSocket:

```ts
useEffect(() => {
  const ws = new WebSocket('ws://<laptop-ip>:8000/ws/telemetry')
  ws.onmessage = (e) => setState(JSON.parse(e.data))
  return () => ws.close()
}, [])
```

**Payload overview**

| Field | Description |
| --- | --- |
| `heading`, `steerConfidence`, `speedMs`, `battery` | Navigation decision and vehicle state |
| `detections[]` | Normalized boxes with label, confidence, distance (m) and risk |
| `overallRisk`, `riskFactors[]` | 0–100 risk score and per-hazard breakdown |
| `material` | Surface name, composition, grip, confidence history |
| `slope` | Pitch, roll, roughness, heading divergence, slope profile |
| `routes[]` | Route options with heading, distance, slope, risk, `recommended` flag |
| `map` | Rover position, planned and alternate waypoints, obstacles |
| `connection`, `latencyMs`, `fps` | Link health |

To use the rover's camera, point `public/rover-camera-view.png` in `camera-feed.tsx` (or the Live Detection source) at your phone's MJPEG stream URL.

---

## Current Status

- [x] Full mission-control UI with 8 views
- [x] Typed telemetry contract, ready for a real backend
- [x] Real in-browser camera detection
- [x] Auto-generated mission log
- [ ] Python FastAPI backend (YOLOv8n + MiDaS)
- [ ] Live WebSocket telemetry replacing the mock stream
- [ ] Settings persistence (the form is UI-only for now)
- [ ] Hardware integration with the RC rover

## Roadmap

- Real SLAM-based mapping on the terrain view
- Learned surface and slope classification from real terrain data
- Onboard autonomous halt when the uplink is lost
- Replay mode for mission logs
