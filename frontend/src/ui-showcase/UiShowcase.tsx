import { useState } from "react"
import { motion } from "motion/react"
import NumberFlow from "@number-flow/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import ReactECharts from "echarts-for-react"
import { ArrowDownRight, RefreshCw, Shuffle, TrendingUp } from "lucide-react"

const ACCENT = "#6366f1"
const TEXT = "#94a3b8"
const GRID = "rgba(148,163,184,0.16)"

function rnd(n: number, base: number, spread: number) {
  return Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i / 2) * spread + (Math.random() - 0.5) * spread))
}

const GRAN: Record<string, { labels: string[]; data: number[] }> = {
  Daily: { labels: Array.from({ length: 30 }, (_, i) => `D${i + 1}`), data: rnd(30, 62, 8) },
  Weekly: { labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`), data: rnd(12, 60, 10) },
  Monthly: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], data: rnd(12, 58, 12) },
  Quarterly: { labels: ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"], data: rnd(8, 56, 14) },
}

function spark(points: number[], color: string) {
  return {
    animation: true,
    animationDuration: 700,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: "category", show: false, data: points.map((_, i) => i), boundaryGap: false },
    yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
    series: [
      {
        type: "line",
        data: points,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color },
        areaStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + "55" }, { offset: 1, color: color + "00" }] },
        },
      },
    ],
  }
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-[13px] text-muted-foreground">{desc}</p>
      {children}
    </section>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-5 ${className}`}>{children}</div>
}

/* ---- KPI variants ---- */
function KpiStatic({ value, points }: { value: number; points: number[] }) {
  return (
    <Card>
      <div className="text-[12.5px] font-semibold text-muted-foreground">Portfolio Health</div>
      <div className="mt-1 font-mono text-3xl font-semibold">{value}</div>
      <div className="mt-2 h-9">
        <ReactECharts option={spark(points, ACCENT)} style={{ height: 36 }} opts={{ renderer: "svg" }} />
      </div>
    </Card>
  )
}

function KpiMotion({ value, points }: { value: number; points: number[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 18px 44px rgba(16,24,40,.16)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="rounded-2xl border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-muted-foreground">Portfolio Health</span>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-0.5 rounded-md bg-[#fee2e2] px-1.5 py-0.5 text-[11px] font-semibold text-[#dc2f4a]"
        >
          <ArrowDownRight className="size-3" /> 4
        </motion.span>
      </div>
      <div className="mt-1 font-mono text-3xl font-semibold">{value}</div>
      <div className="mt-2 h-9">
        <ReactECharts option={spark(points, ACCENT)} style={{ height: 36 }} opts={{ renderer: "svg" }} />
      </div>
    </motion.div>
  )
}

function KpiNumberFlow({ value, points, color }: { value: number; points: number[]; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="rounded-2xl border bg-card p-5"
    >
      <div className="text-[12.5px] font-semibold text-muted-foreground">Avg SLA Attainment</div>
      <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
        <NumberFlow value={value} />
        <span className="ml-0.5 text-base text-muted-foreground">%</span>
      </div>
      <div className="mt-2 h-9">
        <ReactECharts option={spark(points, color)} style={{ height: 36 }} opts={{ renderer: "svg" }} notMerge />
      </div>
    </motion.div>
  )
}

export function UiShowcase() {
  const [tick, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)
  const v1 = 41 + ((tick * 7) % 23)
  const v2 = 86 + ((tick * 3) % 11)
  const pts = rnd(12, 60, 10)

  const [gran, setGran] = useState("Monthly")
  const g = GRAN[gran]

  const [parent] = useAutoAnimate()
  const [items, setItems] = useState(["Pinnacle Energy", "Vertex Financial", "Atlas Retail", "Meridian Health", "Northwind"])
  const shuffle = () => setItems((xs) => [...xs].sort(() => Math.random() - 0.5))

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="text-2xl font-semibold tracking-tight">UI motion showcase</h1>
        <p className="mb-8 text-muted-foreground">Compare KPI animation, an interactive granularity line, and motion effects. Pick what to wire in.</p>

        <Section title="1 · KPI cards" desc="Hit Refresh — NumberFlow counts, sparklines redraw, Motion cards lift on hover.">
          <button onClick={refresh} className="mb-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] hover:border-primary">
            <RefreshCw className="size-4" /> Refresh values
          </button>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-2 text-[12px] text-muted-foreground">A · Static (current)</div>
              <KpiStatic value={v1} points={pts} />
            </div>
            <div>
              <div className="mb-2 text-[12px] text-muted-foreground">B · Motion (hover + reveal)</div>
              <KpiMotion key={tick} value={v1} points={pts} />
            </div>
            <div>
              <div className="mb-2 text-[12px] text-muted-foreground">C · NumberFlow (counts up)</div>
              <KpiNumberFlow value={v2} points={pts} color="#c77f0a" />
            </div>
          </div>
        </Section>

        <Section title="2 · Interactive trend" desc="Switch granularity — chart animates between ranges. Hover for crosshair; drag the zoom slider.">
          <div className="mb-3 inline-flex gap-1 rounded-xl border bg-secondary p-1">
            {Object.keys(GRAN).map((k) => (
              <button
                key={k}
                onClick={() => setGran(k)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${gran === k ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <Card>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> Portfolio health · {gran}
            </div>
            <ReactECharts
              style={{ height: 300 }}
              opts={{ renderer: "svg" }}
              notMerge={false}
              option={{
                animationDuration: 600,
                animationEasing: "cubicOut",
                grid: { left: 36, right: 16, top: 18, bottom: 56 },
                tooltip: { trigger: "axis", axisPointer: { type: "cross", label: { backgroundColor: ACCENT } } },
                xAxis: { type: "category", boundaryGap: false, data: g.labels, axisLine: { lineStyle: { color: GRID } }, axisLabel: { color: TEXT } },
                yAxis: { type: "value", scale: true, splitLine: { lineStyle: { color: GRID } }, axisLabel: { color: TEXT } },
                dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 12, borderColor: GRID, textStyle: { color: TEXT } }],
                series: [
                  {
                    type: "line",
                    data: g.data,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { width: 3, color: ACCENT },
                    areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: ACCENT + "44" }, { offset: 1, color: ACCENT + "00" }] } },
                    markLine: { silent: true, symbol: "none", lineStyle: { type: "dashed", color: TEXT }, data: [{ yAxis: 80 }] },
                  },
                ],
              }}
            />
          </Card>
        </Section>

        <Section title="3 · Motion effects" desc="Auto-Animate reorders the list smoothly; cards lift with a spring on hover.">
          <button onClick={shuffle} className="mb-3 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[13px] hover:border-primary">
            <Shuffle className="size-4" /> Shuffle
          </button>
          <div ref={parent} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((name) => (
              <motion.div
                key={name}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                  {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <span className="text-[13px] font-medium">{name}</span>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
