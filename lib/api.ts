import type { Invoice, InvoiceType } from "./types"

const API_BASE = "/api/invoices"

// API Response types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Import API
export const importApi = {
  // Import multiple invoices
  importInvoices: async (invoices: Invoice[]): Promise<{ successful: Invoice[]; failed: any[] }> => {
    try {
      const response = await fetch(`${API_BASE}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoices }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Import API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<{ successful: Invoice[]; failed: any[] }> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to import invoices")
      }

      return result.data!
    } catch (error) {
      console.error("Error in importApi.importInvoices:", error)
      throw error
    }
  },
}

// Sale Invoices API
export const saleInvoicesApi = {
  // Get all sale invoices
  getAll: async (): Promise<Invoice[]> => {
    try {
      const response = await fetch(`${API_BASE}/sale`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice[]> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sale invoices")
      }

      return result.data || []
    } catch (error) {
      console.error("Error in saleInvoicesApi.getAll:", error)
      throw error
    }
  },

  // Get specific sale invoice
  getById: async (id: string): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/sale/${id}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sale invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in saleInvoicesApi.getById:", error)
      throw error
    }
  },

  // Create new sale invoice
  create: async (invoice: Omit<Invoice, "id">): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create sale invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in saleInvoicesApi.create:", error)
      throw error
    }
  },

  // Update sale invoice
  update: async (id: string, invoice: Invoice): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/sale/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update sale invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in saleInvoicesApi.update:", error)
      throw error
    }
  },

  // Cancel sale invoice
  cancel: async (id: string, reason?: string): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/sale/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel sale invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in saleInvoicesApi.cancel:", error)
      throw error
    }
  },

  // Delete sale invoice
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/sale/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Sale invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<void> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to delete sale invoice")
      }
    } catch (error) {
      console.error("Error in saleInvoicesApi.delete:", error)
      throw error
    }
  },
}

// Purchase Invoices API
export const purchaseInvoicesApi = {
  // Get all purchase invoices
  getAll: async (): Promise<Invoice[]> => {
    try {
      const response = await fetch(`${API_BASE}/purchase`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice[]> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch purchase invoices")
      }

      return result.data || []
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.getAll:", error)
      throw error
    }
  },

  // Get specific purchase invoice
  getById: async (id: string): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/purchase/${id}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch purchase invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.getById:", error)
      throw error
    }
  },

  // Create new purchase invoice
  create: async (invoice: Omit<Invoice, "id">): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create purchase invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.create:", error)
      throw error
    }
  },

  // Update purchase invoice
  update: async (id: string, invoice: Invoice): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/purchase/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update purchase invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.update:", error)
      throw error
    }
  },

  // Cancel purchase invoice
  cancel: async (id: string, reason?: string): Promise<Invoice> => {
    try {
      const response = await fetch(`${API_BASE}/purchase/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<Invoice> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel purchase invoice")
      }

      return result.data!
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.cancel:", error)
      throw error
    }
  },

  // Delete purchase invoice
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/purchase/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Purchase invoices API error:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result: ApiResponse<void> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to delete purchase invoice")
      }
    } catch (error) {
      console.error("Error in purchaseInvoicesApi.delete:", error)
      throw error
    }
  },
}

// Export API
export const exportApi = {
  // Export invoices as CSV
  exportCSV: async (type?: InvoiceType): Promise<void> => {
    const params = new URLSearchParams()
    params.append("format", "csv")
    if (type) {
      params.append("type", type)
    }

    const response = await fetch(`${API_BASE}/export?${params.toString()}`)

    if (!response.ok) {
      throw new Error("Failed to export invoices")
    }

    // Download the file
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `GST_Invoices_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}

// Generic API helper
export const invoicesApi = {
  getAll: (type: InvoiceType) => {
    return type === "sale" ? saleInvoicesApi.getAll() : purchaseInvoicesApi.getAll()
  },

  create: (type: InvoiceType, invoice: Omit<Invoice, "id">) => {
    return type === "sale" ? saleInvoicesApi.create(invoice) : purchaseInvoicesApi.create(invoice)
  },

  update: (type: InvoiceType, id: string, invoice: Invoice) => {
    return type === "sale" ? saleInvoicesApi.update(id, invoice) : purchaseInvoicesApi.update(id, invoice)
  },

  cancel: (type: InvoiceType, id: string, reason?: string) => {
    return type === "sale" ? saleInvoicesApi.cancel(id, reason) : purchaseInvoicesApi.cancel(id, reason)
  },

  delete: (type: InvoiceType, id: string) => {
    return type === "sale" ? saleInvoicesApi.delete(id) : purchaseInvoicesApi.delete(id)
  },
}
