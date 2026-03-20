import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const MONTH_NAMES = [
  "", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
]

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

    const isPurchase = type === "purchase"

    const headers = [
      "DATE",
      "INVOICE NO.",
      "PARTY",
      ...(isPurchase ? [] : ["GST NUMBER"]),
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
        formatDateToDDMMYYYY(new Date(invoice.date)),
        invoice.invoiceNo,
        invoice.party,
        ...(isPurchase ? [] : [invoice.gstNumber || ""]),
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

    // Compute totals row
    const totals = invoices.reduce(
      (acc, inv) => {
        const b = inv.gstBreakup
        return {
          basicAmount: acc.basicAmount + inv.basicAmount,
          totalAmount: acc.totalAmount + inv.totalAmount,
          cgst_14: acc.cgst_14 + (b?.cgst_14 || 0),
          sgst_14: acc.sgst_14 + (b?.sgst_14 || 0),
          cgst_9: acc.cgst_9 + (b?.cgst_9 || 0),
          sgst_9: acc.sgst_9 + (b?.sgst_9 || 0),
          cgst_6: acc.cgst_6 + (b?.cgst_6 || 0),
          sgst_6: acc.sgst_6 + (b?.sgst_6 || 0),
          cgst_2_5: acc.cgst_2_5 + (b?.cgst_2_5 || 0),
          sgst_2_5: acc.sgst_2_5 + (b?.sgst_2_5 || 0),
          cgst_1_5: acc.cgst_1_5 + (b?.cgst_1_5 || 0),
          sgst_1_5: acc.sgst_1_5 + (b?.sgst_1_5 || 0),
          igst_28: acc.igst_28 + (b?.igst_28 || 0),
          igst_18: acc.igst_18 + (b?.igst_18 || 0),
          igst_12: acc.igst_12 + (b?.igst_12 || 0),
          igst_5: acc.igst_5 + (b?.igst_5 || 0),
          igst_3: acc.igst_3 + (b?.igst_3 || 0),
        }
      },
      {
        basicAmount: 0, totalAmount: 0,
        cgst_14: 0, sgst_14: 0, cgst_9: 0, sgst_9: 0,
        cgst_6: 0, sgst_6: 0, cgst_2_5: 0, sgst_2_5: 0,
        cgst_1_5: 0, sgst_1_5: 0, igst_28: 0, igst_18: 0,
        igst_12: 0, igst_5: 0, igst_3: 0,
      }
    )

    // Month name for the totals row (from query param or first invoice)
    const monthName = month
      ? MONTH_NAMES[parseInt(month)] || ""
      : invoices.length > 0
        ? MONTH_NAMES[new Date(invoices[0].date).getMonth() + 1] || ""
        : ""

    const totalsRow = [
      monthName,
      "",
      "TOTAL",
      ...(isPurchase ? [] : [""]),
      totals.basicAmount.toFixed(2),
      totals.cgst_14.toFixed(2),
      totals.sgst_14.toFixed(2),
      totals.cgst_9.toFixed(2),
      totals.sgst_9.toFixed(2),
      totals.cgst_6.toFixed(2),
      totals.sgst_6.toFixed(2),
      totals.cgst_2_5.toFixed(2),
      totals.sgst_2_5.toFixed(2),
      totals.cgst_1_5.toFixed(2),
      totals.sgst_1_5.toFixed(2),
      totals.igst_28.toFixed(2),
      totals.igst_18.toFixed(2),
      totals.igst_12.toFixed(2),
      totals.igst_5.toFixed(2),
      totals.igst_3.toFixed(2),
      totals.totalAmount.toFixed(2),
    ]

    // Build CSV with empty row gaps: header → empty row → data rows → empty row → totals
    const emptyRow = headers.map(() => "").join(",")
    const csv = [
      headers.join(","),
      emptyRow,
      ...rows.map((row) => row.join(",")),
      emptyRow,
      totalsRow.join(","),
    ].join("\n")

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
