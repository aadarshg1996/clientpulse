import { Bot, FileText, Send, Sparkles, User } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Turn {
  role: "user" | "assistant"
  text: string
  sources?: string[]
}

const CONVO: Turn[] = [
  { role: "user", text: "Why is this account at risk?" },
  {
    role: "assistant",
    text: "Renewal is 99 days away and SLA attainment has breached the 95% target for six consecutive months. Per the MSA, sustained breach entitles the client to service credits.",
    sources: ["sla_schedule.pdf", "contract_msa.pdf · §7.2"],
  },
  { role: "user", text: "What should I do first?" },
  {
    role: "assistant",
    text: "Draft an SLA remediation plan with the delivery lead and open renewal talks — both are High priority and due within the week.",
    sources: ["weekly_status.docx"],
  },
]

const SUGGESTIONS = ["Why is this account at risk?", "What's the renewal exposure?", "Summarize the SLA situation."]

function SourceChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
      <FileText className="size-3" /> {name}
    </span>
  )
}

function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="mb-1 text-sm font-semibold">{title}</div>
      <div className="mb-3 text-[12.5px] text-muted-foreground">{desc}</div>
      <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border bg-card">{children}</div>
    </div>
  )
}

function MockInput({ rounded = "xl" }: { rounded?: "xl" | "full" }) {
  return (
    <form className="flex items-center gap-2 border-t p-3" onSubmit={(e) => e.preventDefault()}>
      <input
        placeholder="Ask about this account…"
        className={`min-w-0 flex-1 border bg-secondary px-3 py-2 text-[13px] outline-none focus:border-primary ${rounded === "full" ? "rounded-full" : "rounded-xl"}`}
      />
      <Button type="submit" size="icon" className={rounded === "full" ? "rounded-full" : ""}>
        <Send className="size-4" />
      </Button>
    </form>
  )
}

/* A — Minimal bubbles (current) */
function VariantMinimal() {
  return (
    <Panel title="A · Minimal bubbles (current)" desc="What's live now. Light, compact, no source UI.">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {CONVO.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[13px] text-primary-foreground"
                  : "max-w-[92%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-[13px] leading-snug"
              }
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <MockInput />
    </Panel>
  )
}

/* B — AI Elements style: full-width assistant, Sources row, suggestion pills */
function VariantAIElements() {
  return (
    <Panel title="B · AI Elements style (recommended)" desc="Sources/citations under each answer + suggestion pills. Best fit for grounded chat.">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {CONVO.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl bg-primary px-3.5 py-2 text-[13px] text-primary-foreground">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Assistant
              </div>
              <div className="text-[13px] leading-relaxed">{m.text}</div>
              {m.sources && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Sources</span>
                  {m.sources.map((s) => (
                    <SourceChip key={s} name={s} />
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      </div>
      <MockInput />
    </Panel>
  )
}

/* C — Card rows with avatars + role labels */
function VariantCards() {
  return (
    <Panel title="C · Cards with avatars" desc="Each turn a bordered card with avatar + role. Heavier, very legible.">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {CONVO.map((m, i) => (
          <div key={i} className="flex gap-3 rounded-xl border bg-background p-3">
            <span
              className={`flex size-7 flex-none items-center justify-center rounded-lg ${m.role === "user" ? "bg-secondary text-foreground" : "bg-primary/10 text-primary"}`}
            >
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">{m.role === "user" ? "You" : "Assistant"}</div>
              <div className="mt-0.5 text-[13px] leading-snug">{m.text}</div>
              {m.sources && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <SourceChip key={s} name={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <MockInput />
    </Panel>
  )
}

/* D — Compact / dense, role-prefixed */
function VariantCompact() {
  return (
    <Panel title="D · Compact / dense" desc="Tight, terminal-like. Maximum content, minimal chrome.">
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4 font-mono">
        {CONVO.map((m, i) => (
          <div key={i} className="text-[12.5px] leading-snug">
            <span className={m.role === "user" ? "font-semibold text-primary" : "font-semibold text-healthy"}>
              {m.role === "user" ? "you › " : "ai  › "}
            </span>
            <span className="text-foreground">{m.text}</span>
            {m.sources && (
              <span className="ml-1 text-[11px] text-muted-foreground">[{m.sources.join(", ")}]</span>
            )}
          </div>
        ))}
      </div>
      <MockInput />
    </Panel>
  )
}

/* E — Rounded bubble / messenger with avatars */
function VariantBubble() {
  return (
    <Panel title="E · Messenger bubbles" desc="Rounded, avatars on both sides. Friendly, consumer feel.">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {CONVO.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span
              className={`flex size-7 flex-none items-center justify-center rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </span>
            <div
              className={
                m.role === "user"
                  ? "max-w-[78%] rounded-3xl rounded-br-md bg-primary px-4 py-2 text-[13px] text-primary-foreground"
                  : "max-w-[82%] rounded-3xl rounded-bl-md bg-secondary px-4 py-2 text-[13px] leading-snug"
              }
            >
              {m.text}
              {m.sources && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.sources.map((s) => (
                    <SourceChip key={s} name={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <MockInput rounded="full" />
    </Panel>
  )
}

export function ChatShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-[1100px]">
        <h1 className="text-2xl font-semibold tracking-tight">Chat UI showcase</h1>
        <p className="mt-1 mb-8 text-muted-foreground">Same conversation, five styles. Pick one and I'll wire it into the Assistant dock.</p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <VariantAIElements />
          <VariantMinimal />
          <VariantCards />
          <VariantBubble />
          <VariantCompact />
        </div>
      </div>
    </div>
  )
}
