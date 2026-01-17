import type { Invoice } from "./types"

// Helper function to format date as DD-MM-YYYY
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function exportToExcel(saleInvoices: Invoice[], purchaseInvoices: Invoice[]) {
  // Create proper CSV content for Google Sheets compatibility
  const createSheetContent = (invoices: Invoice[], sheetName: string) => {
    const headers = [
      "DATE",
      "INVOICE NO.",
      "PARTY",
      "GST NUMBER", // Added missing GST column
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
      "STATUS",
    ]

    const rows = invoices.map((invoice) => [
      formatDate(invoice.date), // Use DD-MM-YYYY format
      invoice.invoiceNo,
      invoice.party,
      invoice.gstNumber || "", // Include GST number
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
      invoice.isCancelled ? "CANCELLED" : "ACTIVE",
    ])

    return [
      `${sheetName.toUpperCase()} INVOICES`,
      "", // Empty row
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "", // Empty row at the end
    ].join("\n")
  }

  // Create content for both sheets
  const saleContent = createSheetContent(saleInvoices, "Sale")
  const purchaseContent = createSheetContent(purchaseInvoices, "Purchase")

  // Combine both sheets in one file
  const csvContent = saleContent + "\n" + purchaseContent

  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `GST_Invoices_${formatDate(new Date().toISOString())}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Alternative: Export to Google Sheets compatible format
export function exportToGoogleSheets(saleInvoices: Invoice[], purchaseInvoices: Invoice[]) {
  const createGoogleSheetsUrl = (invoices: Invoice[], sheetName: string) => {
    const headers = [
      "DATE",
      "INVOICE NO.",
      "PARTY",
      "GST NUMBER", // Added missing GST column
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
      "STATUS",
    ]

    // Create CSV data for Google Sheets
    const csvData = [
      headers.join(","),
      ...invoices.map((invoice) =>
        [
          formatDate(invoice.date), // Use DD-MM-YYYY format
          invoice.invoiceNo,
          invoice.party,
          invoice.gstNumber || "", // Include GST number
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
          invoice.isCancelled ? "CANCELLED" : "ACTIVE",
        ].join(","),
      ),
    ].join("\n")

    return csvData
  }

  // Create separate CSV content for each sheet
  const saleData = createGoogleSheetsUrl(saleInvoices, "Sale")
  const purchaseData = createGoogleSheetsUrl(purchaseInvoices, "Purchase")

  // Download Sale invoices CSV
  if (saleInvoices.length > 0) {
    const saleBlob = new Blob([saleData], { type: "text/csv;charset=utf-8;" })
    const saleLink = document.createElement("a")
    const saleUrl = URL.createObjectURL(saleBlob)
    saleLink.setAttribute("href", saleUrl)
    saleLink.setAttribute("download", `Sale_Invoices_${formatDate(new Date().toISOString())}.csv`)
    saleLink.style.visibility = "hidden"
    document.body.appendChild(saleLink)
    saleLink.click()
    document.body.removeChild(saleLink)
  }

  // Download Purchase invoices CSV
  if (purchaseInvoices.length > 0) {
    const purchaseBlob = new Blob([purchaseData], { type: "text/csv;charset=utf-8;" })
    const purchaseLink = document.createElement("a")
    const purchaseUrl = URL.createObjectURL(purchaseBlob)
    purchaseLink.setAttribute("href", purchaseUrl)
    purchaseLink.setAttribute("download", `Purchase_Invoices_${formatDate(new Date().toISOString())}.csv`)
    purchaseLink.style.visibility = "hidden"
    document.body.appendChild(purchaseLink)
    purchaseLink.click()
    document.body.removeChild(purchaseLink)
  }
}
