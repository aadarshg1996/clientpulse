import { ArrowDown, ArrowUp, Search } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  STATUS_LABEL,
  STATUS_VAR,
  avatar,
  money,
} from "@/lib/format"
import { StatusBadge } from "./status-badge"
import type {
  AccountListItem,
  AccountsResponse,
  SortKey,
  Status,
  StatusCounts,
} from "@/lib/api"

const CHIPS: (Status | "all")[] = ["all", "healthy", "watch", "risk", "critical"]
const COLS: { key: SortKey; label: string; className?: string }[] = [
  { key: "arr", label: "ARR" },
  { key: "health", label: "Health" },
  { key: "sla", label: "SLA" },
  { key: "renewal", label: "Renewal" },
]

function slaColor(pct: number | null): string {
  if (pct == null) return "var(--muted-foreground)"
  if (pct < 90) return "var(--critical)"
  if (pct < 95) return "var(--watch)"
  return "var(--foreground)"
}

export function AccountsTable({
  data,
  counts,
  search,
  segment,
  status,
  sort,
  order,
  onSearch,
  onSegment,
  onStatus,
  onSort,
  onPage,
  onOpen,
}: {
  data?: AccountsResponse
  counts?: StatusCounts
  search: string
  segment: string
  status: Status | "all"
  sort: SortKey
  order: "asc" | "desc"
  onSearch: (v: string) => void
  onSegment: (v: string) => void
  onStatus: (v: Status | "all") => void
  onSort: (k: SortKey) => void
  onPage: (dir: -1 | 1) => void
  onOpen: (uid: string) => void
}) {
  const rows = data?.accounts ?? []
  const pg = data?.pagination
  const page = pg ? Math.floor(pg.offset / pg.limit) + 1 : 1
  const pages = pg ? Math.max(1, Math.ceil(pg.total / pg.limit)) : 1

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3.5 p-[22px]">
        <div className="text-[15px] font-semibold">
          Accounts{" "}
          <span className="text-[12.5px] font-medium text-muted-foreground">
            · {pg?.total ?? 0} shown
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search accounts"
              className="w-[190px] pl-8"
            />
          </div>
          <Select value={segment} onValueChange={onSegment}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All segments</SelectItem>
              {(data?.segments ?? []).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-[22px] pb-3.5">
        {CHIPS.map((c) => {
          const active = status === c
          const count = c === "all" ? counts && Object.values(counts).reduce((a, b) => a + b, 0) : counts?.[c]
          return (
            <button
              key={c}
              onClick={() => onStatus(c)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {c === "all" ? "All" : STATUS_LABEL[c]}
              {count != null && <span className="ml-1 opacity-70">· {count}</span>}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[2.2fr_1fr_0.9fr_1.4fr_0.8fr_0.9fr] items-center gap-3.5 border-y bg-secondary px-[22px] py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Account</span>
        <span>Status</span>
        {COLS.map((col) => (
          <button
            key={col.key}
            onClick={() => onSort(col.key)}
            className={cn(
              "flex items-center gap-1 text-left uppercase",
              sort === col.key ? "text-primary" : "hover:text-foreground",
            )}
          >
            {col.label}
            {sort === col.key &&
              (order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
          </button>
        ))}
      </div>

      {rows.map((a: AccountListItem) => (
        <button
          key={a.account_uid}
          onClick={() => onOpen(a.account_uid)}
          className="grid w-full grid-cols-[2.2fr_1fr_0.9fr_1.4fr_0.8fr_0.9fr] items-center gap-3.5 border-b px-[22px] py-3 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-primary/10 font-mono text-xs font-bold text-primary">
              {avatar(a.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{a.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {a.segment} · {a.owner}
              </div>
            </div>
          </div>
          <div>
            {a.health_status ? (
              <StatusBadge status={a.health_status} />
            ) : (
              <span className="text-xs text-muted-foreground/60">Pending</span>
            )}
          </div>
          <div className="font-mono text-[13px] font-semibold">{money(a.arr)}</div>
          <div className="flex items-center gap-2.5">
            {a.health_score != null ? (
              <>
                <Progress
                  value={a.health_score}
                  className="h-1.5"
                  indicatorColor={a.health_status ? STATUS_VAR[a.health_status] : undefined}
                />
                <span className="w-5 font-mono text-[13px] font-semibold">{a.health_score}</span>
              </>
            ) : (
              <span className="font-mono text-[13px] text-muted-foreground/40">—</span>
            )}
          </div>
          <div className="font-mono text-[13px] font-semibold" style={{ color: slaColor(a.sla_actual_pct) }}>
            {a.sla_actual_pct != null ? `${Math.round(a.sla_actual_pct)}%` : "—"}
          </div>
          <div className="font-mono text-[12.5px] font-semibold text-muted-foreground">
            {a.renewal_days != null ? `${a.renewal_days}d` : "—"}
          </div>
        </button>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 p-[22px]">
        <span className="text-[12.5px] text-muted-foreground">
          {pg ? `Showing ${pg.total === 0 ? 0 : pg.offset + 1}–${Math.min(pg.total, pg.offset + pg.limit)} of ${pg.total}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(-1)}>
            ‹ Prev
          </Button>
          <span className="font-mono text-[12.5px] text-muted-foreground">
            Page {page} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(1)}>
            Next ›
          </Button>
        </div>
      </div>
    </Card>
  )
}
