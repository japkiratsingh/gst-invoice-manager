import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/invoices/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, gstBreakup: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

// PUT /api/invoices/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, date, invoiceNo, party, gstNumber, basicAmount, totalAmount, items, gstBreakup } = body

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check for duplicate invoice number (excluding current invoice)
    if (invoiceNo) {
      const duplicate = await prisma.invoice.findFirst({
        where: {
          invoiceNo,
          type: type || existing.type,
          id: { not: id },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: `Invoice number ${invoiceNo} already exists` },
          { status: 409 }
        )
      }
    }

    const invoiceDate = date ? new Date(date) : existing.date
    const month = invoiceDate.getMonth() + 1
    const year = invoiceDate.getFullYear()

    // Delete old items and breakup, then recreate
    await prisma.taxItem.deleteMany({ where: { invoiceId: id } })
    await prisma.gSTBreakup.deleteMany({ where: { invoiceId: id } })

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        type: type || existing.type,
        date: invoiceDate,
        month,
        year,
        invoiceNo: invoiceNo || existing.invoiceNo,
        party: party || existing.party,
        gstNumber: gstNumber !== undefined ? (gstNumber || null) : existing.gstNumber,
        basicAmount: basicAmount ?? existing.basicAmount,
        totalAmount: totalAmount ?? existing.totalAmount,
        items: {
          create: (items || []).map((item: { amount: number; taxType: string; taxRate: number; inclusive: boolean }) => ({
            amount: item.amount,
            taxType: item.taxType,
            taxRate: item.taxRate,
            inclusive: item.inclusive,
          })),
        },
        gstBreakup: gstBreakup
          ? {
              create: {
                cgst_14: gstBreakup.cgst_14 || 0,
                sgst_14: gstBreakup.sgst_14 || 0,
                cgst_9: gstBreakup.cgst_9 || 0,
                sgst_9: gstBreakup.sgst_9 || 0,
                cgst_6: gstBreakup.cgst_6 || 0,
                sgst_6: gstBreakup.sgst_6 || 0,
                cgst_2_5: gstBreakup.cgst_2_5 || 0,
                sgst_2_5: gstBreakup.sgst_2_5 || 0,
                cgst_1_5: gstBreakup.cgst_1_5 || 0,
                sgst_1_5: gstBreakup.sgst_1_5 || 0,
                igst_28: gstBreakup.igst_28 || 0,
                igst_18: gstBreakup.igst_18 || 0,
                igst_12: gstBreakup.igst_12 || 0,
                igst_5: gstBreakup.igst_5 || 0,
                igst_3: gstBreakup.igst_3 || 0,
              },
            }
          : undefined,
      },
      include: { items: true, gstBreakup: true },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("PUT /api/invoices/[id] error:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/invoices/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
