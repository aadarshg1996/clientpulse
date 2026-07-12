import { useIsDark } from "@/hooks/use-is-dark"
import type { Status } from "@/lib/api"

const STATUS_LIGHT: Record<Status, string> = {
  healthy: "#0e9f6e",
  watch: "#c77f0a",
  risk: "#e2590c",
  critical: "#dc2f4a",
}
const STATUS_DARK: Record<Status, string> = {
  healthy: "#34d399",
  watch: "#fbbf24",
  risk: "#fb923c",
  critical: "#fb7185",
}

export interface ChartTheme {
  dark: boolean
  text: string
  grid: string
  primary: string
  primarySoft: string
  tooltipBg: string
  tooltipBorder: string
  status: Record<Status, string>
  fontFamily: string
}

export function useChartTheme(): ChartTheme {
  const dark = useIsDark()
  return {
    dark,
    text: dark ? "#9aa5b6" : "#5a6577",
    grid: dark ? "rgba(148,163,184,0.16)" : "rgba(15,21,33,0.08)",
    primary: dark ? "#818cf8" : "#6366f1",
    primarySoft: dark ? "rgba(129,140,248,0.20)" : "rgba(99,102,241,0.18)",
    tooltipBg: dark ? "#1a1f29" : "#ffffff",
    tooltipBorder: dark ? "#222836" : "#e5e7ee",
    status: dark ? STATUS_DARK : STATUS_LIGHT,
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  }
}

/** Vertical fade gradient for area/bar fills. */
export function fade(color: string, top = 0.4) {
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: color + Math.round(top * 255).toString(16).padStart(2, "0") },
      { offset: 1, color: color + "00" },
    ],
  }
}
