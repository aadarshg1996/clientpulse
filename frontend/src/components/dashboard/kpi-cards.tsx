import { Sparkles } from "lucide-react"
import { motion } from "motion/react"
import NumberFlow from "@number-flow/react"

import { Skeleton } from "@/components/ui/skeleton"
import { fade, useChartTheme } from "@/lib/chart-theme"
import { EChart } from "./echart"
import type { AccountsResponse, HealthPoint } from "@/lib/api"

function Spark({ points, color }: { points: number[]; color: string }) {
  return (
    <EChart
      height={40}
      option={{
        animation: true,
        animationDuration: 700,
        grid: { left: 0, right: 0, top: 4, bottom: 0 },
        xAxis: { type: "category", show: false, data: points.map((_, i) => i), boundaryGap: false },
        yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
        tooltip: { show: false },
        series: [
          {
            type: "line",
            data: points,
            smooth: true,
            symbol: "none",
            lineStyle: { width: 2, color },
            areaStyle: { color: fade(color, 0.35) },
          },
        ],
      }}
    />
  )
}

interface KpiProps {
  label: string
  value: number
  suffix?: string
  format?: Intl.NumberFormatOptions
  points: number[]
  color: string
  pending?: boolean
  index: number
}

function Kpi({ label, value, suffix, format, points, color, pending, index }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "var(--shadow-lg, 0 18px 44px rgba(16,24,40,.14))" }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.05 }}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="text-[12.5px] font-semibold text-muted-foreground">{label}</div>
      {pending ? (
        <>
          <div className="font-mono text-3xl font-semibold tracking-tight text-muted-foreground/40">—</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Sparkles className="size-3" /> Awaiting analysis
          </div>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
              <NumberFlow value={value} format={format as never} />
            </span>
            {suffix && <span className="text-sm font-semibold text-muted-foreground">{suffix}</span>}
          </div>
          <Spark points={points} color={color} />
        </>
      )}
    </motion.div>
  )
}

export function KpiCards({ data, loading }: { data?: AccountsResponse; loading: boolean }) {
  const theme = useChartTheme()

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>
    )
  }

  const s = data.summary
  const trend = data.health_trend.map((p: HealthPoint) => p.score)
  const noAnalysis = s.average_health == null

  return (
    <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        index={0}
        label="Portfolio Health"
        value={s.average_health != null ? Math.round(s.average_health) : 0}
        suffix="/100"
        points={trend}
        color={theme.primary}
        pending={noAnalysis}
      />
      <Kpi
        index={1}
        label="Accounts at Risk"
        value={s.accounts_at_risk}
        suffix={`of ${s.total_accounts}`}
        points={trend}
        color={theme.status.critical}
        pending={noAnalysis}
      />
      <Kpi
        index={2}
        label="ARR at Risk"
        value={s.arr_at_risk}
        format={{ style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }}
        points={trend}
        color={theme.status.risk}
        pending={noAnalysis}
      />
      <Kpi
        index={3}
        label="Avg SLA Attainment"
        value={s.average_sla != null ? Math.round(s.average_sla) : 0}
        suffix="%"
        points={trend}
        color={theme.status.watch}
      />
    </div>
  )
}
