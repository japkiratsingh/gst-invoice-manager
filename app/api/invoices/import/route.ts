import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// POST /api/invoices/import - Import multiple invoices
export async function POST(request: NextRequest) {
  try {
    console.log("Importing invoices...")
    const { invoices }: { invoices: Invoice[] } = await request.json()

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ success: false, error: "No invoices provided" }, { status: 400 })
    }

    const results = {
      successful: [] as Invoice[],
      failed: [] as { invoice: Partial<Invoice>; error: string }[],
    }

    // Process each invoice
    for (const invoice of invoices) {
      try {
        // Validate required fields
        if (!invoice.invoiceNo || !invoice.party || !invoice.date || !invoice.type) {
          results.failed.push({
            invoice,
            error: "Missing required fields",
          })
          continue
        }

        // Check for duplicate invoice number
        const isDuplicate = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, invoice.type)
        if (isDuplicate) {
          results.failed.push({
            invoice,
            error: `Invoice number ${invoice.invoiceNo} already exists`,
          })
          continue
        }

        // Create the invoice
        const newInvoice = await db.createInvoice(invoice)
        results.successful.push(newInvoice)
      } catch (error) {
        console.error("Error importing invoice:", error)
        results.failed.push({
          invoice,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`Import completed: ${results.successful.length} successful, ${results.failed.length} failed`)

    return NextResponse.json({
      success: true,
      data: results,
      message: `Imported ${results.successful.length} invoices successfully. ${results.failed.length} failed.`,
    })
  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
