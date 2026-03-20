import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface ImportInvoice {
  type: string
  date: string
  invoiceNo: string
  party: string
  gstNumber?: string
  basicAmount: number
  totalAmount: number
  items: { amount: number; taxType: string; taxRate: number; inclusive: boolean }[]
  gstBreakup: Record<string, number>
}

// POST /api/invoices/import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const invoices: ImportInvoice[] = body.invoices

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json(
        { error: "Request body must contain a non-empty invoices array" },
        { status: 400 }
      )
    }

    const successful: ImportInvoice[] = []
    const failed: { invoice: ImportInvoice; error: string }[] = []

    for (const inv of invoices) {
      try {
        if (!inv.type || !inv.date || !inv.invoiceNo || !inv.party) {
          failed.push({ invoice: inv, error: "Missing required fields" })
          continue
        }

        const invoiceDate = new Date(inv.date)
        const month = invoiceDate.getMonth() + 1
        const year = invoiceDate.getFullYear()

        // Check for duplicate
        const existing = await prisma.invoice.findUnique({
          where: { invoiceNo_type: { invoiceNo: inv.invoiceNo, type: inv.type } },
        })
        if (existing) {
          failed.push({ invoice: inv, error: `Invoice number ${inv.invoiceNo} already exists` })
          continue
        }

        await prisma.invoice.create({
          data: {
            type: inv.type,
            date: invoiceDate,
            month,
            year,
            invoiceNo: inv.invoiceNo,
            party: inv.party,
            gstNumber: inv.gstNumber || null,
            basicAmount: inv.basicAmount || 0,
            totalAmount: inv.totalAmount || 0,
            items: {
              create: (inv.items || []).map((item) => ({
                amount: item.amount,
                taxType: item.taxType,
                taxRate: item.taxRate,
                inclusive: item.inclusive,
              })),
            },
            gstBreakup: inv.gstBreakup
              ? {
                  create: {
                    cgst_14: inv.gstBreakup.cgst_14 || 0,
                    sgst_14: inv.gstBreakup.sgst_14 || 0,
                    cgst_9: inv.gstBreakup.cgst_9 || 0,
                    sgst_9: inv.gstBreakup.sgst_9 || 0,
                    cgst_6: inv.gstBreakup.cgst_6 || 0,
                    sgst_6: inv.gstBreakup.sgst_6 || 0,
                    cgst_2_5: inv.gstBreakup.cgst_2_5 || 0,
                    sgst_2_5: inv.gstBreakup.sgst_2_5 || 0,
                    cgst_1_5: inv.gstBreakup.cgst_1_5 || 0,
                    sgst_1_5: inv.gstBreakup.sgst_1_5 || 0,
                    igst_28: inv.gstBreakup.igst_28 || 0,
                    igst_18: inv.gstBreakup.igst_18 || 0,
                    igst_12: inv.gstBreakup.igst_12 || 0,
                    igst_5: inv.gstBreakup.igst_5 || 0,
                    igst_3: inv.gstBreakup.igst_3 || 0,
                  },
                }
              : undefined,
          },
        })

        successful.push(inv)
      } catch (err) {
        failed.push({
          invoice: inv,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({ successful, failed })
  } catch (error) {
    console.error("POST /api/invoices/import error:", error)
    return NextResponse.json({ error: "Failed to import invoices" }, { status: 500 })
  }
}
