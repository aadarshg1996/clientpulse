import { useState } from "react"

import { useTheme } from "@/hooks/use-theme"
import { useAccounts } from "@/hooks/use-clientpulse"
import { Sidebar, type View } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { PortfolioView } from "@/components/dashboard/portfolio-view"
import { RiskQueue } from "@/components/dashboard/risk-queue"
import { AccountDrawer } from "@/components/dashboard/account-drawer"
import { AssistantDock } from "@/components/dashboard/assistant-dock"

const TITLES: Record<View, { title: string; subtitle: string }> = {
  portfolio: { title: "Portfolio overview", subtitle: "Health across all client accounts" },
  risk: { title: "Risk & action queue", subtitle: "What needs attention right now" },
}

function App() {
  const { isDark, toggle } = useTheme()
  const [view, setView] = useState<View>("portfolio")
  const [selected, setSelected] = useState<string | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const overview = useAccounts({ limit: 1 })
  const total = overview.data?.summary.total_accounts

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar view={view} onChange={setView} totalAccounts={total} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={TITLES[view].title}
          subtitle={TITLES[view].subtitle}
          isDark={isDark}
          onToggleTheme={toggle}
          onToggleAssistant={() => setAssistantOpen((o) => !o)}
          assistantOpen={assistantOpen}
        />
        <div className="flex-1 overflow-y-auto p-6">
          {view === "portfolio" ? (
            <PortfolioView onOpen={setSelected} />
          ) : (
            <RiskQueue onOpen={setSelected} />
          )}
        </div>
      </div>

      {assistantOpen && (
        <AssistantDock selectedUid={selected} onClose={() => setAssistantOpen(false)} />
      )}

      <AccountDrawer uid={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default App
