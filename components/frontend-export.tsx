"use client"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet } from "lucide-react"
import { localStorageService } from "@/lib/local-storage"
import { formatDateToDDMMYYYY } from "@/lib/csv-parser"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceType } from "@/lib/types"

interface FrontendExportProps {
  invoiceType?: InvoiceType
  className?: string
}

export default function FrontendExport({ invoiceType, className }: FrontendExportProps) {
  const { toast } = useToast()

  const handleExportCSV = () => {
    try {
      const csvContent = localStorageService.exportToCSV(invoiceType)

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

      const filename = invoiceType
        ? `${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}_Invoices_${formatDateToDDMMYYYY(new Date().toISOString())}.csv`
        : `All_Invoices_${formatDateToDDMMYYYY(new Date().toISOString())}.csv`

      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      const saleCount = localStorageService.getInvoices("sale").length
      const purchaseCount = localStorageService.getInvoices("purchase").length
      const totalCount = invoiceType ? (invoiceType === "sale" ? saleCount : purchaseCount) : saleCount + purchaseCount

      toast({
        title: "Export Successful",
        description: `${totalCount} invoices exported with DD-MM-YYYY date format and GST columns`,
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

  const handleExportSeparate = () => {
    try {
      const saleInvoices = localStorageService.getInvoices("sale")
      const purchaseInvoices = localStorageService.getInvoices("purchase")

      // Export Sale invoices
      if (saleInvoices.length > 0) {
        const saleCSV = localStorageService.exportToCSV("sale")
        const saleBlob = new Blob([saleCSV], { type: "text/csv;charset=utf-8;" })
        const saleLink = document.createElement("a")
        const saleUrl = URL.createObjectURL(saleBlob)
        saleLink.setAttribute("href", saleUrl)
        saleLink.setAttribute("download", `Sale_Invoices_${formatDateToDDMMYYYY(new Date().toISOString())}.csv`)
        saleLink.style.visibility = "hidden"
        document.body.appendChild(saleLink)
        saleLink.click()
        document.body.removeChild(saleLink)
        URL.revokeObjectURL(saleUrl)
      }

      // Export Purchase invoices
      if (purchaseInvoices.length > 0) {
        const purchaseCSV = localStorageService.exportToCSV("purchase")
        const purchaseBlob = new Blob([purchaseCSV], { type: "text/csv;charset=utf-8;" })
        const purchaseLink = document.createElement("a")
        const purchaseUrl = URL.createObjectURL(purchaseBlob)
        purchaseLink.setAttribute("href", purchaseUrl)
        purchaseLink.setAttribute("download", `Purchase_Invoices_${formatDateToDDMMYYYY(new Date().toISOString())}.csv`)
        purchaseLink.style.visibility = "hidden"
        document.body.appendChild(purchaseLink)
        purchaseLink.click()
        document.body.removeChild(purchaseLink)
        URL.revokeObjectURL(purchaseUrl)
      }

      toast({
        title: "Export Successful",
        description: `Separate files created: ${saleInvoices.length} sale invoices, ${purchaseInvoices.length} purchase invoices`,
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
    <div className={`flex gap-2 ${className}`}>
      <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 bg-transparent">
        <Download className="h-4 w-4" />
        {invoiceType ? `Export ${invoiceType.charAt(0).toUpperCase() + invoiceType.slice(1)}` : "Export All CSV"}
      </Button>

      {!invoiceType && (
        <Button
          onClick={handleExportSeparate}
          variant="outline"
          className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Separate Files
        </Button>
      )}
    </div>
  )
}
