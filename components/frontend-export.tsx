"use client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceType } from "@/lib/types"
import JSZip from "jszip"

interface FrontendExportProps {
  invoiceType?: InvoiceType
  selectedMonth?: number | null
  selectedYear?: number | null
  className?: string
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function downloadBlob(blob: Blob, filename: string) {
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
      // If a specific month is selected → single CSV file
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

        const typePart = invoiceType ? `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}` : "All"
        const filename = `${typePart}_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`
        downloadBlob(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }), filename)

        toast({ title: "Export Successful", description: `Exported ${filename}` })
        return
      }

      // No specific month → ZIP with separate CSV per month-sheet
      const months = await apiClient.getMonths()
      if (months.length === 0) {
        toast({ title: "No Data", description: "No invoices found to export", variant: "destructive" })
        return
      }

      const types: InvoiceType[] = invoiceType ? [invoiceType] : ["sale", "purchase"]
      const zip = new JSZip()
      let fileCount = 0

      for (const month of months) {
        for (const type of types) {
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
          zip.file(filename, csvContent)
          fileCount++
        }
      }

      if (fileCount === 0) {
        toast({ title: "No Data", description: "No invoices found to export", variant: "destructive" })
        return
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const typePart = invoiceType ? `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}` : "All"
      downloadBlob(zipBlob, `${typePart}_Invoices.zip`)

      toast({
        title: "Export Successful",
        description: `Downloaded ZIP with ${fileCount} sheet${fileCount > 1 ? "s" : ""} (separate CSV per month)`,
      })
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
