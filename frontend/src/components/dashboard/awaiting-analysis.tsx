import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

export function AwaitingAnalysis({
  className,
  label = "Awaiting analysis",
  sub = "Run the agent layer to populate this",
  compact,
}: {
  className?: string
  label?: string
  sub?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-muted-foreground",
        compact ? "p-4" : "p-8",
        className,
      )}
    >
      <Sparkles className={compact ? "size-4" : "size-6"} />
      <div className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>{label}</div>
      {!compact && <div className="text-xs text-muted-foreground/70">{sub}</div>}
    </div>
  )
}
