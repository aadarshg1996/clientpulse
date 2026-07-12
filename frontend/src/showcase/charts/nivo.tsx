import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"
import { ResponsiveBar } from "@nivo/bar"
import { ResponsiveScatterPlot } from "@nivo/scatterplot"
import { ResponsiveRadar } from "@nivo/radar"
import { ResponsiveHeatMap } from "@nivo/heatmap"

import { COLORS, accounts, distribution, heatmap, radar, sla, trend } from "../data"

const h = 280
const theme = {
  text: { fill: COLORS.text },
  axis: {
    ticks: { text: { fill: COLORS.text }, line: { stroke: COLORS.grid } },
    domain: { line: { stroke: COLORS.grid } },
  },
  grid: { line: { stroke: COLORS.grid } },
  tooltip: { container: { background: "#1a1f29", color: "#e2e8f0", fontSize: 12 } },
  legends: { text: { fill: COLORS.text } },
}

export function NivoArea() {
  return (
    <div style={{ height: h }}>
      <ResponsiveLine
        data={[{ id: "Health", data: trend.map((t) => ({ x: t.month, y: t.score })) }]}
        theme={theme}
        margin={{ top: 16, right: 20, bottom: 36, left: 40 }}
        yScale={{ type: "linear", min: 50, max: 90 }}
        curve="monotoneX"
        colors={[COLORS.primary]}
        lineWidth={3}
        enableArea
        areaOpacity={0.18}
        enablePoints
        pointSize={8}
        pointColor={COLORS.primary}
        enableGridX={false}
        useMesh
      />
    </div>
  )
}

export function NivoPie() {
  return (
    <div style={{ height: h }}>
      <ResponsivePie
        data={distribution.map((d) => ({ id: d.name, value: d.value, color: d.color }))}
        theme={theme}
        colors={{ datum: "data.color" }}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={1.5}
        cornerRadius={5}
        activeOuterRadiusOffset={8}
        borderWidth={0}
        arcLinkLabelsColor={{ from: "color" }}
        arcLinkLabelsTextColor={COLORS.text}
        arcLabelsTextColor="#0b1220"
      />
    </div>
  )
}

export function NivoBar() {
  return (
    <div style={{ height: h }}>
      <ResponsiveBar
        data={sla.map((s) => ({ month: s.month, actual: s.actual }))}
        keys={["actual"]}
        indexBy="month"
        theme={theme}
        margin={{ top: 16, right: 16, bottom: 36, left: 40 }}
        padding={0.45}
        colors={[COLORS.primary]}
        borderRadius={6}
        enableLabel={false}
        enableGridX={false}
      />
    </div>
  )
}

export function NivoScatter() {
  const groups = ["critical", "risk", "watch", "healthy"] as const
  return (
    <div style={{ height: h }}>
      <ResponsiveScatterPlot
        data={groups.map((g) => ({
          id: g,
          data: accounts.filter((a) => a.status === g).map((a) => ({ x: a.health, y: a.sla })),
        }))}
        theme={theme}
        margin={{ top: 16, right: 20, bottom: 40, left: 44 }}
        xScale={{ type: "linear", min: 30, max: 100 }}
        yScale={{ type: "linear", min: 70, max: 100 }}
        colors={[COLORS.critical, COLORS.risk, COLORS.watch, COLORS.healthy]}
        nodeSize={14}
        axisBottom={{ legend: "Health", legendOffset: 32, legendPosition: "middle" }}
        axisLeft={{ legend: "SLA %", legendOffset: -36, legendPosition: "middle" }}
      />
    </div>
  )
}

export function NivoRadar() {
  return (
    <div style={{ height: h }}>
      <ResponsiveRadar
        data={radar}
        keys={["a", "b"]}
        indexBy="axis"
        theme={theme}
        maxValue={100}
        margin={{ top: 30, right: 50, bottom: 30, left: 50 }}
        colors={[COLORS.healthy, COLORS.critical]}
        fillOpacity={0.2}
        borderWidth={2}
        gridLabelOffset={12}
        dotSize={6}
      />
    </div>
  )
}

export function NivoHeatmap() {
  return (
    <div style={{ height: h }}>
      <ResponsiveHeatMap
        data={heatmap.map((r) => ({ id: r.segment, data: r.data }))}
        theme={theme}
        margin={{ top: 20, right: 20, bottom: 36, left: 70 }}
        valueFormat=">-.0f"
        colors={{ type: "sequential", scheme: "yellow_green_blue", minValue: 70, maxValue: 100 }}
        borderRadius={4}
        labelTextColor="#0b1220"
        emptyColor="#1a1f29"
      />
    </div>
  )
}
