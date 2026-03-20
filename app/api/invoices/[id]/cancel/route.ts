import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/invoices/[id]/cancel
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { gstBreakup: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (existing.isCancelled) {
      return NextResponse.json({ error: "Invoice is already cancelled" }, { status: 400 })
    }

    // Zero out all amounts and mark as cancelled
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledReason: "Invoice cancelled by user",
        basicAmount: 0,
        totalAmount: 0,
        gstBreakup: existing.gstBreakup
          ? {
              update: {
                cgst_14: 0,
                sgst_14: 0,
                cgst_9: 0,
                sgst_9: 0,
                cgst_6: 0,
                sgst_6: 0,
                cgst_2_5: 0,
                sgst_2_5: 0,
                cgst_1_5: 0,
                sgst_1_5: 0,
                igst_28: 0,
                igst_18: 0,
                igst_12: 0,
                igst_5: 0,
                igst_3: 0,
              },
            }
          : undefined,
      },
      include: { items: true, gstBreakup: true },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("PATCH /api/invoices/[id]/cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 })
  }
}
