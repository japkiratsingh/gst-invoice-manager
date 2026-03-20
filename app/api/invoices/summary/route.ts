import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/invoices/summary?month=1&year=2026&type=sale
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

    const [totalCount, activeAgg, cancelledCount] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where: { ...where, isCancelled: false },
        _sum: { basicAmount: true, totalAmount: true },
        _count: true,
      }),
      prisma.invoice.count({ where: { ...where, isCancelled: true } }),
    ])

    const basicAmount = activeAgg._sum.basicAmount || 0
    const totalAmount = activeAgg._sum.totalAmount || 0

    return NextResponse.json({
      totalCount,
      activeCount: activeAgg._count,
      cancelledCount,
      basicAmount,
      totalAmount,
      totalTax: totalAmount - basicAmount,
    })
  } catch (error) {
    console.error("GET /api/invoices/summary error:", error)
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
  }
}
