import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// GET /api/invoices/export?type=sale&month=1&year=2026
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
      include: { gstBreakup: true },
      orderBy: { date: "asc" },
    })

    const headers = [
      "TYPE",
      "DATE",
      "INVOICE NO.",
      "PARTY",
      "GST NUMBER",
      "STATUS",
      "BASIC AMOUNT",
      "CGST (14%)",
      "SGST (14%)",
      "CGST (9%)",
      "SGST (9%)",
      "CGST (6%)",
      "SGST (6%)",
      "CGST (2.5%)",
      "SGST (2.5%)",
      "CGST (1.5%)",
      "SGST (1.5%)",
      "IGST (28%)",
      "IGST (18%)",
      "IGST (12%)",
      "IGST (5%)",
      "IGST (3%)",
      "TOTAL AMOUNT",
    ]

    const rows = invoices.map((invoice) => {
      const b = invoice.gstBreakup
      return [
        invoice.type.toUpperCase(),
        formatDateToDDMMYYYY(new Date(invoice.date)),
        invoice.invoiceNo,
        invoice.party,
        invoice.gstNumber || "",
        invoice.isCancelled ? "CANCELLED" : "ACTIVE",
        invoice.basicAmount.toFixed(2),
        (b?.cgst_14 || 0).toFixed(2),
        (b?.sgst_14 || 0).toFixed(2),
        (b?.cgst_9 || 0).toFixed(2),
        (b?.sgst_9 || 0).toFixed(2),
        (b?.cgst_6 || 0).toFixed(2),
        (b?.sgst_6 || 0).toFixed(2),
        (b?.cgst_2_5 || 0).toFixed(2),
        (b?.sgst_2_5 || 0).toFixed(2),
        (b?.cgst_1_5 || 0).toFixed(2),
        (b?.sgst_1_5 || 0).toFixed(2),
        (b?.igst_28 || 0).toFixed(2),
        (b?.igst_18 || 0).toFixed(2),
        (b?.igst_12 || 0).toFixed(2),
        (b?.igst_5 || 0).toFixed(2),
        (b?.igst_3 || 0).toFixed(2),
        invoice.totalAmount.toFixed(2),
      ]
    })

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoices_export.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/invoices/export error:", error)
    return NextResponse.json({ error: "Failed to export invoices" }, { status: 500 })
  }
}
