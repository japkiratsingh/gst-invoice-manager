import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// POST /api/migrate - Migrate data from localStorage to database
export async function POST(request: NextRequest) {
  try {
    const { saleInvoices, purchaseInvoices }: { 
      saleInvoices: Invoice[]; 
      purchaseInvoices: Invoice[] 
    } = await request.json()

    const results = {
      sale: { successful: 0, failed: 0, errors: [] as string[] },
      purchase: { successful: 0, failed: 0, errors: [] as string[] },
    }

    // Migrate sale invoices
    for (const invoice of saleInvoices || []) {
      try {
        // Check if invoice already exists
        const exists = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "sale")
        if (exists) {
          results.sale.failed++
          results.sale.errors.push(`Sale invoice ${invoice.invoiceNo} already exists`)
          continue
        }

        // Ensure invoice has correct type
        invoice.type = "sale"
        await db.createInvoice(invoice)
        results.sale.successful++
      } catch (error) {
        results.sale.failed++
        results.sale.errors.push(
          `Sale invoice ${invoice.invoiceNo}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    }

    // Migrate purchase invoices
    for (const invoice of purchaseInvoices || []) {
      try {
        // Check if invoice already exists
        const exists = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "purchase")
        if (exists) {
          results.purchase.failed++
          results.purchase.errors.push(`Purchase invoice ${invoice.invoiceNo} already exists`)
          continue
        }

        // Ensure invoice has correct type
        invoice.type = "purchase"
        await db.createInvoice(invoice)
        results.purchase.successful++
      } catch (error) {
        results.purchase.failed++
        results.purchase.errors.push(
          `Purchase invoice ${invoice.invoiceNo}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    }

    const totalSuccessful = results.sale.successful + results.purchase.successful
    const totalFailed = results.sale.failed + results.purchase.failed

    return NextResponse.json({
      success: true,
      data: results,
      message: `Migration completed: ${totalSuccessful} successful, ${totalFailed} failed`,
    })
  } catch (error) {
    console.error("Error during migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to migrate data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
