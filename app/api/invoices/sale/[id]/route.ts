import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// GET /api/invoices/sale/[id] - Get specific sale invoice
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice = await db.getInvoiceById(params.id)

    if (!invoice || invoice.type !== "sale") {
      return NextResponse.json({ success: false, error: "Sale invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error("Error fetching sale invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch sale invoice" }, { status: 500 })
  }
}

// PUT /api/invoices/sale/[id] - Update sale invoice
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoice: Invoice = await request.json()

    // Validate required fields
    if (!invoice.invoiceNo || !invoice.party || !invoice.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate invoice number (excluding current invoice)
    const isDuplicate = await db.checkDuplicateInvoiceNo(invoice.invoiceNo, "sale", params.id)
    if (isDuplicate) {
      return NextResponse.json({ success: false, error: "Invoice number already exists" }, { status: 409 })
    }

    const updatedInvoice = await db.updateInvoice(params.id, invoice)
    return NextResponse.json({ success: true, data: updatedInvoice })
  } catch (error) {
    console.error("Error updating sale invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to update sale invoice" }, { status: 500 })
  }
}

// DELETE /api/invoices/sale/[id] - Delete sale invoice
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await db.deleteInvoice(params.id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting sale invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to delete sale invoice" }, { status: 500 })
  }
}
