import { PrismaClient } from "@prisma/client"
import type { Invoice, InvoiceType } from "./types"

// Initialize Prisma client
const prisma = new PrismaClient()

export class DatabaseService {
  // Get all invoices by type
  async getInvoicesByType(type: InvoiceType): Promise<Invoice[]> {
    try {
      // First get all invoices of the specified type
      const invoices = await sql`
      SELECT * FROM invoices 
      WHERE type = ${type}
      ORDER BY created_at DESC
    `

      // For each invoice, get its items and GST breakup
      const invoicesWithDetails = await Promise.all(
        invoices.map(async (invoice) => {
          // Get invoice items
          const items = await sql`
          SELECT * FROM invoice_items 
          WHERE invoice_id = ${invoice.id}
          ORDER BY id
        `

          // Get GST breakup
          const gstBreakupResult = await sql`
          SELECT * FROM gst_breakup 
          WHERE invoice_id = ${invoice.id}
          LIMIT 1
        `

          const gstBreakup = gstBreakupResult[0] || {
            cgst_14: 0,
            sgst_14: 0,
            cgst_9: 0,
            sgst_9: 0,
            cgst_6: 0,
            sgst_6: 0,
            cgst_2_5: 0,
            sgst_2_5: 0,
            cgst_1_5: 0,
            sgst_1_5: 0,
            igst_28: 0,
            igst_18: 0,
            igst_12: 0,
            igst_5: 0,
            igst_3: 0,
          }

          return {
            ...invoice,
            items: items.map((item) => ({
              id: item.id.toString(),
              amount: Number.parseFloat(item.amount.toString()),
              taxType: item.tax_type,
              taxRate: item.tax_rate,
              inclusive: item.inclusive,
            })),
            gst_breakup: gstBreakup,
          }
        }),
      )

      return invoicesWithDetails.map(this.mapDatabaseToInvoice)
    } catch (error) {
      console.error("Database error in getInvoicesByType:", error)
      throw new Error(`Failed to fetch ${type} invoices from database`)
    }
  }

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      // Get the invoice
      const invoiceResult = await sql`
      SELECT * FROM invoices 
      WHERE id = ${Number.parseInt(id)}
      LIMIT 1
    `

      if (invoiceResult.length === 0) return null

      const invoice = invoiceResult[0]

      // Get invoice items
      const items = await sql`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ${invoice.id}
      ORDER BY id
    `

      // Get GST breakup
      const gstBreakupResult = await sql`
      SELECT * FROM gst_breakup 
      WHERE invoice_id = ${invoice.id}
      LIMIT 1
    `

      const gstBreakup = gstBreakupResult[0] || {
        cgst_14: 0,
        sgst_14: 0,
        cgst_9: 0,
        sgst_9: 0,
        cgst_6: 0,
        sgst_6: 0,
        cgst_2_5: 0,
        sgst_2_5: 0,
        cgst_1_5: 0,
        sgst_1_5: 0,
        igst_28: 0,
        igst_18: 0,
        igst_12: 0,
        igst_5: 0,
        igst_3: 0,
      }

      const invoiceWithDetails = {
        ...invoice,
        items: items.map((item) => ({
          id: item.id.toString(),
          amount: Number.parseFloat(item.amount.toString()),
          taxType: item.tax_type,
          taxRate: item.tax_rate,
          inclusive: item.inclusive,
        })),
        gst_breakup: gstBreakup,
      }

      return this.mapDatabaseToInvoice(invoiceWithDetails)
    } catch (error) {
      console.error("Database error in getInvoiceById:", error)
      throw new Error("Failed to fetch invoice from database")
    }
  }

  // Create new invoice
  async createInvoice(invoice: Omit<Invoice, "id">): Promise<Invoice> {
    // Start transaction
    const result = await sql.transaction(async (tx) => {
      // Insert invoice
      const [newInvoice] = await tx`
        INSERT INTO invoices (
          type, date, invoice_no, party, gst_number, 
          basic_amount, total_amount, is_cancelled
        )
        VALUES (
          ${invoice.type}, ${invoice.date}, ${invoice.invoiceNo}, 
          ${invoice.party}, ${invoice.gstNumber || null}, 
          ${invoice.basicAmount}, ${invoice.totalAmount}, ${false}
        )
        RETURNING *
      `

      const invoiceId = newInvoice.id

      // Insert invoice items
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          await tx`
            INSERT INTO invoice_items (
              invoice_id, amount, tax_type, tax_rate, inclusive
            )
            VALUES (
              ${invoiceId}, ${item.amount}, ${item.taxType}, 
              ${item.taxRate}, ${item.inclusive}
            )
          `
        }
      }

      // Insert GST breakup
      await tx`
        INSERT INTO gst_breakup (
          invoice_id, cgst_14, sgst_14, cgst_9, sgst_9, cgst_6, sgst_6,
          cgst_2_5, sgst_2_5, cgst_1_5, sgst_1_5, igst_28, igst_18, 
          igst_12, igst_5, igst_3
        )
        VALUES (
          ${invoiceId}, ${invoice.gstBreakup.cgst_14}, ${invoice.gstBreakup.sgst_14},
          ${invoice.gstBreakup.cgst_9}, ${invoice.gstBreakup.sgst_9},
          ${invoice.gstBreakup.cgst_6}, ${invoice.gstBreakup.sgst_6},
          ${invoice.gstBreakup.cgst_2_5}, ${invoice.gstBreakup.sgst_2_5},
          ${invoice.gstBreakup.cgst_1_5}, ${invoice.gstBreakup.sgst_1_5},
          ${invoice.gstBreakup.igst_28}, ${invoice.gstBreakup.igst_18},
          ${invoice.gstBreakup.igst_12}, ${invoice.gstBreakup.igst_5},
          ${invoice.gstBreakup.igst_3}
        )
      `

      return newInvoice
    })

    // Fetch the complete invoice with items and GST breakup
    return (await this.getInvoiceById(result.id.toString())) as Invoice
  }

  // Update invoice
  async updateInvoice(id: string, invoice: Invoice): Promise<Invoice> {
    const result = await sql.transaction(async (tx) => {
      // Update invoice
      const [updatedInvoice] = await tx`
        UPDATE invoices 
        SET 
          date = ${invoice.date},
          invoice_no = ${invoice.invoiceNo},
          party = ${invoice.party},
          gst_number = ${invoice.gstNumber || null},
          basic_amount = ${invoice.basicAmount},
          total_amount = ${invoice.totalAmount},
          is_cancelled = ${invoice.isCancelled || false}
        WHERE id = ${Number.parseInt(id)}
        RETURNING *
      `

      if (!updatedInvoice) {
        throw new Error("Invoice not found")
      }

      const invoiceId = updatedInvoice.id

      // Delete existing items and GST breakup
      await tx`DELETE FROM invoice_items WHERE invoice_id = ${invoiceId}`
      await tx`DELETE FROM gst_breakup WHERE invoice_id = ${invoiceId}`

      // Insert updated items
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          await tx`
            INSERT INTO invoice_items (
              invoice_id, amount, tax_type, tax_rate, inclusive
            )
            VALUES (
              ${invoiceId}, ${item.amount}, ${item.taxType}, 
              ${item.taxRate}, ${item.inclusive}
            )
          `
        }
      }

      // Insert updated GST breakup
      await tx`
        INSERT INTO gst_breakup (
          invoice_id, cgst_14, sgst_14, cgst_9, sgst_9, cgst_6, sgst_6,
          cgst_2_5, sgst_2_5, cgst_1_5, sgst_1_5, igst_28, igst_18, 
          igst_12, igst_5, igst_3
        )
        VALUES (
          ${invoiceId}, ${invoice.gstBreakup.cgst_14}, ${invoice.gstBreakup.sgst_14},
          ${invoice.gstBreakup.cgst_9}, ${invoice.gstBreakup.sgst_9},
          ${invoice.gstBreakup.cgst_6}, ${invoice.gstBreakup.sgst_6},
          ${invoice.gstBreakup.cgst_2_5}, ${invoice.gstBreakup.sgst_2_5},
          ${invoice.gstBreakup.cgst_1_5}, ${invoice.gstBreakup.sgst_1_5},
          ${invoice.gstBreakup.igst_28}, ${invoice.gstBreakup.igst_18},
          ${invoice.gstBreakup.igst_12}, ${invoice.gstBreakup.igst_5},
          ${invoice.gstBreakup.igst_3}
        )
      `

      return updatedInvoice
    })

    return (await this.getInvoiceById(id)) as Invoice
  }

  // Cancel invoice
  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const [result] = await sql`
      UPDATE invoices 
      SET 
        is_cancelled = true,
        cancelled_at = CURRENT_TIMESTAMP,
        cancelled_reason = ${reason || "Invoice cancelled"},
        basic_amount = 0,
        total_amount = 0
      WHERE id = ${Number.parseInt(id)}
      RETURNING *
    `

    if (!result) {
      throw new Error("Invoice not found")
    }

    // Zero out all GST amounts
    await sql`
      UPDATE gst_breakup 
      SET 
        cgst_14 = 0, sgst_14 = 0, cgst_9 = 0, sgst_9 = 0, cgst_6 = 0, sgst_6 = 0,
        cgst_2_5 = 0, sgst_2_5 = 0, cgst_1_5 = 0, sgst_1_5 = 0, igst_28 = 0, 
        igst_18 = 0, igst_12 = 0, igst_5 = 0, igst_3 = 0
      WHERE invoice_id = ${Number.parseInt(id)}
    `

    // Zero out all item amounts
    await sql`
      UPDATE invoice_items 
      SET amount = 0 
      WHERE invoice_id = ${Number.parseInt(id)}
    `

    return (await this.getInvoiceById(id)) as Invoice
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM invoices 
      WHERE id = ${Number.parseInt(id)}
      RETURNING id
    `

    return result.length > 0
  }

  // Check duplicate invoice number
  async checkDuplicateInvoiceNo(invoiceNo: string, type: InvoiceType, excludeId?: string): Promise<boolean> {
    let query
    if (excludeId) {
      query = await sql`
        SELECT id FROM invoices 
        WHERE invoice_no = ${invoiceNo} 
        AND type = ${type} 
        AND id != ${Number.parseInt(excludeId)}
        LIMIT 1
      `
    } else {
      query = await sql`
        SELECT id FROM invoices 
        WHERE invoice_no = ${invoiceNo} 
        AND type = ${type}
        LIMIT 1
      `
    }

    return query.length > 0
  }

  // Get all invoices for export
  async getAllInvoicesForExport(): Promise<{ sale: Invoice[]; purchase: Invoice[] }> {
    const [saleInvoices, purchaseInvoices] = await Promise.all([
      this.getInvoicesByType("sale"),
      this.getInvoicesByType("purchase"),
    ])

    return {
      sale: saleInvoices,
      purchase: purchaseInvoices,
    }
  }

  // Helper method to map database result to Invoice type
  private mapDatabaseToInvoice(row: any): Invoice {
    return {
      id: row.id.toString(),
      type: row.type as InvoiceType,
      date: row.date,
      invoiceNo: row.invoice_no,
      party: row.party,
      gstNumber: row.gst_number,
      items: row.items || [],
      basicAmount: Number.parseFloat(row.basic_amount),
      totalAmount: Number.parseFloat(row.total_amount),
      gstBreakup: {
        cgst_14: Number.parseFloat(row.gst_breakup.cgst_14),
        sgst_14: Number.parseFloat(row.gst_breakup.sgst_14),
        cgst_9: Number.parseFloat(row.gst_breakup.cgst_9),
        sgst_9: Number.parseFloat(row.gst_breakup.sgst_9),
        cgst_6: Number.parseFloat(row.gst_breakup.cgst_6),
        sgst_6: Number.parseFloat(row.gst_breakup.sgst_6),
        cgst_2_5: Number.parseFloat(row.gst_breakup.cgst_2_5),
        sgst_2_5: Number.parseFloat(row.gst_breakup.sgst_2_5),
        cgst_1_5: Number.parseFloat(row.gst_breakup.cgst_1_5),
        sgst_1_5: Number.parseFloat(row.gst_breakup.sgst_1_5),
        igst_28: Number.parseFloat(row.gst_breakup.igst_28),
        igst_18: Number.parseFloat(row.gst_breakup.igst_18),
        igst_12: Number.parseFloat(row.gst_breakup.igst_12),
        igst_5: Number.parseFloat(row.gst_breakup.igst_5),
        igst_3: Number.parseFloat(row.gst_breakup.igst_3),
      },
      isCancelled: row.is_cancelled,
      cancelledAt: row.cancelled_at,
      cancelledReason: row.cancelled_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()
