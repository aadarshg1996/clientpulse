import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import { COLORS, accounts, distribution, radar, sla, trend } from "../data"

const h = 280
const tip = {
  contentStyle: { background: "#1a1f29", border: "none", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "#e2e8f0" },
}

export function RechartsArea() {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="rc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <YAxis domain={[50, 90]} tickLine={false} axisLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <ReferenceLine y={80} stroke={COLORS.text} strokeDasharray="6 6" />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="score" stroke={COLORS.primary} strokeWidth={3} fill="url(#rc-area)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RechartsDonut() {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <PieChart>
        <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} cornerRadius={5}>
          {distribution.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Legend />
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function RechartsBar() {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={sla} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <YAxis domain={[60, 100]} tickLine={false} axisLine={false} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <Tooltip {...tip} />
        <Bar dataKey="actual" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RechartsScatter() {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
        <CartesianGrid stroke={COLORS.grid} />
        <XAxis type="number" dataKey="health" name="Health" domain={[30, 100]} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <YAxis type="number" dataKey="sla" name="SLA" domain={[70, 100]} tick={{ fill: COLORS.text, fontSize: 11 }} />
        <ZAxis type="number" dataKey="arr" range={[60, 600]} />
        <Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={accounts}>
          {accounts.map((a) => (
            <Cell
              key={a.name}
              fill={a.status === "critical" ? COLORS.critical : a.status === "risk" ? COLORS.risk : a.status === "watch" ? COLORS.watch : COLORS.healthy}
              fillOpacity={0.7}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function RechartsRadar() {
  const data = radar.map((r) => ({ axis: r.axis, Meridian: r.a, Pinnacle: r.b }))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <RadarChart data={data} outerRadius={95}>
        <PolarGrid stroke={COLORS.grid} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: COLORS.text, fontSize: 11 }} />
        <Radar name="Meridian" dataKey="Meridian" stroke={COLORS.healthy} fill={COLORS.healthy} fillOpacity={0.2} />
        <Radar name="Pinnacle" dataKey="Pinnacle" stroke={COLORS.critical} fill={COLORS.critical} fillOpacity={0.2} />
        <Legend />
        <Tooltip {...tip} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
