import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/invoices/months — returns list of all months that have invoice data
export async function GET() {
  try {
    const months = await prisma.invoice.findMany({
      select: { month: true, year: true },
      distinct: ["month", "year"],
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    // Also include counts per month/type
    const monthsWithCounts = await Promise.all(
      months.map(async ({ month, year }) => {
        const [saleCount, purchaseCount] = await Promise.all([
          prisma.invoice.count({ where: { month, year, type: "sale" } }),
          prisma.invoice.count({ where: { month, year, type: "purchase" } }),
        ])
        return { month, year, saleCount, purchaseCount }
      })
    )

    return NextResponse.json(monthsWithCounts)
  } catch (error) {
    console.error("GET /api/invoices/months error:", error)
    return NextResponse.json({ error: "Failed to fetch months" }, { status: 500 })
  }
}
