import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, type AccountsParams, type Status } from "@/lib/api"

export function useAccounts(params: AccountsParams = {}) {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: () => api.accounts(params),
    placeholderData: keepPreviousData,
  })
}

export function useAccountDetail(uid: string | null) {
  return useQuery({
    queryKey: ["account", uid],
    queryFn: () => api.accountDetail(uid as string),
    enabled: !!uid,
  })
}

export function useRisks(params: { status?: Status; segment?: string } = {}) {
  return useQuery({
    queryKey: ["risks", params],
    queryFn: () => api.risks(params),
    placeholderData: keepPreviousData,
  })
}

export function useDocuments(uid: string | null) {
  return useQuery({
    queryKey: ["documents", uid],
    queryFn: () => api.documents(uid as string),
    enabled: !!uid,
  })
}

function useInvalidateAccount(uid: string | null) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["account", uid] })
    qc.invalidateQueries({ queryKey: ["accounts"] })
    qc.invalidateQueries({ queryKey: ["risks"] })
    qc.invalidateQueries({ queryKey: ["documents", uid] })
  }
}

export function useAnalyze(uid: string | null) {
  const invalidate = useInvalidateAccount(uid)
  return useMutation({
    mutationFn: () => api.analyze(uid as string),
    onSuccess: invalidate,
  })
}

export function useEvaluate(uid: string | null) {
  const invalidate = useInvalidateAccount(uid)
  return useMutation({
    mutationFn: () => api.evaluate(uid as string),
    onSuccess: invalidate,
  })
}

export function useUploadDocuments(uid: string | null) {
  const invalidate = useInvalidateAccount(uid)
  return useMutation({
    mutationFn: (files: File[]) => api.uploadDocuments(uid as string, files),
    onSuccess: invalidate,
  })
}

export function useUpdateAction(uid: string | null) {
  const invalidate = useInvalidateAccount(uid)
  return useMutation({
    mutationFn: (vars: { id: number; status: string; owner?: string; due_label?: string }) =>
      api.updateAction(vars.id, vars),
    onSuccess: invalidate,
  })
}

export function useUpdateSignal(uid: string | null) {
  const invalidate = useInvalidateAccount(uid)
  return useMutation({
    mutationFn: (vars: { id: number; feedback: "confirmed" | "false_positive" | "none" }) =>
      api.updateSignal(vars.id, vars.feedback),
    onSuccess: invalidate,
  })
}
