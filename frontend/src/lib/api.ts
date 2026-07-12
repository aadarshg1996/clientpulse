// Typed client for the ClientPulse read API. Types mirror src/api/schemas.py.

// Resolve API base. VITE_API_URL is inlined at build time. When wired from a
// Render `fromService` host it arrives without a scheme (e.g. "api.onrender.com"),
// so default to https:// in that case. Trailing slash trimmed to avoid "//" joins.
function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
  const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
  return withScheme.replace(/\/+$/, "")
}

const BASE = resolveApiBase()

export type Status = "healthy" | "watch" | "risk" | "critical"

export interface StatusCounts {
  healthy: number
  watch: number
  risk: number
  critical: number
}

export interface PortfolioSummary {
  total_accounts: number
  average_health: number | null
  average_sla: number | null
  accounts_at_risk: number
  arr_at_risk: number
  status_counts: StatusCounts
}

export interface HealthPoint {
  snapshot_dt: string
  score: number
}

export interface AccountListItem {
  account_uid: string
  name: string
  segment: string | null
  owner: string | null
  arr: number | null
  sentiment: string | null
  renewal_dt: string | null
  renewal_days: number | null
  health_score: number | null
  health_status: Status | null
  trend_dir: string | null
  confidence: number | null
  sla_actual_pct: number | null
  sla_target_pct: number | null
  health_history: HealthPoint[]
}

export interface Pagination {
  total: number
  limit: number
  offset: number
}

export interface AccountsResponse {
  summary: PortfolioSummary
  health_trend: HealthPoint[]
  accounts: AccountListItem[]
  pagination: Pagination
  segments: string[]
}

export interface AccountProfile {
  account_uid: string
  name: string
  segment: string | null
  owner: string | null
  arr: number | null
  sentiment: string | null
  contract_term_months: number | null
  contract_start_dt: string | null
  renewal_dt: string | null
}

export interface AccountSnapshot {
  health_score: number | null
  health_status: Status | null
  trend_dir: string | null
  confidence: number | null
  sla_actual_pct: number | null
  sla_target_pct: number | null
  renewal_days: number | null
  open_risk_count: number
}

export interface HealthHistoryItem {
  snapshot_dt: string
  score: number
  status: Status | null
  trend_dir: string | null
  confidence: number | null
}

export interface SlaHistoryItem {
  period_month: string
  target_pct: number
  actual_pct: number
  breached: boolean
}

export interface SignalItem {
  id: number
  tone: string
  label: string
  signal_text: string | null
  evidence_ref: string | null
  source_file: string | null
  source_file_id: string | null
  source_quote: string | null
  feedback: string | null
  detected_at: string
}

export interface ActionItem {
  id: number
  priority: string
  title: string
  owner: string | null
  due_label: string | null
  due_date: string | null
  rationale: string | null
  expected_impact: string | null
  linked_signal: string | null
  status: string
}

export interface AnalysisQuality {
  eval_score: number | null
  verdict: string | null
  issues: string[] | null
  guardrail_flags: string | null
  trace_id: string | null
}

export interface AccountDetailResponse {
  quality: AnalysisQuality | null
  account: AccountProfile
  snapshot: AccountSnapshot
  health_history: HealthHistoryItem[]
  sla_history: SlaHistoryItem[]
  signals: SignalItem[]
  actions: ActionItem[]
}

export interface RiskSignal {
  id: number
  tone: string
  label: string
  signal_text: string | null
  evidence_ref: string | null
}

export interface RiskAction {
  id: number
  priority: string
  title: string
  owner: string | null
  due_label: string | null
  status: string
}

export interface RiskQueueItem {
  account_uid: string
  name: string
  segment: string | null
  status: Status
  score: number
  confidence: number | null
  arr: number | null
  renewal_days: number | null
  driver_signal: RiskSignal | null
  recommended_action: RiskAction | null
}

export interface RiskSummary {
  total: number
  critical: number
  risk: number
  watch: number
}

export interface RisksResponse {
  summary: RiskSummary
  risks: RiskQueueItem[]
  pagination: Pagination
}

export type SortKey = "name" | "arr" | "health" | "sla" | "renewal"

export interface AccountsParams {
  search?: string
  segment?: string
  status?: Status
  sort?: SortKey
  order?: "asc" | "desc"
  limit?: number
  offset?: number
}

async function getJSON<T>(path: string, params?: object): Promise<T> {
  const url = new URL(path, BASE)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`)
  return res.json() as Promise<T>
}

async function send<T>(
  method: string,
  path: string,
  opts: { params?: Record<string, unknown>; form?: FormData; json?: unknown } = {},
): Promise<T> {
  const url = new URL(path, BASE)
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
    }
  }
  const init: RequestInit = { method }
  if (opts.form) init.body = opts.form
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json)
    init.headers = { "Content-Type": "application/json" }
  }
  const res = await fetch(url.toString(), init)
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      if (j?.detail) detail = j.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export interface AnalyzeResult {
  account_uid: string
  run_id: number
  status: string
  health_score: number
  health_status: Status
  confidence: number
  sentiment: string
  signals: number
  actions: number
  summary: string
}

export const api = {
  accounts: (p: AccountsParams = {}) => getJSON<AccountsResponse>("/accounts", p),
  accountDetail: (uid: string) => getJSON<AccountDetailResponse>(`/accounts/${uid}`),
  risks: (p: { status?: Status; segment?: string; limit?: number; offset?: number } = {}) =>
    getJSON<RisksResponse>("/risks", p),
  documents: (uid: string) => getJSON<{ documents: { filename: string; doc_type: string }[] }>(`/accounts/${uid}/documents`),
  analyze: (uid: string) => send<AnalyzeResult>("POST", `/accounts/${uid}/analyze`),
  evaluate: (uid: string) => send<{ eval_score: number; verdict: string }>("POST", `/accounts/${uid}/evaluate`),
  uploadDocuments: (uid: string, files: File[]) => {
    const form = new FormData()
    for (const f of files) form.append("files", f)
    return send<{ documents: unknown[] }>("POST", `/accounts/${uid}/documents`, { form })
  },
  updateAction: (id: number, params: { status: string; owner?: string; due_label?: string }) =>
    send<{ id: number; status: string; owner: string | null; due_label: string | null }>(
      "PATCH",
      `/actions/${id}`,
      { params },
    ),
  updateSignal: (id: number, feedback: "confirmed" | "false_positive" | "none") =>
    send<{ id: number; feedback: string | null }>("PATCH", `/signals/${id}`, { params: { feedback } }),
  chat: (uid: string, message: string, history: { role: string; content: string }[]) =>
    send<{ answer: string; sources: string[] }>("POST", `/accounts/${uid}/chat`, { json: { message, history } }),
}
