import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileText, Loader2, Send, Sparkles } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Msg {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

const SUGGESTIONS = [
  "Why is this account at risk?",
  "What's the renewal exposure?",
  "Summarize the SLA situation.",
  "What should I do first?",
]

function SourceChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
      <FileText className="size-3" /> {name}
    </span>
  )
}

/** AI Elements style — full-width answers with source citations + suggestion pills. Fills its container. */
export function ChatPanel({ uid }: { uid: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const ask = useMutation({
    mutationFn: (text: string) => api.chat(uid, text, messages.map((m) => ({ role: m.role, content: m.content }))),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }])
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e6 }))
    },
  })

  function submit(text: string) {
    const q = text.trim()
    if (!q || ask.isPending) return
    setMessages((m) => [...m, { role: "user", content: q }])
    setInput("")
    ask.mutate(q)
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e6 }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-[12.5px] text-muted-foreground">
            Ask anything about this account — answers are grounded in its documents.
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl bg-primary px-3.5 py-2 text-[13px] text-primary-foreground">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Assistant
              </div>
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
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

        {ask.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> thinking…
          </div>
        )}

        {messages.length === 0 && (
          <div className="mt-1 flex flex-col gap-2">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => submit(sug)}
                className="rounded-xl border px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(input)
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this account…"
          className="min-w-0 flex-1 rounded-xl border bg-secondary px-3 py-2 text-[13px] outline-none focus:border-primary"
        />
        <Button type="submit" size="sm" disabled={ask.isPending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
