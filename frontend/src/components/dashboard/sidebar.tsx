import { Activity, LayoutGrid, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

export type View = "portfolio" | "risk"

const NAV: { key: View; label: string; icon: typeof LayoutGrid }[] = [
  { key: "portfolio", label: "Portfolio", icon: LayoutGrid },
  { key: "risk", label: "Risk queue", icon: TriangleAlert },
]

export function Sidebar({
  view,
  onChange,
  totalAccounts,
}: {
  view: View
  onChange: (v: View) => void
  totalAccounts: number | undefined
}) {
  return (
    <aside className="flex h-screen w-60 flex-none flex-col gap-1.5 border-r bg-card p-4">
      <div className="flex items-center gap-3 px-2 pb-4 pt-1.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Activity className="size-5" strokeWidth={2.4} />
        </div>
        <div>
          <div className="text-base font-bold leading-tight tracking-tight">ClientPulse</div>
          <div className="text-[11px] text-muted-foreground">Account Health Agent</div>
        </div>
      </div>

      <div className="px-2.5 pb-1.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </div>

      {NAV.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
            view === key
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Icon className="size-[18px]" />
          {label}
        </button>
      ))}

      <div className="flex-1" />

      <div className="rounded-2xl border bg-secondary p-3.5">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-healthy" />
          <span className="text-[13px] font-semibold">Agent active</span>
        </div>
        <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Monitoring {totalAccounts ?? "—"} accounts
          <br />
          Last sync 4 min ago
        </div>
      </div>
    </aside>
  )
}
