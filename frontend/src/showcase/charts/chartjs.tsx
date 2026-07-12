import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Doughnut, Radar, Scatter } from "react-chartjs-2"

import { COLORS, accounts, distribution, radar, sla, trend } from "../data"

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
)
Chart.defaults.color = COLORS.text
Chart.defaults.borderColor = COLORS.grid
Chart.defaults.font.family = "ui-sans-serif, system-ui"

const wrap = { height: 280 } as const
const baseOpts = { responsive: true, maintainAspectRatio: false }

export function ChartjsLine() {
  return (
    <div style={wrap}>
      <Line
        options={{ ...baseOpts, scales: { y: { min: 50 } } }}
        data={{
          labels: trend.map((t) => t.month),
          datasets: [
            {
              label: "Health",
              data: trend.map((t) => t.score),
              borderColor: COLORS.primary,
              backgroundColor: COLORS.primary + "22",
              fill: true,
              tension: 0.4,
              pointRadius: 3,
            },
            {
              label: "Target",
              data: trend.map((t) => t.target),
              borderColor: COLORS.text,
              borderDash: [6, 6],
              pointRadius: 0,
            },
          ],
        }}
      />
    </div>
  )
}

export function ChartjsBar() {
  return (
    <div style={wrap}>
      <Bar
        options={{ ...baseOpts, scales: { y: { min: 60 } } }}
        data={{
          labels: sla.map((s) => s.month),
          datasets: [
            { label: "Actual", data: sla.map((s) => s.actual), backgroundColor: COLORS.primary, borderRadius: 6 },
          ],
        }}
      />
    </div>
  )
}

export function ChartjsDoughnut() {
  return (
    <div style={wrap}>
      <Doughnut
        options={{ ...baseOpts, cutout: "62%", plugins: { legend: { position: "bottom" } } }}
        data={{
          labels: distribution.map((d) => d.name),
          datasets: [{ data: distribution.map((d) => d.value), backgroundColor: distribution.map((d) => d.color), borderWidth: 0 }],
        }}
      />
    </div>
  )
}

export function ChartjsRadar() {
  return (
    <div style={wrap}>
      <Radar
        options={{ ...baseOpts, scales: { r: { min: 0, max: 100, grid: { color: COLORS.grid }, angleLines: { color: COLORS.grid }, pointLabels: { color: COLORS.text } } } }}
        data={{
          labels: radar.map((r) => r.axis),
          datasets: [
            { label: "Meridian", data: radar.map((r) => r.a), borderColor: COLORS.healthy, backgroundColor: COLORS.healthy + "33" },
            { label: "Pinnacle", data: radar.map((r) => r.b), borderColor: COLORS.critical, backgroundColor: COLORS.critical + "33" },
          ],
        }}
      />
    </div>
  )
}

export function ChartjsScatter() {
  const byStatus = ["critical", "risk", "watch", "healthy"] as const
  return (
    <div style={wrap}>
      <Scatter
        options={{ ...baseOpts, scales: { x: { min: 30, max: 100, title: { display: true, text: "Health" } }, y: { min: 70, max: 100, title: { display: true, text: "SLA %" } } } }}
        data={{
          datasets: byStatus.map((g) => ({
            label: g,
            data: accounts.filter((a) => a.status === g).map((a) => ({ x: a.health, y: a.sla })),
            backgroundColor:
              g === "critical" ? COLORS.critical : g === "risk" ? COLORS.risk : g === "watch" ? COLORS.watch : COLORS.healthy,
            pointRadius: 7,
          })),
        }}
      />
    </div>
  )
}
