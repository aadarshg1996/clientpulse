import { useState } from "react"
import { Sparkles, X } from "lucide-react"

import { useAccounts } from "@/hooks/use-clientpulse"
import { ChatPanel } from "./chat-panel"

export function AssistantDock({
  selectedUid,
  onClose,
}: {
  selectedUid: string | null
  onClose: () => void
}) {
  const { data } = useAccounts({ limit: 100, sort: "arr", order: "desc" })
  const accounts = data?.accounts ?? []
  const [picked, setPicked] = useState<string | null>(null)

  // follow the account opened from the table; fall back to first account
  const uid = picked ?? selectedUid ?? accounts[0]?.account_uid ?? null

  return (
    <aside className="flex h-screen w-[360px] flex-none flex-col border-l bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-semibold">Assistant</span>
        <button
          onClick={onClose}
          aria-label="Close assistant"
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-b p-3">
        <select
          value={uid ?? ""}
          onChange={(e) => setPicked(e.target.value)}
          className="w-full rounded-xl border bg-secondary px-3 py-2 text-[13px] outline-none focus:border-primary"
        >
          {accounts.length === 0 && <option value="">Loading accounts…</option>}
          {accounts.map((a) => (
            <option key={a.account_uid} value={a.account_uid}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {uid ? (
        <ChatPanel key={uid} uid={uid} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Pick an account to start asking.
        </div>
      )}
    </aside>
  )
}
