import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, type MonthEntry, type SummaryData } from "@/lib/api-client"
import type { Invoice, InvoiceType } from "@/lib/types"

// Query keys
export const queryKeys = {
  invoices: (params?: { type?: string; month?: number; year?: number }) =>
    ["invoices", params] as const,
  months: ["months"] as const,
  summary: (params?: { type?: string; month?: number; year?: number }) =>
    ["summary", params] as const,
}

// Fetch invoices
export function useInvoices(params?: { type?: string; month?: number; year?: number }) {
  return useQuery<Invoice[]>({
    queryKey: queryKeys.invoices(params),
    queryFn: () => apiClient.getInvoices(params),
  })
}

// Fetch months
export function useMonths() {
  return useQuery<MonthEntry[]>({
    queryKey: queryKeys.months,
    queryFn: () => apiClient.getMonths(),
  })
}

// Fetch summary
export function useSummary(params?: { type?: string; month?: number; year?: number }) {
  return useQuery<SummaryData>({
    queryKey: queryKeys.summary(params),
    queryFn: () => apiClient.getSummary(params),
  })
}

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoice: Invoice) => apiClient.createInvoice(invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["months"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, invoice }: { id: string; invoice: Invoice }) =>
      apiClient.updateInvoice(id, invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["months"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["months"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}

// Cancel invoice
export function useCancelInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.cancelInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["months"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}

// Import invoices
export function useImportInvoices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoices: Invoice[]) => apiClient.importInvoices(invoices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["months"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
    },
  })
}
