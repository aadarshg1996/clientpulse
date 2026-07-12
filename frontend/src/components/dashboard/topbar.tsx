import { Moon, Sparkles, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Topbar({
  title,
  subtitle,
  isDark,
  onToggleTheme,
  onToggleAssistant,
  assistantOpen,
}: {
  title: string
  subtitle: string
  isDark: boolean
  onToggleTheme: () => void
  onToggleAssistant: () => void
  assistantOpen: boolean
}) {
  return (
    <header className="flex h-[66px] flex-none items-center gap-4 border-b bg-card px-6">
      <div className="min-w-0">
        <div className="text-[17px] font-semibold leading-tight tracking-tight">{title}</div>
        <div className="text-[12.5px] text-muted-foreground">{subtitle}</div>
      </div>
      <div className="flex-1" />
      <Button
        variant={assistantOpen ? "default" : "outline"}
        size="sm"
        onClick={onToggleAssistant}
        aria-label="Toggle assistant"
      >
        <Sparkles className="size-4" /> Assistant
      </Button>
      <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
        {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </Button>
    </header>
  )
}
