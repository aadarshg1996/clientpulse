import ReactECharts from "echarts-for-react"

import { COLORS, accounts, distribution, heatmap, quarters, radar, segments, sla, trend } from "../data"

const base = {
  backgroundColor: "transparent",
  textStyle: { color: COLORS.text, fontFamily: "ui-sans-serif, system-ui" },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
}
const axisLine = { lineStyle: { color: COLORS.grid } }
const splitLine = { lineStyle: { color: COLORS.grid } }
const h = 280

function grad(color: string) {
  return {
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: color + "66" },
      { offset: 1, color: color + "00" },
    ],
  }
}

export function EChartsArea() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        tooltip: { trigger: "axis" },
        legend: { data: ["Health", "Target"], textStyle: { color: COLORS.text }, right: 0 },
        xAxis: { type: "category", data: trend.map((t) => t.month), axisLine, axisTick: { show: false } },
        yAxis: { type: "value", min: 50, splitLine, axisLine: { show: false } },
        series: [
          {
            name: "Health",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            data: trend.map((t) => t.score),
            lineStyle: { width: 3, color: COLORS.primary },
            itemStyle: { color: COLORS.primary },
            areaStyle: { color: grad(COLORS.primary) },
          },
          {
            name: "Target",
            type: "line",
            data: trend.map((t) => t.target),
            lineStyle: { type: "dashed", color: COLORS.text, width: 1.5 },
            symbol: "none",
          },
        ],
      }}
    />
  )
}

export function EChartsDonut() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: COLORS.text } },
        series: [
          {
            type: "pie",
            radius: ["52%", "76%"],
            avoidLabelOverlap: true,
            padAngle: 2,
            itemStyle: { borderRadius: 6 },
            label: { show: true, formatter: "{b}\n{c}", color: COLORS.text },
            data: distribution.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
          },
        ],
      }}
    />
  )
}

export function EChartsScatter() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        tooltip: {
          trigger: "item",
          formatter: (p: { data: [number, number, number, string] }) =>
            `${p.data[3]}<br/>Health ${p.data[0]} · SLA ${p.data[1]}% · $${p.data[2]}M`,
        },
        xAxis: { type: "value", name: "Health", min: 30, max: 100, splitLine, axisLine },
        yAxis: { type: "value", name: "SLA %", min: 70, max: 100, splitLine, axisLine },
        series: [
          {
            type: "scatter",
            symbolSize: (d: number[]) => 14 + Math.sqrt(d[2]) * 16,
            data: accounts.map((a) => ({
              value: [a.health, a.sla, a.arr, a.name],
              itemStyle: { color: a.status === "critical" ? COLORS.critical : a.status === "risk" ? COLORS.risk : a.status === "watch" ? COLORS.watch : COLORS.healthy, opacity: 0.7 },
            })),
          },
        ],
      }}
    />
  )
}

export function EChartsBar() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        tooltip: { trigger: "axis" },
        legend: { right: 0, textStyle: { color: COLORS.text } },
        xAxis: { type: "category", data: sla.map((s) => s.month), axisLine, axisTick: { show: false } },
        yAxis: { type: "value", min: 60, splitLine, axisLine: { show: false } },
        series: [
          {
            name: "Actual",
            type: "bar",
            data: sla.map((s) => s.actual),
            itemStyle: { borderRadius: [6, 6, 0, 0], color: grad(COLORS.primary) },
            barWidth: "42%",
          },
          {
            name: "Target",
            type: "line",
            data: sla.map((s) => s.target),
            lineStyle: { type: "dashed", color: COLORS.watch },
            symbol: "none",
          },
        ],
      }}
    />
  )
}

export function EChartsRadar() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        tooltip: {},
        legend: { bottom: 0, data: ["Meridian", "Pinnacle"], textStyle: { color: COLORS.text } },
        radar: {
          indicator: radar.map((r) => ({ name: r.axis, max: 100 })),
          axisName: { color: COLORS.text },
          splitLine: { lineStyle: { color: COLORS.grid } },
          splitArea: { show: false },
          axisLine: { lineStyle: { color: COLORS.grid } },
        },
        series: [
          {
            type: "radar",
            data: [
              { value: radar.map((r) => r.a), name: "Meridian", itemStyle: { color: COLORS.healthy }, areaStyle: { opacity: 0.2 } },
              { value: radar.map((r) => r.b), name: "Pinnacle", itemStyle: { color: COLORS.critical }, areaStyle: { opacity: 0.2 } },
            ],
          },
        ],
      }}
    />
  )
}

export function EChartsGauge() {
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        series: [
          {
            type: "gauge",
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            progress: { show: true, width: 16, itemStyle: { color: COLORS.primary } },
            axisLine: { lineStyle: { width: 16, color: [[1, COLORS.grid]] } },
            axisTick: { show: false },
            splitLine: { length: 10, lineStyle: { color: COLORS.grid } },
            axisLabel: { color: COLORS.text, distance: 22, fontSize: 10 },
            pointer: { itemStyle: { color: COLORS.primary } },
            detail: { valueAnimation: true, formatter: "{value}", color: "#e2e8f0", fontSize: 30, offsetCenter: [0, "30%"] },
            title: { color: COLORS.text, offsetCenter: [0, "62%"], fontSize: 12 },
            data: [{ value: 58, name: "Portfolio Health" }],
          },
        ],
      }}
    />
  )
}

export function EChartsHeatmap() {
  const data: [number, number, number][] = []
  heatmap.forEach((row, yi) => row.data.forEach((cell, xi) => data.push([xi, yi, cell.y])))
  return (
    <ReactECharts
      style={{ height: h }}
      option={{
        ...base,
        grid: { left: 60, right: 16, top: 16, bottom: 60 },
        tooltip: { position: "top" },
        xAxis: { type: "category", data: quarters, splitArea: { show: true }, axisLine },
        yAxis: { type: "category", data: segments, splitArea: { show: true }, axisLine },
        visualMap: {
          min: 70,
          max: 100,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: 8,
          inRange: { color: [COLORS.critical, COLORS.watch, COLORS.healthy] },
          textStyle: { color: COLORS.text },
        },
        series: [
          {
            type: "heatmap",
            data,
            label: { show: true, color: "#0b1220" },
            itemStyle: { borderRadius: 4, borderColor: "transparent" },
          },
        ],
      }}
    />
  )
}
