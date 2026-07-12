import type { ReactNode } from "react"

import * as E from "./charts/echarts"
import * as N from "./charts/nivo"
import * as C from "./charts/chartjs"
import * as R from "./charts/recharts"

const PKG_COLOR: Record<string, string> = {
  ECharts: "#c026d3",
  Nivo: "#0ea5e9",
  "Chart.js": "#22c55e",
  Recharts: "#f59e0b",
}

function Panel({ pkg, children }: { pkg: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: "#12161d",
        border: "1px solid #222836",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,.3), 0 18px 44px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: PKG_COLOR[pkg] }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0" }}>{pkg}</span>
      </div>
      {children}
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: "#f1f5f9", letterSpacing: "-0.01em" }}>{title}</h2>
      <p style={{ margin: "4px 0 16px", fontSize: 13.5, color: "#94a3b8" }}>{sub}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>
        {children}
      </div>
    </section>
  )
}

export default function ChartShowcase() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 20% -10%, rgba(99,102,241,0.16), transparent 60%), #090c11",
        color: "#e2e8f0",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        padding: "40px clamp(16px, 5vw, 56px) 80px",
      }}
    >
      <header style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: "#818cf8", textTransform: "uppercase" }}>
          ClientPulse · chart library showcase
        </div>
        <h1 style={{ margin: "8px 0 6px", fontSize: 38, letterSpacing: "-0.02em", color: "#f8fafc" }}>
          Same data, four libraries
        </h1>
        <p style={{ margin: 0, maxWidth: 760, fontSize: 15, color: "#94a3b8", lineHeight: 1.5 }}>
          Each chart type rendered across <b style={{ color: "#e2e8f0" }}>ECharts</b>, <b style={{ color: "#e2e8f0" }}>Nivo</b>,{" "}
          <b style={{ color: "#e2e8f0" }}>Chart.js</b>, and <b style={{ color: "#e2e8f0" }}>Recharts</b> so you can compare look
          and feel. Pick a winner and I&apos;ll refit the dashboard to it.
        </p>
      </header>

      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <Section title="Trend line / area" sub="Portfolio health over 12 months, vs target">
          <Panel pkg="ECharts">
            <E.EChartsArea />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoArea />
          </Panel>
          <Panel pkg="Chart.js">
            <C.ChartjsLine />
          </Panel>
          <Panel pkg="Recharts">
            <R.RechartsArea />
          </Panel>
        </Section>

        <Section title="Donut / pie" sub="Health distribution across accounts">
          <Panel pkg="ECharts">
            <E.EChartsDonut />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoPie />
          </Panel>
          <Panel pkg="Chart.js">
            <C.ChartjsDoughnut />
          </Panel>
          <Panel pkg="Recharts">
            <R.RechartsDonut />
          </Panel>
        </Section>

        <Section title="Bar" sub="SLA attainment, last 6 months">
          <Panel pkg="ECharts">
            <E.EChartsBar />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoBar />
          </Panel>
          <Panel pkg="Chart.js">
            <C.ChartjsBar />
          </Panel>
          <Panel pkg="Recharts">
            <R.RechartsBar />
          </Panel>
        </Section>

        <Section title="Scatter / bubble" sub="Account landscape — health × SLA, size = ARR">
          <Panel pkg="ECharts">
            <E.EChartsScatter />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoScatter />
          </Panel>
          <Panel pkg="Chart.js">
            <C.ChartjsScatter />
          </Panel>
          <Panel pkg="Recharts">
            <R.RechartsScatter />
          </Panel>
        </Section>

        <Section title="Radar" sub="Account profile — two accounts compared">
          <Panel pkg="ECharts">
            <E.EChartsRadar />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoRadar />
          </Panel>
          <Panel pkg="Chart.js">
            <C.ChartjsRadar />
          </Panel>
          <Panel pkg="Recharts">
            <R.RechartsRadar />
          </Panel>
        </Section>

        <Section title="Gauge & heatmap" sub="Extra types ECharts and Nivo do well">
          <Panel pkg="ECharts">
            <E.EChartsGauge />
          </Panel>
          <Panel pkg="ECharts">
            <E.EChartsHeatmap />
          </Panel>
          <Panel pkg="Nivo">
            <N.NivoHeatmap />
          </Panel>
        </Section>
      </div>
    </div>
  )
}
