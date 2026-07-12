import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartTheme } from "@/lib/chart-theme"
import { STATUS_LABEL, money } from "@/lib/format"
import { EChart } from "./echart"
import { AwaitingAnalysis } from "./awaiting-analysis"
import type { AccountListItem, Status } from "@/lib/api"

const LEGEND: Status[] = ["healthy", "watch", "risk", "critical"]

interface Point {
  value: [number, number, number]
  uid: string
  name: string
  itemStyle: { color: string }
}

export function AccountLandscape({
  accounts,
  onOpen,
}: {
  accounts: AccountListItem[]
  onOpen: (uid: string) => void
}) {
  const t = useChartTheme()

  const data: Point[] = accounts
    .filter((a) => a.health_score != null && a.sla_actual_pct != null && a.health_status)
    .map((a) => ({
      value: [a.health_score as number, a.sla_actual_pct as number, a.arr ?? 0],
      uid: a.account_uid,
      name: a.name,
      itemStyle: { color: t.status[a.health_status as Status] },
    }))

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-[15px]">Account landscape</CardTitle>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Health vs SLA · bubble size = ARR · click to inspect
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {LEGEND.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: t.status[s] }} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <AwaitingAnalysis className="h-[340px]" sub="Health scores come from the agent layer" />
        ) : (
        <EChart
          height={340}
          onEvents={{
            click: (p) => {
              const uid = (p.data as Point | undefined)?.uid
              if (uid) onOpen(uid)
            },
          }}
          option={{
            textStyle: { fontFamily: t.fontFamily },
            grid: { left: 44, right: 18, top: 16, bottom: 40 },
            tooltip: {
              trigger: "item",
              backgroundColor: t.tooltipBg,
              borderColor: t.tooltipBorder,
              textStyle: { color: t.text, fontSize: 12 },
              formatter: (p: { data: Point }) =>
                `<b>${p.data.name}</b><br/>Health ${p.data.value[0]} · SLA ${p.data.value[1]}% · ${money(p.data.value[2])}`,
            },
            xAxis: {
              type: "value",
              name: "Health",
              nameLocation: "middle",
              nameGap: 26,
              min: 30,
              max: 100,
              nameTextStyle: { color: t.text, fontSize: 11 },
              splitLine: { lineStyle: { color: t.grid } },
              axisLine: { lineStyle: { color: t.grid } },
              axisLabel: { color: t.text, fontSize: 11 },
            },
            yAxis: {
              type: "value",
              name: "SLA %",
              min: 70,
              max: 100,
              nameTextStyle: { color: t.text, fontSize: 11 },
              splitLine: { lineStyle: { color: t.grid } },
              axisLine: { lineStyle: { color: t.grid } },
              axisLabel: { color: t.text, fontSize: 11 },
            },
            series: [
              {
                type: "scatter",
                data,
                symbolSize: (v: number[]) => 14 + Math.sqrt(v[2] / 1e6) * 14,
                itemStyle: { opacity: 0.7, borderColor: t.tooltipBg, borderWidth: 1 },
                emphasis: { scale: 1.25, itemStyle: { opacity: 1 } },
                cursor: "pointer",
              },
            ],
          }}
        />
        )}
      </CardContent>
    </Card>
  )
}
