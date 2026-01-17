import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-prisma"

// Helper function to format date as DD-MM-YYYY
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// GET /api/invoices/export - Export all invoices as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") // "sale", "purchase", or null for both

    let invoicesToExport = []
    if (type === "sale") {
      const saleInvoices = await db.getInvoicesByType("sale")
      invoicesToExport = saleInvoices
    } else if (type === "purchase") {
      const purchaseInvoices = await db.getInvoicesByType("purchase")
      invoicesToExport = purchaseInvoices
    } else {
      const allInvoices = await db.getAllInvoicesForExport()
      invoicesToExport = [...allInvoices.sale, ...allInvoices.purchase]
    }

    if (format === "csv") {
      const headers = [
        "TYPE",
        "DATE",
        "INVOICE NO.",
        "PARTY",
        "GST NUMBER", // Added missing GST column
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
        "CANCELLED REASON",
      ]

      const csvRows = invoicesToExport.map((invoice) => [
        invoice.type.toUpperCase(),
        formatDate(invoice.date), // Use DD-MM-YYYY format
        invoice.invoiceNo,
        invoice.party,
        invoice.gstNumber || "", // Include GST number
        invoice.isCancelled ? "CANCELLED" : "ACTIVE",
        invoice.basicAmount.toFixed(2),
        invoice.gstBreakup.cgst_14.toFixed(2),
        invoice.gstBreakup.sgst_14.toFixed(2),
        invoice.gstBreakup.cgst_9.toFixed(2),
        invoice.gstBreakup.sgst_9.toFixed(2),
        invoice.gstBreakup.cgst_6.toFixed(2),
        invoice.gstBreakup.sgst_6.toFixed(2),
        invoice.gstBreakup.cgst_2_5.toFixed(2),
        invoice.gstBreakup.sgst_2_5.toFixed(2),
        invoice.gstBreakup.cgst_1_5.toFixed(2),
        invoice.gstBreakup.sgst_1_5.toFixed(2),
        invoice.gstBreakup.igst_28.toFixed(2),
        invoice.gstBreakup.igst_18.toFixed(2),
        invoice.gstBreakup.igst_12.toFixed(2),
        invoice.gstBreakup.igst_5.toFixed(2),
        invoice.gstBreakup.igst_3.toFixed(2),
        invoice.totalAmount.toFixed(2),
        invoice.cancelledReason || "",
      ])

      const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="GST_Invoices_${formatDate(new Date().toISOString())}.csv"`,
        },
      })
    }

    return NextResponse.json({ success: true, data: invoicesToExport })
  } catch (error) {
    console.error("Error exporting invoices:", error)
    return NextResponse.json({ success: false, error: "Failed to export invoices" }, { status: 500 })
  }
}
