import type { Invoice } from "./types"

const STORAGE_KEYS = {
  SALE_INVOICES: "gst-sale-invoices",
  PURCHASE_INVOICES: "gst-purchase-invoices",
}

export class LocalStorageService {
  // Get invoices from localStorage
  getInvoices(type: "sale" | "purchase"): Invoice[] {
    try {
      const key = type === "sale" ? STORAGE_KEYS.SALE_INVOICES : STORAGE_KEYS.PURCHASE_INVOICES
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return []
    }
  }

  // Save invoices to localStorage
  saveInvoices(type: "sale" | "purchase", invoices: Invoice[]): void {
    try {
      const key = type === "sale" ? STORAGE_KEYS.SALE_INVOICES : STORAGE_KEYS.PURCHASE_INVOICES
      localStorage.setItem(key, JSON.stringify(invoices))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  // Add new invoice
  addInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices(invoice.type)
    const newInvoice = { ...invoice, id: crypto.randomUUID() }
    invoices.push(newInvoice)
    this.saveInvoices(invoice.type, invoices)
  }

  // Add multiple invoices
  addInvoices(newInvoices: Invoice[]): { successful: Invoice[]; failed: any[] } {
    const results = { successful: [] as Invoice[], failed: [] as any[] }

    newInvoices.forEach((invoice) => {
      try {
        // Check for duplicate invoice numbers
        const existingInvoices = this.getInvoices(invoice.type)
        const isDuplicate = existingInvoices.some((existing) => existing.invoiceNo === invoice.invoiceNo)

        if (isDuplicate) {
          results.failed.push({
            invoice,
            error: `Invoice number ${invoice.invoiceNo} already exists`,
          })
        } else {
          this.addInvoice(invoice)
          results.successful.push({ ...invoice, id: crypto.randomUUID() })
        }
      } catch (error) {
        results.failed.push({
          invoice,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    })

    return results
  }

  // Export to CSV
  exportToCSV(type?: "sale" | "purchase"): string {
    const saleInvoices = this.getInvoices("sale")
    const purchaseInvoices = this.getInvoices("purchase")

    let invoicesToExport: Invoice[] = []
    if (type === "sale") {
      invoicesToExport = saleInvoices
    } else if (type === "purchase") {
      invoicesToExport = purchaseInvoices
    } else {
      invoicesToExport = [...saleInvoices, ...purchaseInvoices]
    }

    const headers = [
      "TYPE",
      "DATE",
      "INVOICE NO.",
      "PARTY",
      "GST NUMBER",
      "STATUS",
      "BASIC AMOUNT",
      "CGST (14%)",
      "SGST (14%)",
      "CGST (9%)",
      "SGST (9%)",
      "CGST (6%)",
      "SGST (6%)",
      "CGST (2.5%)",
      "SGST (2.5%)",
      "CGST (1.5%)",
      "SGST (1.5%)",
      "IGST (28%)",
      "IGST (18%)",
      "IGST (12%)",
      "IGST (5%)",
      "IGST (3%)",
      "TOTAL AMOUNT",
    ]

    const rows = invoicesToExport.map((invoice) => [
      invoice.type.toUpperCase(),
      formatDateToDDMMYYYY(invoice.date),
      invoice.invoiceNo,
      invoice.party,
      invoice.gstNumber || "",
      invoice.isCancelled ? "CANCELLED" : "ACTIVE",
      invoice.basicAmount.toFixed(2),
      invoice.gstBreakup.cgst_14.toFixed(2),
      invoice.gstBreakup.sgst_14.toFixed(2),
      invoice.gstBreakup.cgst_9.toFixed(2),
      invoice.gstBreakup.sgst_9.toFixed(2),
      invoice.gstBreakup.cgst_6.toFixed(2),
      invoice.gstBreakup.sgst_6.toFixed(2),
      invoice.gstBreakup.cgst_2_5.toFixed(2),
      invoice.gstBreakup.sgst_2_5.toFixed(2),
      invoice.gstBreakup.cgst_1_5.toFixed(2),
      invoice.gstBreakup.sgst_1_5.toFixed(2),
      invoice.gstBreakup.igst_28.toFixed(2),
      invoice.gstBreakup.igst_18.toFixed(2),
      invoice.gstBreakup.igst_12.toFixed(2),
      invoice.gstBreakup.igst_5.toFixed(2),
      invoice.gstBreakup.igst_3.toFixed(2),
      invoice.totalAmount.toFixed(2),
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }
}

function formatDateToDDMMYYYY(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export const localStorageService = new LocalStorageService()
