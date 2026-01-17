import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// GET /api/invoices/purchase - Get all purchase invoices
export async function GET() {
  try {
    console.log("Fetching purchase invoices...")
    const invoices = await db.getInvoicesByType("purchase")
    console.log(`Found ${invoices.length} purchase invoices`)
    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    console.error("Error fetching purchase invoices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchase invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST /api/invoices/purchase - Create new purchase invoice
export async function POST(request: NextRequest) {
  try {
    console.log("Creating new purchase invoice...")
    const invoice: Invoice = await request.json()

    // Validate required fields
    if (!invoice.invoiceNo || !invoice.party || !invoice.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate invoice number
    const isDuplicate = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "purchase")
    if (isDuplicate) {
      return NextResponse.json({ success: false, error: "Invoice number already exists" }, { status: 409 })
    }

    // Set invoice type
    invoice.type = "purchase"

    const newInvoice = await db.createInvoice(invoice)
    console.log("Purchase invoice created successfully:", newInvoice.id)
    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 })
  } catch (error) {
    console.error("Error creating purchase invoice:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create purchase invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
