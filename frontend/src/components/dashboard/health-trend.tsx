import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fade, useChartTheme } from "@/lib/chart-theme"
import { EChart } from "./echart"
import { AwaitingAnalysis } from "./awaiting-analysis"
import type { HealthPoint } from "@/lib/api"

type Gran = "Weekly" | "Monthly" | "Quarterly"
const GRANS: Gran[] = ["Weekly", "Monthly", "Quarterly"]

function bucket(points: HealthPoint[], gran: Gran): { label: string; value: number }[] {
  if (gran === "Weekly") {
    return points.map((p) => ({
      label: new Date(p.snapshot_dt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: p.score,
    }))
  }
  const groups = new Map<string, { sum: number; n: number; label: string }>()
  for (const p of points) {
    const d = new Date(p.snapshot_dt)
    const key =
      gran === "Monthly"
        ? `${d.getFullYear()}-${d.getMonth()}`
        : `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
    const label =
      gran === "Monthly"
        ? d.toLocaleDateString(undefined, { month: "short" })
        : `Q${Math.floor(d.getMonth() / 3) + 1}`
    const g = groups.get(key) ?? { sum: 0, n: 0, label }
    g.sum += p.score
    g.n += 1
    groups.set(key, g)
  }
  return [...groups.values()].map((g) => ({ label: g.label, value: Math.round(g.sum / g.n) }))
}

export function HealthTrend({ points }: { points: HealthPoint[] }) {
  const t = useChartTheme()
  const [gran, setGran] = useState<Gran>("Weekly")
  const empty = points.length < 2
  const series = bucket(points, gran)

  return (
    <Card className="gap-3.5">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-[15px]">Portfolio health trend</CardTitle>
          <p className="text-[12.5px] text-muted-foreground">Weighted average · target 80</p>
        </div>
        {!empty && (
          <div className="inline-flex gap-1 rounded-xl border bg-secondary p-1">
            {GRANS.map((k) => (
              <button
                key={k}
                onClick={() => setGran(k)}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  gran === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <AwaitingAnalysis className="h-[236px]" label="Trend builds over time" sub="History accrues as accounts are re-analyzed" />
        ) : (
          <EChart
            height={236}
            option={{
              animationDuration: 600,
              animationEasing: "cubicOut",
              grid: { left: 36, right: 14, top: 16, bottom: 26 },
              textStyle: { fontFamily: t.fontFamily },
              tooltip: {
                trigger: "axis",
                axisPointer: { type: "cross", label: { backgroundColor: t.primary } },
                backgroundColor: t.tooltipBg,
                borderColor: t.tooltipBorder,
                textStyle: { color: t.text, fontSize: 12 },
              },
              xAxis: {
                type: "category",
                data: series.map((d) => d.label),
                boundaryGap: false,
                axisLine: { lineStyle: { color: t.grid } },
                axisTick: { show: false },
                axisLabel: { color: t.text, fontSize: 11 },
              },
              yAxis: {
                type: "value",
                scale: true,
                splitLine: { lineStyle: { color: t.grid } },
                axisLabel: { color: t.text, fontSize: 11 },
              },
              series: [
                {
                  type: "line",
                  data: series.map((d) => d.value),
                  smooth: true,
                  symbol: "circle",
                  symbolSize: 7,
                  showSymbol: false,
                  lineStyle: { width: 3, color: t.primary },
                  itemStyle: { color: t.primary },
                  areaStyle: { color: fade(t.primary, 0.3) },
                  markLine: {
                    silent: true,
                    symbol: "none",
                    lineStyle: { type: "dashed", color: t.text, opacity: 0.6 },
                    data: [{ yAxis: 80 }],
                    label: { show: true, formatter: "Target", color: t.text, fontSize: 10, position: "insideEndTop" },
                  },
                },
              ],
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
