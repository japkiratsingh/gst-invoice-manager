import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"

// POST /api/invoices/purchase/[id]/cancel - Cancel purchase invoice
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || "Invoice cancelled by user"

    const cancelledInvoice = await db.cancelInvoice(params.id, reason)

    if (cancelledInvoice.type !== "purchase") {
      return NextResponse.json({ success: false, error: "Purchase invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: cancelledInvoice,
      message: "Invoice cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling purchase invoice:", error)
    return NextResponse.json({ success: false, error: "Failed to cancel purchase invoice" }, { status: 500 })
  }
}
