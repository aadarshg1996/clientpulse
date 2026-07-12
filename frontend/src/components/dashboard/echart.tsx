import ReactECharts from "echarts-for-react"

type AnyOption = Record<string, unknown>

export function EChart({
  option,
  height = 260,
  onEvents,
}: {
  option: AnyOption
  height?: number | string
  onEvents?: Record<string, (params: { data?: unknown }) => void>
}) {
  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height, width: "100%" }}
      opts={{ renderer: "svg" }}
      onEvents={onEvents}
    />
  )
}
