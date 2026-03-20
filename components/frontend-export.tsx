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

export default function FrontendExport({ invoiceType, selectedMonth, selectedYear, className }: FrontendExportProps) {
  const { toast } = useToast()

  const handleExportCSV = async () => {
    try {
      const params: { type?: string; month?: number; year?: number } = {}
      if (invoiceType) params.type = invoiceType
      if (selectedMonth) params.month = selectedMonth
      if (selectedYear) params.year = selectedYear

      const csvContent = await apiClient.exportCSV(params)

      if (!csvContent || csvContent.split("\n").length <= 1) {
        toast({
          title: "No Data",
          description: "No invoices found to export",
          variant: "destructive",
        })
        return
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)

      let filename = ""
      if (invoiceType) {
        filename += `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}_`
      } else {
        filename += "All_"
      }
      filename += "Invoices_"
      if (selectedMonth && selectedYear) {
        filename += `${MONTH_NAMES[selectedMonth]}_${selectedYear}_`
      }
      filename += `${formatDateToDDMMYYYY(new Date())}.csv`

      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Invoices exported with DD-MM-YYYY date format and GST columns",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Error",
        description: "Failed to export invoices",
        variant: "destructive",
      })
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
