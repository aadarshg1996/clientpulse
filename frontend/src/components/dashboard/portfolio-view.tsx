import { useState } from "react"

import { useAccounts } from "@/hooks/use-clientpulse"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCards } from "./kpi-cards"
import { HealthTrend } from "./health-trend"
import { DistributionDonut } from "./distribution-donut"
import { AccountLandscape } from "./account-landscape"
import { AccountsTable } from "./accounts-table"
import type { SortKey, Status } from "@/lib/api"

const PER = 8

export function PortfolioView({ onOpen }: { onOpen: (uid: string) => void }) {
  // overview = all accounts (KPIs, donut, trend, bubble) — independent of table filters
  const overview = useAccounts({ limit: 100, sort: "health", order: "asc" })

  // table = filtered/sorted/paginated view
  const [search, setSearch] = useState("")
  const [segment, setSegment] = useState("all")
  const [status, setStatus] = useState<Status | "all">("all")
  const [sort, setSort] = useState<SortKey>("arr")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(0)

  const table = useAccounts({
    search: search || undefined,
    segment: segment === "all" ? undefined : segment,
    status: status === "all" ? undefined : status,
    sort,
    order,
    limit: PER,
    offset: page * PER,
  })

  const resetPage = () => setPage(0)

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-[22px]">
      <KpiCards data={overview.data} loading={overview.isLoading} />

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1.62fr_1fr]">
        {overview.data ? (
          <HealthTrend points={overview.data.health_trend} />
        ) : (
          <Skeleton className="h-[320px] rounded-2xl" />
        )}
        {overview.data ? (
          <DistributionDonut
            counts={overview.data.summary.status_counts}
            total={overview.data.summary.total_accounts}
          />
        ) : (
          <Skeleton className="h-[320px] rounded-2xl" />
        )}
      </div>

      {overview.data ? (
        <AccountLandscape accounts={overview.data.accounts} onOpen={onOpen} />
      ) : (
        <Skeleton className="h-[420px] rounded-2xl" />
      )}

      <AccountsTable
        data={table.data}
        counts={overview.data?.summary.status_counts}
        search={search}
        segment={segment}
        status={status}
        sort={sort}
        order={order}
        onSearch={(v) => {
          setSearch(v)
          resetPage()
        }}
        onSegment={(v) => {
          setSegment(v)
          resetPage()
        }}
        onStatus={(v) => {
          setStatus(v)
          resetPage()
        }}
        onSort={(k) => {
          if (k === sort) setOrder((o) => (o === "asc" ? "desc" : "asc"))
          else {
            setSort(k)
            setOrder("asc")
          }
          resetPage()
        }}
        onPage={(dir) => setPage((p) => Math.max(0, p + dir))}
        onOpen={onOpen}
      />
    </div>
  )
}
