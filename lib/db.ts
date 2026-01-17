// Simple in-memory database simulation (replace with real database in production)
import type { Invoice } from "./types"

class InMemoryDB {
  private saleInvoices: Invoice[] = []
  private purchaseInvoices: Invoice[] = []

  // Sale Invoices
  async getSaleInvoices(): Promise<Invoice[]> {
    return [...this.saleInvoices]
  }

  async addSaleInvoice(invoice: Invoice): Promise<Invoice> {
    const newInvoice = { ...invoice, id: Date.now().toString() }
    this.saleInvoices.push(newInvoice)
    return newInvoice
  }

  async updateSaleInvoice(id: string, invoice: Invoice): Promise<Invoice | null> {
    const index = this.saleInvoices.findIndex((inv) => inv.id === id)
    if (index === -1) return null

    this.saleInvoices[index] = { ...invoice, id }
    return this.saleInvoices[index]
  }

  async deleteSaleInvoice(id: string): Promise<boolean> {
    const index = this.saleInvoices.findIndex((inv) => inv.id === id)
    if (index === -1) return false

    this.saleInvoices.splice(index, 1)
    return true
  }

  // Purchase Invoices
  async getPurchaseInvoices(): Promise<Invoice[]> {
    return [...this.purchaseInvoices]
  }

  async addPurchaseInvoice(invoice: Invoice): Promise<Invoice> {
    const newInvoice = { ...invoice, id: Date.now().toString() }
    this.purchaseInvoices.push(newInvoice)
    return newInvoice
  }

  async updatePurchaseInvoice(id: string, invoice: Invoice): Promise<Invoice | null> {
    const index = this.purchaseInvoices.findIndex((inv) => inv.id === id)
    if (index === -1) return null

    this.purchaseInvoices[index] = { ...invoice, id }
    return this.purchaseInvoices[index]
  }

  async deletePurchaseInvoice(id: string): Promise<boolean> {
    const index = this.purchaseInvoices.findIndex((inv) => inv.id === id)
    if (index === -1) return false

    this.purchaseInvoices.splice(index, 1)
    return true
  }

  // Utility methods
  async getAllInvoices(): Promise<{ sale: Invoice[]; purchase: Invoice[] }> {
    return {
      sale: await this.getSaleInvoices(),
      purchase: await this.getPurchaseInvoices(),
    }
  }

  async getInvoiceById(id: string, type: "sale" | "purchase"): Promise<Invoice | null> {
    const invoices = type === "sale" ? this.saleInvoices : this.purchaseInvoices
    return invoices.find((inv) => inv.id === id) || null
  }

  async checkDuplicateInvoiceNo(invoiceNo: string, type: "sale" | "purchase", excludeId?: string): Promise<boolean> {
    const invoices = type === "sale" ? this.saleInvoices : this.purchaseInvoices
    return invoices.some((inv) => inv.invoiceNo === invoiceNo && inv.id !== excludeId)
  }
}

// Export singleton instance
export const db = new InMemoryDB()
