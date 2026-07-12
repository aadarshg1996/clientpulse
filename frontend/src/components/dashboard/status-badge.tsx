import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_BG, STATUS_LABEL } from "@/lib/format"
import type { Status } from "@/lib/api"

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-semibold", STATUS_BG[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
