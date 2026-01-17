import type { Invoice } from "./types"

// Database service to replace localStorage service
export class DatabaseService {
  private baseUrl = "/api/invoices"

  // Get invoices by type
  async getInvoices(type: "sale" | "purchase"): Promise<Invoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch invoices")
      }
      
      return result.data || []
    } catch (error) {
      console.error("Error fetching invoices:", error)
      throw error
    }
  }

  // Save invoices (for compatibility with localStorage service)
  async saveInvoices(type: "sale" | "purchase", invoices: Invoice[]): Promise<void> {
    // This method is for compatibility - in database mode, we don't bulk save
    // Individual invoices should be created via addInvoice
    console.warn("saveInvoices is deprecated in database mode. Use addInvoice for individual invoices.")
  }

  // Add new invoice
  async addInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/${invoice.type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create invoice")
      }
      
      return result.data
    } catch (error) {
      console.error("Error creating invoice:", error)
      throw error
    }
  }

  // Add multiple invoices
  async addInvoices(invoices: Invoice[]): Promise<{ successful: Invoice[]; failed: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoices }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to import invoices")
      }
      
      return result.data
    } catch (error) {
      console.error("Error importing invoices:", error)
      throw error
    }
  }

  // Update invoice
  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/${invoice.type}/${invoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update invoice")
      }
      
      return result.data
    } catch (error) {
      console.error("Error updating invoice:", error)
      throw error
    }
  }

  // Delete invoice
  async deleteInvoice(id: string, type: "sale" | "purchase"): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}/${id}`, {
        method: "DELETE",
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete invoice")
      }
      
      return true
    } catch (error) {
      console.error("Error deleting invoice:", error)
      throw error
    }
  }

  // Cancel invoice
  async cancelInvoice(id: string, type: "sale" | "purchase", reason?: string): Promise<Invoice> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to cancel invoice")
      }
      
      return result.data
    } catch (error) {
      console.error("Error cancelling invoice:", error)
      throw error
    }
  }

  // Search invoices
  async searchInvoices(params: {
    query?: string
    type?: "sale" | "purchase"
    status?: "active" | "cancelled"
    fromDate?: string
    toDate?: string
    minAmount?: number
    maxAmount?: number
    gstNumber?: string
    page?: number
    limit?: number
  }) {
    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString())
        }
      })
      
      const response = await fetch(`${this.baseUrl}/search?${searchParams.toString()}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to search invoices")
      }
      
      return result.data
    } catch (error) {
      console.error("Error searching invoices:", error)
      throw error
    }
  }

  // Get statistics
  async getStats(params?: {
    type?: "sale" | "purchase"
    period?: "month" | "year"
  }) {
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.type) searchParams.append("type", params.type)
      if (params?.period) searchParams.append("period", params.period)
      
      const response = await fetch(`${this.baseUrl}/stats?${searchParams.toString()}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch statistics")
      }
      
      return result.data
    } catch (error) {
      console.error("Error fetching statistics:", error)
      throw error
    }
  }

  // Export invoices
  async exportInvoices(type?: "sale" | "purchase", format: "csv" | "json" = "csv") {
    try {
      const searchParams = new URLSearchParams()
      if (type) searchParams.append("type", type)
      searchParams.append("format", format)
      
      const response = await fetch(`${this.baseUrl}/export?${searchParams.toString()}`)
      
      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `GST_Invoices_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        return { success: true }
      } else {
        const result = await response.json()
        return result.data
      }
    } catch (error) {
      console.error("Error exporting invoices:", error)
      throw error
    }
  }

  // Migrate from localStorage
  async migrateFromLocalStorage(saleInvoices: Invoice[], purchaseInvoices: Invoice[]) {
    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleInvoices,
          purchaseInvoices,
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to migrate data")
      }
      
      return result.data
    } catch (error) {
      console.error("Error migrating data:", error)
      throw error
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
