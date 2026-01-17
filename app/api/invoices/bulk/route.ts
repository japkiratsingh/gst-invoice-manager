import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"
import type { Invoice } from "@/lib/types"

// POST /api/invoices/bulk - Bulk operations on invoices
export async function POST(request: NextRequest) {
  try {
    const { action, invoiceIds, data }: { 
      action: "delete" | "cancel" | "update"; 
      invoiceIds: string[]; 
      data?: any 
    } = await request.json()

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ success: false, error: "No invoice IDs provided" }, { status: 400 })
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    }

    for (const id of invoiceIds) {
      try {
        switch (action) {
          case "delete":
            const deleted = await db.deleteInvoice(id)
            if (deleted) {
              results.successful.push(id)
            } else {
              results.failed.push({ id, error: "Invoice not found" })
            }
            break

          case "cancel":
            const reason = data?.reason || "Bulk cancellation"
            await db.cancelInvoice(id, reason)
            results.successful.push(id)
            break

          case "update":
            if (!data) {
              results.failed.push({ id, error: "Update data not provided" })
              continue
            }
            const updatedInvoice = await db.updateInvoice(id, data)
            results.successful.push(id)
            break

          default:
            results.failed.push({ id, error: "Invalid action" })
        }
      } catch (error) {
        console.error(`Error processing invoice ${id}:`, error)
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Bulk ${action} completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    })
  } catch (error) {
    console.error("Error in bulk operation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform bulk operation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
