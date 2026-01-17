import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"

// GET /api/invoices/search - Search invoices with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") // Search query
    const type = searchParams.get("type") // "sale", "purchase", or null for both
    const status = searchParams.get("status") // "active", "cancelled", or null for both
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const gstNumber = searchParams.get("gstNumber")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get all invoices first
    let saleInvoices:any[] = []
    let purchaseInvoices:any[] = []

    if (type === "sale" || !type) {
      saleInvoices = await db.getInvoicesByType("sale")
    }
    if (type === "purchase" || !type) {
      purchaseInvoices = await db.getInvoicesByType("purchase")
    }

    let allInvoices = [...saleInvoices, ...purchaseInvoices]

    // Apply filters
    if (query) {
      const searchQuery = query.toLowerCase()
      allInvoices = allInvoices.filter(invoice => 
        invoice.invoiceNo.toLowerCase().includes(searchQuery) ||
        invoice.party.toLowerCase().includes(searchQuery) ||
        (invoice.gstNumber && invoice.gstNumber.toLowerCase().includes(searchQuery))
      )
    }

    if (status === "active") {
      allInvoices = allInvoices.filter(invoice => !invoice.isCancelled)
    } else if (status === "cancelled") {
      allInvoices = allInvoices.filter(invoice => invoice.isCancelled)
    }

    if (fromDate) {
      const from = new Date(fromDate)
      allInvoices = allInvoices.filter(invoice => new Date(invoice.date) >= from)
    }

    if (toDate) {
      const to = new Date(toDate)
      allInvoices = allInvoices.filter(invoice => new Date(invoice.date) <= to)
    }

    if (minAmount) {
      const min = parseFloat(minAmount)
      allInvoices = allInvoices.filter(invoice => invoice.totalAmount >= min)
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount)
      allInvoices = allInvoices.filter(invoice => invoice.totalAmount <= max)
    }

    if (gstNumber) {
      allInvoices = allInvoices.filter(invoice => 
        invoice.gstNumber && invoice.gstNumber.toLowerCase().includes(gstNumber.toLowerCase())
      )
    }

    // Sort by date (newest first)
    allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Pagination
    const totalCount = allInvoices.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedInvoices = allInvoices.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        invoices: paginatedInvoices,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          query,
          type,
          status,
          fromDate,
          toDate,
          minAmount,
          maxAmount,
          gstNumber,
        },
      },
    })
  } catch (error) {
    console.error("Error searching invoices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
