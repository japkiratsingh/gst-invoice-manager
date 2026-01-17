import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// GET /api/invoices/purchase/[id] - Get specific purchase invoice
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await db.getInvoiceById(params.id)

    if (!invoice || invoice.type !== "purchase") {
      return NextResponse.json({ success: false, error: "Purchase invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error("Error fetching purchase invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch purchase invoice" }, { status: 500 })
  }
}

// PUT /api/invoices/purchase/[id] - Update purchase invoice
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice: Invoice = await request.json()

    // Validate required fields
    if (!invoice.invoiceNo || !invoice.party || !invoice.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate invoice number (excluding current invoice)
    const isDuplicate = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "purchase", params.id)
    if (isDuplicate) {
      return NextResponse.json({ success: false, error: "Invoice number already exists" }, { status: 409 })
    }

    const updatedInvoice = await db.updateInvoice(params.id, invoice)
    return NextResponse.json({ success: true, data: updatedInvoice })
  } catch (error) {
    console.error("Error updating purchase invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to update purchase invoice" }, { status: 500 })
  }
}

// DELETE /api/invoices/purchase/[id] - Delete purchase invoice
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await db.deleteInvoice(params.id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting purchase invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to delete purchase invoice" }, { status: 500 })
  }
}
