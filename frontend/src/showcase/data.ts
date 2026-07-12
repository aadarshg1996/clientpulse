// Static sample data (ClientPulse-flavored) so the showcase renders standalone.

export const COLORS = {
  primary: "#6366f1",
  healthy: "#10b981",
  watch: "#f59e0b",
  risk: "#f97316",
  critical: "#ef4444",
  grid: "rgba(148,163,184,0.18)",
  text: "#94a3b8",
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Portfolio health trend (12 months, vs target 80)
export const trend = MONTHS.map((m, i) => ({
  month: m,
  score: Math.round(66 + Math.sin(i / 2) * 6 - i * 0.6),
  target: 80,
}))

// Health distribution
export const distribution = [
  { name: "Healthy", value: 3, color: COLORS.healthy },
  { name: "Watch", value: 7, color: COLORS.watch },
  { name: "At Risk", value: 8, color: COLORS.risk },
  { name: "Critical", value: 12, color: COLORS.critical },
]

// Accounts for scatter / bubble (health x sla, size = arr)
export type Acct = { name: string; health: number; sla: number; arr: number; status: keyof typeof STATUS_COLOR }
export const STATUS_COLOR = {
  healthy: COLORS.healthy,
  watch: COLORS.watch,
  risk: COLORS.risk,
  critical: COLORS.critical,
}
export const accounts: Acct[] = [
  { name: "Pinnacle Energy", health: 38, sla: 76, arr: 1.9, status: "critical" },
  { name: "Solstice Media", health: 47, sla: 81, arr: 0.4, status: "critical" },
  { name: "Cobalt Mfg", health: 54, sla: 88, arr: 0.6, status: "risk" },
  { name: "Vertex Financial", health: 68, sla: 95, arr: 3.4, status: "watch" },
  { name: "Atlas Retail", health: 72, sla: 92, arr: 2.1, status: "watch" },
  { name: "Harbor & Co", health: 79, sla: 96, arr: 0.72, status: "watch" },
  { name: "Meridian Health", health: 84, sla: 97, arr: 0.88, status: "healthy" },
  { name: "Northwind", health: 91, sla: 99, arr: 1.2, status: "healthy" },
  { name: "Orchid Pharma", health: 58, sla: 86, arr: 1.5, status: "risk" },
  { name: "Lumen Telecom", health: 76, sla: 94, arr: 2.8, status: "watch" },
  { name: "Falcon Travel", health: 44, sla: 79, arr: 0.54, status: "critical" },
  { name: "Apex Auto", health: 66, sla: 91, arr: 2.4, status: "watch" },
]

// SLA bars (target vs actual, 6 months)
export const sla = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({
  month: m,
  target: 95,
  actual: [82, 79, 84, 88, 86, 90][i],
}))

// Radar — account profile
export const radarAxes = ["SLA", "Health", "Sentiment", "Adoption", "Engagement"]
export const radar = [
  { axis: "SLA", a: 88, b: 72 },
  { axis: "Health", a: 84, b: 54 },
  { axis: "Sentiment", a: 90, b: 45 },
  { axis: "Adoption", a: 78, b: 60 },
  { axis: "Engagement", a: 82, b: 50 },
]

// Heatmap — SLA attainment by segment x quarter
export const segments = ["Energy", "Media", "Finance", "Retail", "Health"]
export const quarters = ["Q1", "Q2", "Q3", "Q4"]
export const heatmap = segments.map((s) => ({
  segment: s,
  data: quarters.map((q) => ({ x: q, y: Math.round(70 + Math.random() * 28) })),
}))
