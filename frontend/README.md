# ClientPulse Frontend

Dashboard UI for ClientPulse AI — portfolio health, SLA attainment, renewal risk,
a prioritized risk queue, an account detail drawer, and a grounded chat assistant.
Talks to the [backend](../backend/README.md) read + agent API.

Stack: **React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · TanStack Query · ECharts + Nivo**.

## Prerequisites

- Node 18+ (20+ recommended)
- The backend running (default `http://localhost:8000`) for live data

## Run

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Environment

| Var | Purpose | Default |
|-----|---------|---------|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:8000` |

Create `.env.local` for overrides:

```
VITE_API_URL=http://localhost:8000
```

For a deployed build, point it at your hosted backend, e.g.
`VITE_API_URL=https://clientpulse-api.onrender.com`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server + HMR |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Structure

```
frontend/src/
├── App.tsx
├── lib/api.ts                    # typed API client (mirrors backend schemas); reads VITE_API_URL
├── components/
│   ├── dashboard/
│   │   ├── portfolio-view.tsx    # KPIs + charts + accounts table
│   │   ├── kpi-cards.tsx         # health / SLA / at-risk / ARR-at-risk KPIs
│   │   ├── health-trend.tsx      # portfolio health trend
│   │   ├── distribution-donut.tsx# status distribution
│   │   ├── account-landscape.tsx # ARR × health bubble chart
│   │   ├── accounts-table.tsx    # sortable/filterable account list
│   │   ├── account-drawer.tsx    # per-account detail: gauges, SLA, signals, actions, contract
│   │   ├── risk-queue.tsx        # prioritized signal → action → confidence cards
│   │   ├── chat-panel.tsx        # grounded per-account Q&A
│   │   ├── assistant-dock.tsx    # chat launcher
│   │   ├── awaiting-analysis.tsx # empty/pre-analysis state
│   │   ├── sidebar.tsx / topbar.tsx / status-badge.tsx / echart.tsx
│   └── ui/                        # shadcn/ui primitives (button, card, table, sheet, …)
└── chat-showcase/                 # standalone chat demo
```

## Data flow

- `lib/api.ts` is the single typed client; its types mirror `backend/src/api/schemas.py`.
- Reads: `GET /accounts`, `GET /accounts/{uid}`, `GET /risks`.
- Actions: `POST /accounts/{uid}/analyze`, `POST /accounts/{uid}/chat`,
  `PATCH /actions/{id}` (approve/dismiss), `PATCH /signals/{id}` (confirm/false-positive).
- TanStack Query handles fetching, caching, and refetch after mutations.

## Deploy (free tier)

Static build — host anywhere:

```bash
npm run build          # outputs dist/
```

- **Vercel / Netlify** (free): connect the repo, set root to `frontend/`,
  build `npm run build`, output `dist/`, and set `VITE_API_URL` to your backend URL.
- CORS: the backend must list the deployed frontend origin in `CORS_ORIGINS`.
