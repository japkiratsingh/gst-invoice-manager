import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/invoices?type=sale&month=1&year=2026
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        gstBreakup: true,
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("GET /api/invoices error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, date, invoiceNo, party, gstNumber, basicAmount, totalAmount, items, gstBreakup } = body

    if (!type || !date || !invoiceNo || !party) {
      return NextResponse.json(
        { error: "Missing required fields: type, date, invoiceNo, party" },
        { status: 400 }
      )
    }

    const invoiceDate = new Date(date)
    const month = invoiceDate.getMonth() + 1
    const year = invoiceDate.getFullYear()

    // Check for duplicate invoice number within the same type
    const existing = await prisma.invoice.findUnique({
      where: { invoiceNo_type: { invoiceNo, type } },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Invoice number ${invoiceNo} already exists for ${type}` },
        { status: 409 }
      )
    }

    const invoice = await prisma.invoice.create({
      data: {
        type,
        date: invoiceDate,
        month,
        year,
        invoiceNo,
        party,
        gstNumber: gstNumber || null,
        basicAmount,
        totalAmount,
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
      include: {
        items: true,
        gstBreakup: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("POST /api/invoices error:", error)
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    )
  }
}
