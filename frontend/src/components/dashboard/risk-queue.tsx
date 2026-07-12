import { useState } from "react"

import { useRisks } from "@/hooks/use-clientpulse"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { STATUS_LABEL, STATUS_VAR } from "@/lib/format"
import { AwaitingAnalysis } from "./awaiting-analysis"
import { StatusBadge } from "./status-badge"
import type { RiskQueueItem, Status } from "@/lib/api"

const FILTERS: (Status | "all")[] = ["all", "critical", "risk", "watch"]

function ConfRing({ value, color }: { value: number; color: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div className="relative flex size-[62px] flex-none items-center justify-center">
      <svg className="size-[62px] -rotate-90">
        <circle cx="31" cy="31" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="31"
          cy="31"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-sm font-semibold leading-none">{value}</div>
        <div className="text-[8.5px] text-muted-foreground">conf</div>
      </div>
    </div>
  )
}

function RiskCard({ r, onOpen }: { r: RiskQueueItem; onOpen: (uid: string) => void }) {
  const color = STATUS_VAR[r.status]
  return (
    <Card className="flex-row gap-0 overflow-hidden p-0">
      <div className="w-[5px] flex-none" style={{ background: color }} />
      <div className="flex flex-1 items-center gap-5 p-[22px]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[15px] font-bold">{r.name}</span>
            <StatusBadge status={r.status} />
            <span className="text-xs text-muted-foreground">{r.segment}</span>
          </div>
          {r.driver_signal && (
            <div className="mt-2 text-[13.5px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground/70">Signal · </span>
              {r.driver_signal.signal_text}
            </div>
          )}
          {r.recommended_action && (
            <div className="mt-2 flex items-center gap-2">
              <span className="font-bold text-primary">→</span>
              <span className="text-[13.5px] font-semibold">{r.recommended_action.title}</span>
            </div>
          )}
          <div className="mt-1.5 flex gap-3.5 text-xs text-muted-foreground">
            {r.recommended_action?.owner && <span>Owner · {r.recommended_action.owner}</span>}
            {r.recommended_action?.due_label && <span>Due {r.recommended_action.due_label}</span>}
          </div>
        </div>
        <ConfRing value={r.confidence ?? 0} color={color} />
        <Button onClick={() => onOpen(r.account_uid)}>Inspect</Button>
      </div>
    </Card>
  )
}

export function RiskQueue({ onOpen }: { onOpen: (uid: string) => void }) {
  const [filter, setFilter] = useState<Status | "all">("all")
  const { data, isLoading } = useRisks(filter === "all" ? {} : { status: filter as Status })

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[22px]">
      <Card className="flex-row flex-wrap items-center gap-5 p-[22px]">
        <div>
          <div className="font-mono text-3xl font-semibold tracking-tight">
            {data?.summary.total ?? "—"}
          </div>
          <div className="text-[12.5px] text-muted-foreground">open risks across portfolio</div>
        </div>
        <div className="h-10 w-px self-stretch bg-border" />
        <div className="flex gap-3.5">
          {(["critical", "risk", "watch"] as const).map((s) => (
            <div key={s} className="flex flex-col gap-0.5">
              <span className="font-mono text-lg font-semibold" style={{ color: STATUS_VAR[s] }}>
                {data?.summary[s] ?? "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[10px] border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                filter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {f === "all" ? "All" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </Card>

      {isLoading && !data ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[150px] rounded-2xl" />)
      ) : data && data.summary.total === 0 ? (
        <AwaitingAnalysis
          className="py-16"
          label="No risks identified yet"
          sub="Signals and recommended actions are produced by the agent layer"
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {data?.risks.map((r) => (
            <RiskCard key={r.account_uid} r={r} onOpen={onOpen} />
          ))}
          {data && data.risks.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">No risks match this filter.</Card>
          )}
        </div>
      )}
    </div>
  )
}
