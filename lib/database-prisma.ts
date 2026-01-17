import { PrismaClient } from "@prisma/client"
import type { Invoice, InvoiceType } from "./types"

// Initialize Prisma client
const prisma = new PrismaClient()

export class DatabaseService {
  // Get all invoices by type
  async getInvoicesByType(type: InvoiceType): Promise<Invoice[]> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { type },
        include: {
          items: true,
          gstBreakup: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return invoices.map(this.mapPrismaToInvoice)
    } catch (error) {
      console.error("Database error in getInvoicesByType:", error)
      throw new Error(`Failed to fetch ${type} invoices from database`)
    }
  }

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(id) },
        include: {
          items: true,
          gstBreakup: true
        }
      })

      if (!invoice) return null
      return this.mapPrismaToInvoice(invoice)
    } catch (error) {
      console.error("Database error in getInvoiceById:", error)
      throw new Error("Failed to fetch invoice from database")
    }
  }

  // Create new invoice
  async createInvoice(invoice: Omit<Invoice, "id">): Promise<Invoice> {
    try {
      const newInvoice = await prisma.invoice.create({
        data: {
          type: invoice.type,
          date: invoice.date,
          invoiceNo: invoice.invoiceNo,
          party: invoice.party,
          gstNumber: invoice.gstNumber,
          basicAmount: invoice.basicAmount,
          totalAmount: invoice.totalAmount,
          isCancelled: invoice.isCancelled || false,
          items: {
            create: invoice.items.map(item => ({
              amount: item.amount,
              taxType: item.taxType,
              taxRate: item.taxRate,
              inclusive: item.inclusive
            }))
          },
          gstBreakup: {
            create: {
              cgst_14: invoice.gstBreakup.cgst_14,
              sgst_14: invoice.gstBreakup.sgst_14,
              cgst_9: invoice.gstBreakup.cgst_9,
              sgst_9: invoice.gstBreakup.sgst_9,
              cgst_6: invoice.gstBreakup.cgst_6,
              sgst_6: invoice.gstBreakup.sgst_6,
              cgst_2_5: invoice.gstBreakup.cgst_2_5,
              sgst_2_5: invoice.gstBreakup.sgst_2_5,
              cgst_1_5: invoice.gstBreakup.cgst_1_5,
              sgst_1_5: invoice.gstBreakup.sgst_1_5,
              igst_28: invoice.gstBreakup.igst_28,
              igst_18: invoice.gstBreakup.igst_18,
              igst_12: invoice.gstBreakup.igst_12,
              igst_5: invoice.gstBreakup.igst_5,
              igst_3: invoice.gstBreakup.igst_3
            })
          }
        },
        include: {
          items: true,
          gstBreakup: true
        }
      })

      return this.mapPrismaToInvoice(newInvoice)
    } catch (error) {
      console.error("Database error in createInvoice:", error)
      throw new Error("Failed to create invoice")
    }
  }

  // Update invoice
  async updateInvoice(id: string, invoice: Invoice): Promise<Invoice> {
    try {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: {
          type: invoice.type,
          date: invoice.date,
          invoiceNo: invoice.invoiceNo,
          party: invoice.party,
          gstNumber: invoice.gstNumber,
          basicAmount: invoice.basicAmount,
          totalAmount: invoice.totalAmount,
          isCancelled: invoice.isCancelled || false,
          items: {
            deleteMany: {},
            create: invoice.items.map(item => ({
              amount: item.amount,
              taxType: item.taxType,
              taxRate: item.taxRate,
              inclusive: item.inclusive
            }))
          },
          gstBreakup: {
            upsert: {
              create: {
                cgst_14: invoice.gstBreakup.cgst_14,
                sgst_14: invoice.gstBreakup.sgst_14,
                cgst_9: invoice.gstBreakup.cgst_9,
                sgst_9: invoice.gstBreakup.sgst_9,
                cgst_6: invoice.gstBreakup.cgst_6,
                sgst_6: invoice.gstBreakup.sgst_6,
                cgst_2_5: invoice.gstBreakup.cgst_2_5,
                sgst_2_5: invoice.gstBreakup.sgst_2_5,
                cgst_1_5: invoice.gstBreakup.cgst_1_5,
                sgst_1_5: invoice.gstBreakup.sgst_1_5,
                igst_28: invoice.gstBreakup.igst_28,
                igst_18: invoice.gstBreakup.igst_18,
                igst_12: invoice.gstBreakup.igst_12,
                igst_5: invoice.gstBreakup.igst_5,
                igst_3: invoice.gstBreakup.igst_3
              },
              update: {
                cgst_14: invoice.gstBreakup.cgst_14,
                sgst_14: invoice.gstBreakup.sgst_14,
                cgst_9: invoice.gstBreakup.cgst_9,
                sgst_9: invoice.gstBreakup.sgst_9,
                cgst_6: invoice.gstBreakup.cgst_6,
                sgst_6: invoice.gstBreakup.sgst_6,
                cgst_2_5: invoice.gstBreakup.cgst_2_5,
                sgst_2_5: invoice.gstBreakup.sgst_2_5,
                cgst_1_5: invoice.gstBreakup.cgst_1_5,
                sgst_1_5: invoice.gstBreakup.sgst_1_5,
                igst_28: invoice.gstBreakup.igst_28,
                igst_18: invoice.gstBreakup.igst_18,
                igst_12: invoice.gstBreakup.igst_12,
                igst_5: invoice.gstBreakup.igst_5,
                igst_3: invoice.gstBreakup.igst_3
              }
            }
          }
        },
        include: {
          items: true,
          gstBreakup: true
        }
      })

      return this.mapPrismaToInvoice(updatedInvoice)
    } catch (error) {
      console.error("Database error in updateInvoice:", error)
      throw new Error("Failed to update invoice")
    }
  }

  // Cancel invoice
  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    try {
      const cancelledInvoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: {
          isCancelled: true,
          cancelledAt: new Date().toISOString(),
          cancelledReason: reason || "Invoice cancelled",
          basicAmount: 0,
          totalAmount: 0
        },
        include: {
          items: true,
          gstBreakup: true
        }
      })

      // Zero out GST amounts
      await prisma.gSTBreakup.updateMany({
        where: { invoiceId: parseInt(id) },
        data: {
          cgst_14: 0, sgst_14: 0, cgst_9: 0, sgst_9: 0, cgst_6: 0, sgst_6: 0,
          cgst_2_5: 0, sgst_2_5: 0, cgst_1_5: 0, sgst_1_5: 0, igst_28: 0,
          igst_18: 0, igst_12: 0, igst_5: 0, igst_3: 0
        }
      })

      // Zero out item amounts
      await prisma.invoiceItem.updateMany({
        where: { invoiceId: parseInt(id) },
        data: { amount: 0 }
      })

      return this.mapPrismaToInvoice(cancelledInvoice)
    } catch (error) {
      console.error("Database error in cancelInvoice:", error)
      throw new Error("Failed to cancel invoice")
    }
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      await prisma.invoice.delete({
        where: { id: parseInt(id) }
      })
      return true
    } catch (error) {
      console.error("Database error in deleteInvoice:", error)
      return false
    }
  }

  // Check duplicate invoice number
  async checkDuplicateInvoiceNo(invoiceNo: string, type: InvoiceType, excludeId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        invoiceNo,
        type
      }
      
      if (excludeId) {
        whereClause.id = { not: parseInt(excludeId) }
      }

      const existing = await prisma.invoice.findFirst({
        where: whereClause
      })

      return !!existing
    } catch (error) {
      console.error("Database error in checkDuplicateInvoiceNo:", error)
      return false
    }
  }

  // Get all invoices for export
  async getAllInvoicesForExport(): Promise<{ sale: Invoice[]; purchase: Invoice[] }> {
    try {
      const [saleInvoices, purchaseInvoices] = await Promise.all([
        this.getInvoicesByType("sale"),
        this.getInvoicesByType("purchase"),
      ])

      return {
        sale: saleInvoices,
        purchase: purchaseInvoices,
      }
    } catch (error) {
      console.error("Database error in getAllInvoicesForExport:", error)
      throw new Error("Failed to fetch invoices for export")
    }
  }

  // Helper method to map Prisma result to Invoice type
  private mapPrismaToInvoice(row: any): Invoice {
    return {
      id: row.id.toString(),
      type: row.type as InvoiceType,
      date: row.date,
      invoiceNo: row.invoiceNo,
      party: row.party,
      gstNumber: row.gstNumber,
      items: row.items?.map((item: any) => ({
        id: item.id.toString(),
        amount: item.amount,
        taxType: item.taxType,
        taxRate: item.taxRate,
        inclusive: item.inclusive,
      })) || [],
      basicAmount: row.basicAmount,
      totalAmount: row.totalAmount,
      gstBreakup: row.gstBreakup ? {
        cgst_14: row.gstBreakup.cgst_14,
        sgst_14: row.gstBreakup.sgst_14,
        cgst_9: row.gstBreakup.cgst_9,
        sgst_9: row.gstBreakup.sgst_9,
        cgst_6: row.gstBreakup.cgst_6,
        sgst_6: row.gstBreakup.sgst_6,
        cgst_2_5: row.gstBreakup.cgst_2_5,
        sgst_2_5: row.gstBreakup.sgst_2_5,
        cgst_1_5: row.gstBreakup.cgst_1_5,
        sgst_1_5: row.gstBreakup.sgst_1_5,
        igst_28: row.gstBreakup.igst_28,
        igst_18: row.gstBreakup.igst_18,
        igst_12: row.gstBreakup.igst_12,
        igst_5: row.gstBreakup.igst_5,
        igst_3: row.gstBreakup.igst_3,
      } : {
        cgst_14: 0, sgst_14: 0, cgst_9: 0, sgst_9: 0, cgst_6: 0, sgst_6: 0,
        cgst_2_5: 0, sgst_2_5: 0, cgst_1_5: 0, sgst_1_5: 0, igst_28: 0,
        igst_18: 0, igst_12: 0, igst_5: 0, igst_3: 0
      },
      isCancelled: row.isCancelled,
      cancelledAt: row.cancelledAt,
      cancelledReason: row.cancelledReason,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()
