import { useRef } from "react"
import { Check, FileText, Flag, Gauge as GaugeIcon, Loader2, ShieldAlert, Sparkles, Upload, X } from "lucide-react"

import {
  useAccountDetail,
  useAnalyze,
  useDocuments,
  useEvaluate,
  useUpdateAction,
  useUpdateSignal,
  useUploadDocuments,
} from "@/hooks/use-clientpulse"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  STATUS_VAR,
  avatar,
  fdate,
  money,
  monthLabel,
  statusFromScore,
} from "@/lib/format"
import { fade, useChartTheme } from "@/lib/chart-theme"
import { EChart } from "./echart"
import { AwaitingAnalysis } from "./awaiting-analysis"
import { StatusBadge } from "./status-badge"
import type { AccountDetailResponse, SlaHistoryItem } from "@/lib/api"

function Gauge({ value, max, color, label, sub }: { value: number; max: number; color: string; label: string; sub: string }) {
  const t = useChartTheme()
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-[22px]">
      <div className="self-start text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <EChart
        height={150}
        option={{
          series: [
            {
              type: "gauge",
              startAngle: 90,
              endAngle: -270,
              min: 0,
              max,
              radius: "92%",
              pointer: { show: false },
              progress: { show: true, roundCap: true, width: 12, itemStyle: { color } },
              axisLine: { lineStyle: { width: 12, color: [[1, t.grid]] } },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              anchor: { show: false },
              detail: {
                valueAnimation: true,
                offsetCenter: [0, "-6%"],
                fontSize: 30,
                fontWeight: 600,
                fontFamily: "ui-monospace, monospace",
                color: t.dark ? "#eef1f6" : "#0f1521",
                formatter: "{value}",
              },
              title: { offsetCenter: [0, "26%"], fontSize: 10, color: t.text },
              data: [{ value, name: sub }],
            },
          ],
        }}
      />
    </div>
  )
}

function SlaBars({ rows }: { rows: SlaHistoryItem[] }) {
  const t = useChartTheme()
  return (
    <div className="rounded-2xl border bg-card p-[22px]">
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        SLA · last 6 months
      </div>
      <EChart
        height={130}
        option={{
          textStyle: { fontFamily: t.fontFamily },
          grid: { left: 28, right: 10, top: 14, bottom: 22 },
          tooltip: {
            trigger: "axis",
            backgroundColor: t.tooltipBg,
            borderColor: t.tooltipBorder,
            textStyle: { color: t.text, fontSize: 12 },
            valueFormatter: (v: number) => `${v}%`,
          },
          xAxis: {
            type: "category",
            data: rows.map((s) => monthLabel(s.period_month)),
            axisLine: { lineStyle: { color: t.grid } },
            axisTick: { show: false },
            axisLabel: { color: t.text, fontSize: 10 },
          },
          yAxis: {
            type: "value",
            min: 60,
            max: 100,
            splitLine: { lineStyle: { color: t.grid } },
            axisLabel: { color: t.text, fontSize: 10 },
          },
          series: [
            {
              type: "bar",
              data: rows.map((s) => {
                const c = s.actual_pct < 90 ? t.status.critical : s.actual_pct < 95 ? t.status.watch : t.status.healthy
                return { value: s.actual_pct, itemStyle: { color: fade(c, 0.9), borderRadius: [5, 5, 0, 0] } }
              }),
              barWidth: "46%",
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { type: "dashed", color: t.status.watch, opacity: 0.7 },
                data: [{ yAxis: 95 }],
                label: { show: false },
              },
            },
          ],
        }}
      />
    </div>
  )
}

function toneColor(tone: string): string {
  return (
    { critical: "var(--critical)", warn: "var(--watch)", good: "var(--healthy)", neutral: "var(--muted-foreground)" }[
      tone
    ] ?? "var(--muted-foreground)"
  )
}

function priClass(p: string): string {
  return p === "High" ? "bg-critical-soft text-critical" : p === "Medium" ? "bg-watch-soft text-watch" : "bg-secondary text-muted-foreground"
}

function Body({
  d,
  docs,
  onUpload,
  uploading,
  onAction,
  actionPendingId,
  onSignalFeedback,
  signalPendingId,
  onEvaluate,
  evaluating,
  analyzing,
}: {
  d: AccountDetailResponse
  docs: { filename: string; doc_type: string }[]
  onUpload: (files: File[]) => void
  uploading: boolean
  onAction: (id: number, status: string) => void
  actionPendingId: number | null
  onSignalFeedback: (id: number, feedback: "confirmed" | "false_positive" | "none") => void
  signalPendingId: number | null
  onEvaluate: () => void
  evaluating: boolean
  analyzing: boolean
}) {
  const { account: a, snapshot: s } = d
  const status = s.health_status ?? statusFromScore(s.health_score ?? 0)
  const color = STATUS_VAR[status]
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3.5 p-[22px]">
        {analyzing && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
            <Loader2 className="size-4 animate-spin" /> Agent analyzing this account…
          </div>
        )}

        {s.health_score != null && (
          <div className="rounded-2xl border bg-card p-[22px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">Analysis quality</div>
                {d.quality?.eval_score != null && (
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-sm font-semibold"
                    style={{
                      background:
                        d.quality.eval_score >= 80 ? "var(--healthy-soft)" : d.quality.eval_score >= 60 ? "var(--watch-soft)" : "var(--critical-soft)",
                      color:
                        d.quality.eval_score >= 80 ? "var(--healthy)" : d.quality.eval_score >= 60 ? "var(--watch)" : "var(--critical)",
                    }}
                  >
                    {d.quality.eval_score}/100
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" disabled={evaluating} onClick={onEvaluate}>
                {evaluating ? <Loader2 className="size-4 animate-spin" /> : <GaugeIcon className="size-4" />}
                {evaluating ? "Judging…" : d.quality?.eval_score != null ? "Re-evaluate" : "Evaluate"}
              </Button>
            </div>
            {d.quality?.verdict && (
              <div className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{d.quality.verdict}</div>
            )}
            {d.quality?.guardrail_flags && (
              <div className="mt-2 flex items-start gap-1.5 text-[11.5px] text-watch">
                <ShieldAlert className="mt-0.5 size-3.5 flex-none" />
                <span>{d.quality.guardrail_flags}</span>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border bg-card p-[22px]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Documents</div>
            <span className="text-[11px] text-muted-foreground">{docs.length} on file</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {docs.map((doc) => (
              <div key={doc.filename} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <FileText className="size-3.5" />
                <span className="truncate">{doc.filename}</span>
                <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">{doc.doc_type}</span>
              </div>
            ))}
            {docs.length === 0 && <div className="text-[12.5px] text-muted-foreground">No documents uploaded yet.</div>}
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) onUpload(files)
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : "Upload documents"}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {[
            ["Health", s.health_score ?? "—"],
            ["SLA", s.sla_actual_pct != null ? `${Math.round(s.sla_actual_pct)}%` : "—"],
            ["Renews", s.renewal_days != null ? `${s.renewal_days}d` : "—"],
            ["Confidence", s.confidence != null ? `${s.confidence}%` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-card p-3">
              <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className="mt-0.5 font-mono text-xl font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {s.health_score != null ? (
            <Gauge value={s.health_score} max={100} color={color} label="Health score" sub="out of 100" />
          ) : (
            <div className="flex flex-col gap-2 rounded-2xl border bg-card p-[22px]">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Health score</div>
              <AwaitingAnalysis compact className="flex-1" label="Awaiting analysis" />
            </div>
          )}
          <Gauge
            value={s.renewal_days ?? 0}
            max={180}
            color={s.renewal_days != null && s.renewal_days < 45 ? "var(--critical)" : s.renewal_days != null && s.renewal_days < 90 ? "var(--watch)" : "var(--healthy)"}
            label="Renewal countdown"
            sub="days left"
          />
        </div>

        {d.sla_history.length > 0 && <SlaBars rows={d.sla_history} />}

        <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-[22px]">
          <div className="mb-1 text-sm font-semibold">Signals detected</div>
          {d.signals.map((sig) => (
            <div key={sig.id} className="flex gap-3 border-b py-2.5 last:border-0">
              <span className="mt-1.5 size-2.5 flex-none rounded-full" style={{ background: toneColor(sig.tone) }} />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{sig.label}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{sig.signal_text}</div>
                {sig.source_file && (
                  <div className="mt-1.5 rounded-md border-l-2 border-primary/40 bg-secondary/60 px-2 py-1">
                    <div className="flex items-center gap-1 text-[10.5px] font-semibold text-primary">
                      <FileText className="size-3" /> {sig.source_file}
                    </div>
                    {sig.source_quote && (
                      <div className="mt-0.5 text-[11.5px] italic leading-snug text-muted-foreground">“{sig.source_quote}”</div>
                    )}
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5">
                  {sig.feedback ? (
                    <button
                      onClick={() => onSignalFeedback(sig.id, "none")}
                      disabled={signalPendingId === sig.id}
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${
                        sig.feedback === "confirmed" ? "bg-healthy-soft text-healthy" : "bg-critical-soft text-critical"
                      }`}
                      title="Click to clear"
                    >
                      {sig.feedback === "confirmed" ? <Check className="size-3" /> : <Flag className="size-3" />}
                      {sig.feedback === "confirmed" ? "Confirmed" : "False positive"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onSignalFeedback(sig.id, "confirmed")}
                        disabled={signalPendingId === sig.id}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground hover:border-healthy hover:text-healthy"
                      >
                        <Check className="size-3" /> Confirm
                      </button>
                      <button
                        onClick={() => onSignalFeedback(sig.id, "false_positive")}
                        disabled={signalPendingId === sig.id}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground hover:border-critical hover:text-critical"
                      >
                        <Flag className="size-3" /> False positive
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {d.signals.length === 0 && (
            <AwaitingAnalysis compact label="Awaiting analysis" sub="Signals are detected by the agent layer" />
          )}
        </div>

        <div className="rounded-2xl border bg-card p-[22px]">
          <div className="mb-1 flex items-baseline justify-between">
            <div className="text-sm font-semibold">Recommended actions</div>
            <div className="text-[11px] text-muted-foreground">review required</div>
          </div>
          {d.actions.map((ac) => (
            <div key={ac.id} className="flex items-start gap-3 border-b py-3 last:border-0">
              <span className={`inline-flex flex-none rounded-md px-2 py-0.5 text-[11px] font-semibold ${priClass(ac.priority)}`}>
                {ac.priority}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-snug">{ac.title}</div>
                {ac.rationale && (
                  <div className="mt-1 text-[12px] leading-snug text-muted-foreground">{ac.rationale}</div>
                )}
                {ac.expected_impact && (
                  <div className="mt-1 text-[12px] font-medium text-healthy">→ {ac.expected_impact}</div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                  {ac.owner && <span>Owner · {ac.owner}</span>}
                  {ac.due_date ? (
                    <span>Due {new Date(ac.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  ) : (
                    ac.due_label && <span>Due {ac.due_label}</span>
                  )}
                  {ac.linked_signal && <span className="text-muted-foreground/70">↳ {ac.linked_signal}</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {ac.status === "recommended" ? (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={actionPendingId === ac.id}
                        onClick={() => onAction(ac.id, "approved")}
                      >
                        <Check className="size-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        disabled={actionPendingId === ac.id}
                        onClick={() => onAction(ac.id, "dismissed")}
                      >
                        <X className="size-3.5" /> Dismiss
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        ac.status === "approved" ? "bg-healthy-soft text-healthy" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {ac.status === "approved" ? <Check className="size-3" /> : <X className="size-3" />}
                      {ac.status === "approved" ? "Approved" : "Dismissed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {d.actions.length === 0 && (
            <AwaitingAnalysis compact label="Awaiting analysis" sub="Actions are recommended by the agent layer" />
          )}
        </div>
        </div>

        <div className="rounded-2xl border bg-card p-[22px]">
          <div className="mb-1.5 text-sm font-semibold">Contract &amp; context</div>
          {[
            ["Annual recurring revenue", money(a.arr)],
            ["Contract term", a.contract_term_months ? `${a.contract_term_months} months` : "—"],
            ["Started", fdate(a.contract_start_dt)],
            ["Renewal", fdate(a.renewal_dt)],
            ["Client sentiment", a.sentiment ?? "—"],
            ["Open risk signals", String(s.open_risk_count)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b py-2 text-[13px] last:border-0">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

export function AccountDrawer({
  uid,
  onClose,
}: {
  uid: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useAccountDetail(uid)
  const docsQ = useDocuments(uid)
  const analyze = useAnalyze(uid)
  const upload = useUploadDocuments(uid)
  const updateAction = useUpdateAction(uid)
  const updateSignal = useUpdateSignal(uid)
  const evaluateRun = useEvaluate(uid)

  const analyzed = data?.snapshot.health_score != null
  const docs = docsQ.data?.documents ?? []
  const actionPendingId = updateAction.isPending ? (updateAction.variables?.id ?? null) : null
  const signalPendingId = updateSignal.isPending ? (updateSignal.variables?.id ?? null) : null

  return (
    <Sheet open={!!uid} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[min(98vw,1320px)]">
        <SheetHeader className="flex-none flex-row items-center gap-3.5 border-b bg-card">
          {data ? (
            <>
              <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-primary/10 font-mono text-base font-bold text-primary">
                {avatar(data.account.name)}
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="flex items-center gap-2.5">
                  <span className="truncate text-lg font-bold tracking-tight">{data.account.name}</span>
                  {data.snapshot.health_status && <StatusBadge status={data.snapshot.health_status} />}
                </SheetTitle>
                <div className="text-[12.5px] text-muted-foreground">
                  {data.account.segment} · {money(data.account.arr)} ARR · Owner {data.account.owner}
                </div>
              </div>
              <Button
                className="flex-none"
                disabled={analyze.isPending}
                onClick={() => analyze.mutate()}
              >
                {analyze.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {analyze.isPending ? "Analyzing…" : analyzed ? "Re-analyze" : "Analyze"}
              </Button>
            </>
          ) : (
            <SheetTitle className="text-lg">Account</SheetTitle>
          )}
        </SheetHeader>

        {analyze.isError && (
          <div className="border-b bg-critical-soft px-[22px] py-2 text-[12.5px] text-critical">
            {(analyze.error as Error).message}
          </div>
        )}

        {isLoading || !data ? (
          <div className="flex flex-col gap-3 p-[22px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <Body
            d={data}
            docs={docs}
            onUpload={(files) => upload.mutate(files)}
            uploading={upload.isPending}
            onAction={(id, status) => updateAction.mutate({ id, status })}
            actionPendingId={actionPendingId}
            onSignalFeedback={(id, feedback) => updateSignal.mutate({ id, feedback })}
            signalPendingId={signalPendingId}
            onEvaluate={() => evaluateRun.mutate()}
            evaluating={evaluateRun.isPending}
            analyzing={analyze.isPending}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
