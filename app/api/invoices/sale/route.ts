import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// GET /api/invoices/sale - Get all sale invoices
export async function GET() {
  try {
    console.log("Fetching sale invoices...")
    const invoices = await db.getInvoicesByType("sale")
    console.log(`Found ${invoices.length} sale invoices`)
    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error("Error fetching sale invoices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sale invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST /api/invoices/sale - Create new sale invoice
export async function POST(request: NextRequest) {
  try {
    console.log("Creating new sale invoice...")
    const invoice: Invoice = await request.json()

    // Validate required fields
    if (!invoice.invoiceNo || !invoice.party || !invoice.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate invoice number
    const isDuplicate = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "sale")
    if (isDuplicate) {
      return NextResponse.json({ success: false, error: "Invoice number already exists" }, { status: 409 })
    }

    // Set invoice type
    invoice.type = "sale"

    const newInvoice = await db.createInvoice(invoice)
    console.log("Sale invoice created successfully:", newInvoice.id)
    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 })
  } catch (error) {
    console.error("Error creating sale invoice:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create sale invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
