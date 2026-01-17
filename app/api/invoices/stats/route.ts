import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"

// GET /api/invoices/stats - Get invoice statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "sale", "purchase", or null for both
    const period = searchParams.get("period") // "month", "year", or null for all

    let saleInvoices: any[] = []
    let purchaseInvoices: any[] = []

    if (type === "sale" || !type) {
      saleInvoices = await db.getInvoicesByType("sale")
    }
    if (type === "purchase" || !type) {
      purchaseInvoices = await db.getInvoicesByType("purchase")
    }

    // Filter by period if specified
    const now = new Date()
    let startDate: Date | null = null

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    const filterByDate = (invoices: any[]) => {
      if (!startDate) return invoices
      return invoices.filter(invoice => new Date(invoice.date) >= startDate!)
    }

    const filteredSaleInvoices = filterByDate(saleInvoices)
    const filteredPurchaseInvoices = filterByDate(purchaseInvoices)

    // Calculate statistics
    const calculateStats = (invoices: any[]) => {
      const activeInvoices = invoices.filter(inv => !inv.isCancelled)
      const cancelledInvoices = invoices.filter(inv => inv.isCancelled)

      const totalBasicAmount = activeInvoices.reduce((sum, inv) => sum + inv.basicAmount, 0)
      const totalAmount = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const totalTax = totalAmount - totalBasicAmount

      // Calculate GST breakdown
      const gstBreakdown = {
        cgst_14: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.cgst_14, 0),
        sgst_14: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.sgst_14, 0),
        cgst_9: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.cgst_9, 0),
        sgst_9: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.sgst_9, 0),
        cgst_6: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.cgst_6, 0),
        sgst_6: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.sgst_6, 0),
        cgst_2_5: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.cgst_2_5, 0),
        sgst_2_5: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.sgst_2_5, 0),
        cgst_1_5: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.cgst_1_5, 0),
        sgst_1_5: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.sgst_1_5, 0),
        igst_28: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.igst_28, 0),
        igst_18: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.igst_18, 0),
        igst_12: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.igst_12, 0),
        igst_5: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.igst_5, 0),
        igst_3: activeInvoices.reduce((sum, inv) => sum + inv.gstBreakup.igst_3, 0),
      }

      return {
        total: invoices.length,
        active: activeInvoices.length,
        cancelled: cancelledInvoices.length,
        totalBasicAmount,
        totalAmount,
        totalTax,
        gstBreakdown,
      }
    }

    const saleStats = calculateStats(filteredSaleInvoices)
    const purchaseStats = calculateStats(filteredPurchaseInvoices)

    const stats = {
      period: period || "all",
      sale: saleStats,
      purchase: purchaseStats,
      combined: {
        total: saleStats.total + purchaseStats.total,
        active: saleStats.active + purchaseStats.active,
        cancelled: saleStats.cancelled + purchaseStats.cancelled,
        totalBasicAmount: saleStats.totalBasicAmount + purchaseStats.totalBasicAmount,
        totalAmount: saleStats.totalAmount + purchaseStats.totalAmount,
        totalTax: saleStats.totalTax + purchaseStats.totalTax,
        netAmount: saleStats.totalAmount - purchaseStats.totalAmount, // Sale - Purchase
      },
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error fetching invoice statistics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
