import type { Invoice, GSTBreakup, TaxItem } from "./types"

// Shape returned by the API (Prisma includes relations)
interface APIInvoice {
  id: string
  type: "sale" | "purchase"
  date: string
  month: number
  year: number
  invoiceNo: string
  party: string
  gstNumber: string | null
  basicAmount: number
  totalAmount: number
  isCancelled: boolean
  cancelledAt: string | null
  cancelledReason: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    invoiceId: string
    amount: number
    taxType: string
    taxRate: number
    inclusive: boolean
  }[]
  gstBreakup: {
    cgst_14: number
    sgst_14: number
    cgst_9: number
    sgst_9: number
    cgst_6: number
    sgst_6: number
    cgst_2_5: number
    sgst_2_5: number
    cgst_1_5: number
    sgst_1_5: number
    igst_28: number
    igst_18: number
    igst_12: number
    igst_5: number
    igst_3: number
  } | null
}

export interface MonthEntry {
  month: number
  year: number
  saleCount: number
  purchaseCount: number
}

export interface SummaryData {
  totalCount: number
  activeCount: number
  cancelledCount: number
  basicAmount: number
  totalAmount: number
  totalTax: number
}

function apiInvoiceToInvoice(api: APIInvoice): Invoice {
  const gstBreakup: GSTBreakup = api.gstBreakup
    ? {
        cgst_14: api.gstBreakup.cgst_14,
        sgst_14: api.gstBreakup.sgst_14,
        cgst_9: api.gstBreakup.cgst_9,
        sgst_9: api.gstBreakup.sgst_9,
        cgst_6: api.gstBreakup.cgst_6,
        sgst_6: api.gstBreakup.sgst_6,
        cgst_2_5: api.gstBreakup.cgst_2_5,
        sgst_2_5: api.gstBreakup.sgst_2_5,
        cgst_1_5: api.gstBreakup.cgst_1_5,
        sgst_1_5: api.gstBreakup.sgst_1_5,
        igst_28: api.gstBreakup.igst_28,
        igst_18: api.gstBreakup.igst_18,
        igst_12: api.gstBreakup.igst_12,
        igst_5: api.gstBreakup.igst_5,
        igst_3: api.gstBreakup.igst_3,
      }
    : {
        cgst_14: 0, sgst_14: 0, cgst_9: 0, sgst_9: 0,
        cgst_6: 0, sgst_6: 0, cgst_2_5: 0, sgst_2_5: 0,
        cgst_1_5: 0, sgst_1_5: 0, igst_28: 0, igst_18: 0,
        igst_12: 0, igst_5: 0, igst_3: 0,
      }

  const items: TaxItem[] = api.items.map((item) => ({
    id: item.id,
    amount: item.amount,
    taxType: item.taxType as "CGST_SGST" | "IGST",
    taxRate: item.taxRate as 28 | 18 | 12 | 5 | 3,
    inclusive: item.inclusive,
  }))

  return {
    id: api.id,
    type: api.type,
    date: api.date.split("T")[0],
    invoiceNo: api.invoiceNo,
    party: api.party,
    gstNumber: api.gstNumber || undefined,
    items,
    basicAmount: api.basicAmount,
    totalAmount: api.totalAmount,
    gstBreakup,
    isCancelled: api.isCancelled,
    cancelledAt: api.cancelledAt || undefined,
    cancelledReason: api.cancelledReason || undefined,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}

export const apiClient = {
  async getInvoices(params?: {
    type?: string
    month?: number
    year?: number
  }): Promise<Invoice[]> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.month) searchParams.set("month", params.month.toString())
    if (params?.year) searchParams.set("year", params.year.toString())

    const res = await fetch(`/api/invoices?${searchParams.toString()}`)
    const data = await handleResponse<APIInvoice[]>(res)
    return data.map(apiInvoiceToInvoice)
  },

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: invoice.type,
        date: invoice.date,
        invoiceNo: invoice.invoiceNo,
        party: invoice.party,
        gstNumber: invoice.gstNumber,
        basicAmount: invoice.basicAmount,
        totalAmount: invoice.totalAmount,
        items: invoice.items,
        gstBreakup: invoice.gstBreakup,
      }),
    })
    const data = await handleResponse<APIInvoice>(res)
    return apiInvoiceToInvoice(data)
  },

  async updateInvoice(id: string, invoice: Invoice): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: invoice.type,
        date: invoice.date,
        invoiceNo: invoice.invoiceNo,
        party: invoice.party,
        gstNumber: invoice.gstNumber,
        basicAmount: invoice.basicAmount,
        totalAmount: invoice.totalAmount,
        items: invoice.items,
        gstBreakup: invoice.gstBreakup,
      }),
    })
    const data = await handleResponse<APIInvoice>(res)
    return apiInvoiceToInvoice(data)
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
    await handleResponse(res)
  },

  async cancelInvoice(id: string): Promise<Invoice> {
    const res = await fetch(`/api/invoices/${id}/cancel`, { method: "PATCH" })
    const data = await handleResponse<APIInvoice>(res)
    return apiInvoiceToInvoice(data)
  },

  async importInvoices(
    invoices: Invoice[]
  ): Promise<{ successful: Invoice[]; failed: { invoice: Invoice; error: string }[] }> {
    const res = await fetch("/api/invoices/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoices: invoices.map((inv) => ({
          type: inv.type,
          date: inv.date,
          invoiceNo: inv.invoiceNo,
          party: inv.party,
          gstNumber: inv.gstNumber,
          basicAmount: inv.basicAmount,
          totalAmount: inv.totalAmount,
          items: inv.items,
          gstBreakup: inv.gstBreakup,
        })),
      }),
    })
    return handleResponse(res)
  },

  async exportCSV(params?: {
    type?: string
    month?: number
    year?: number
  }): Promise<string> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.month) searchParams.set("month", params.month.toString())
    if (params?.year) searchParams.set("year", params.year.toString())

    const res = await fetch(`/api/invoices/export?${searchParams.toString()}`)
    if (!res.ok) throw new Error("Failed to export")
    return res.text()
  },

  async getMonths(): Promise<MonthEntry[]> {
    const res = await fetch("/api/invoices/months")
    return handleResponse(res)
  },

  async getSummary(params?: {
    type?: string
    month?: number
    year?: number
  }): Promise<SummaryData> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set("type", params.type)
    if (params?.month) searchParams.set("month", params.month.toString())
    if (params?.year) searchParams.set("year", params.year.toString())

    const res = await fetch(`/api/invoices/summary?${searchParams.toString()}`)
    return handleResponse(res)
  },
}
