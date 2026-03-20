"use client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceType } from "@/lib/types"

interface FrontendExportProps {
  invoiceType?: InvoiceType
  selectedMonth?: number | null
  selectedYear?: number | null
  className?: string
}

function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function FrontendExport({ invoiceType, selectedMonth, selectedYear, className }: FrontendExportProps) {
  const { toast } = useToast()

  const handleExportCSV = async () => {
    try {
      // If a specific month is selected, export just that one file
      if (selectedMonth && selectedYear) {
        const params: { type?: string; month: number; year: number } = {
          month: selectedMonth,
          year: selectedYear,
        }
        if (invoiceType) params.type = invoiceType

        const csvContent = await apiClient.exportCSV(params)
        if (!csvContent || csvContent.split("\n").length <= 1) {
          toast({ title: "No Data", description: "No invoices found to export", variant: "destructive" })
          return
        }

        const typePart = invoiceType ? `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}_` : "All_"
        const filename = `${typePart}${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`
        downloadCSV(csvContent, filename)

        toast({ title: "Export Successful", description: `Exported ${filename}` })
        return
      }

      // No specific month selected — export separate files per month-sheet
      const months = await apiClient.getMonths()
      if (months.length === 0) {
        toast({ title: "No Data", description: "No invoices found to export", variant: "destructive" })
        return
      }

      // Determine which types to export
      const types: InvoiceType[] = invoiceType ? [invoiceType] : ["sale", "purchase"]
      let fileCount = 0

      for (const month of months) {
        for (const type of types) {
          // Skip if this month has no invoices of this type
          if (type === "sale" && month.saleCount === 0) continue
          if (type === "purchase" && month.purchaseCount === 0) continue

          const csvContent = await apiClient.exportCSV({
            type,
            month: month.month,
            year: month.year,
          })

          if (!csvContent || csvContent.split("\n").length <= 1) continue

          const typeName = type.charAt(0).toUpperCase() + type.slice(1)
          const filename = `${typeName}_${MONTH_NAMES[month.month]}_${month.year}.csv`
          downloadCSV(csvContent, filename)
          fileCount++

          // Small delay between downloads so browser doesn't block them
          await new Promise((r) => setTimeout(r, 300))
        }
      }

      if (fileCount === 0) {
        toast({ title: "No Data", description: "No invoices found to export", variant: "destructive" })
      } else {
        toast({ title: "Export Successful", description: `Downloaded ${fileCount} file${fileCount > 1 ? "s" : ""} (separate sheet per month)` })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({ title: "Export Error", description: "Failed to export invoices", variant: "destructive" })
    }
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 bg-transparent">
        <Download className="h-4 w-4" />
        {invoiceType
          ? `Export ${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}`
          : "Export All CSV"}
      </Button>
    </div>
  )
}
