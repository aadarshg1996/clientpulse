import type { Status } from "@/lib/api"

export function money(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1e6) {
    const m = n / 1e6
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`
  return `$${Math.round(n)}`
}

export function avatar(name: string): string {
  return name
    .replace("& ", "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export const STATUS_LABEL: Record<Status, string> = {
  healthy: "Healthy",
  watch: "Watch",
  risk: "At Risk",
  critical: "Critical",
}

// Tailwind classes backed by the domain tokens in index.css.
export const STATUS_TEXT: Record<Status, string> = {
  healthy: "text-healthy",
  watch: "text-watch",
  risk: "text-risk",
  critical: "text-critical",
}

export const STATUS_BG: Record<Status, string> = {
  healthy: "bg-healthy-soft text-healthy",
  watch: "bg-watch-soft text-watch",
  risk: "bg-risk-soft text-risk",
  critical: "bg-critical-soft text-critical",
}

export const STATUS_DOT: Record<Status, string> = {
  healthy: "bg-healthy",
  watch: "bg-watch",
  risk: "bg-risk",
  critical: "bg-critical",
}

export const STATUS_VAR: Record<Status, string> = {
  healthy: "var(--healthy)",
  watch: "var(--watch)",
  risk: "var(--risk)",
  critical: "var(--critical)",
}

export function statusFromScore(score: number): Status {
  if (score >= 80) return "healthy"
  if (score >= 65) return "watch"
  if (score >= 50) return "risk"
  return "critical"
}

export function fdate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short" })
}
