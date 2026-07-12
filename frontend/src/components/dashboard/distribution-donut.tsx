import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartTheme } from "@/lib/chart-theme"
import { STATUS_LABEL } from "@/lib/format"
import { EChart } from "./echart"
import { AwaitingAnalysis } from "./awaiting-analysis"
import type { Status, StatusCounts } from "@/lib/api"

const ORDER: Status[] = ["healthy", "watch", "risk", "critical"]

export function DistributionDonut({ counts, total }: { counts: StatusCounts; total: number }) {
  const t = useChartTheme()
  const empty = ORDER.every((s) => counts[s] === 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[15px]">Health distribution</CardTitle>
      </CardHeader>
      <CardContent className={empty ? "" : "flex items-center gap-5"}>
        {empty ? (
          <AwaitingAnalysis className="h-[170px]" sub="Health status comes from the agent layer" />
        ) : (
          <DonutBody t={t} counts={counts} total={total} />
        )}
      </CardContent>
    </Card>
  )
}

function DonutBody({ t, counts, total }: { t: ReturnType<typeof useChartTheme>; counts: StatusCounts; total: number }) {
  const analyzed = ORDER.reduce((sum, s) => sum + counts[s], 0)
  const data = ORDER.map((s) => ({
    name: STATUS_LABEL[s],
    value: counts[s],
    itemStyle: { color: t.status[s] },
  }))
  return (
    <div className="flex items-center gap-5">
        <div className="relative size-[170px] flex-none">
          <EChart
            height={170}
            option={{
              textStyle: { fontFamily: t.fontFamily },
              tooltip: {
                trigger: "item",
                backgroundColor: t.tooltipBg,
                borderColor: t.tooltipBorder,
                textStyle: { color: t.text, fontSize: 12 },
                formatter: "{b}: {c} ({d}%)",
              },
              title: {
                text: String(analyzed),
                subtext: analyzed < total ? `of ${total} analyzed` : "accounts",
                left: "center",
                top: "center",
                textStyle: { color: t.dark ? "#eef1f6" : "#0f1521", fontSize: 26, fontWeight: 600 },
                subtextStyle: { color: t.text, fontSize: 10.5 },
                itemGap: 2,
              },
              series: [
                {
                  type: "pie",
                  radius: ["62%", "86%"],
                  avoidLabelOverlap: true,
                  padAngle: 2,
                  label: { show: false },
                  labelLine: { show: false },
                  itemStyle: { borderRadius: 5 },
                  emphasis: { scale: true, scaleSize: 6 },
                  data,
                },
              ],
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          {ORDER.map((s) => (
            <div key={s} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
                <span className="size-2.5 rounded" style={{ background: t.status[s] }} />
                {STATUS_LABEL[s]}
              </span>
              <span className="font-mono text-[13px] font-semibold">{counts[s]}</span>
            </div>
          ))}
        </div>
    </div>
  )
}
