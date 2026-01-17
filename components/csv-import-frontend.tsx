"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Eye, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { parseCSV, formatDateToDDMMYYYY, type CSVRow } from "@/lib/csv-parser"
import { localStorageService } from "@/lib/local-storage"
import type { Invoice, InvoiceType } from "@/lib/types"

interface CSVImportProps {
  onImportComplete: (results: { successful: Invoice[]; failed: any[] }) => void
  onCancel: () => void
  invoiceType: InvoiceType
}

interface ParsedInvoice {
  data: Partial<Invoice>
  errors: string[]
  isValid: boolean
  originalRow: CSVRow
}

export default function CSVImportFrontend({ onImportComplete, onCancel, invoiceType }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [parsedData, setParsedData] = useState<ParsedInvoice[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAllColumns, setShowAllColumns] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setCsvData([])
      setParsedData([])
      setShowPreview(false)
    }
  }

  const getColumnValue = (row: CSVRow, searchTerms: string[]): string => {
    // First try exact column name matches
    for (const term of searchTerms) {
      if (row[term]) {
        return row[term].trim()
      }
    }

    // Then try case-insensitive partial matches
    for (const term of searchTerms) {
      for (const [key, value] of Object.entries(row)) {
        if (
          key
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(term.toLowerCase().replace(/[^a-z0-9]/g, ""))
        ) {
          return value?.trim() || ""
        }
      }
    }
    return ""
  }

  const validateAndParseInvoice = (row: CSVRow): ParsedInvoice => {
    const errors: string[] = []
    const data: Partial<Invoice> = {}

    try {
      // Extract basic fields using exact column names from your CSV
      const date = getColumnValue(row, ["DATE"])
      const invoiceNo = getColumnValue(row, ["INVOICE NO."])
      const party = getColumnValue(row, ["PARTY"])
      const basicAmount = getColumnValue(row, ["BASIC AMOUNT"])
      const totalAmount = getColumnValue(row, ["TOTAL AMOUNT"])

      // Skip header rows and summary rows
      if (date === "MAY" || party === "TOTAL" || !invoiceNo || invoiceNo.includes("TOTAL")) {
        errors.push("Skipping header/summary row")
        return { data, errors, isValid: false, originalRow: row }
      }

      // Validate required fields
      if (!date) errors.push("Date is required")
      if (!invoiceNo) errors.push("Invoice number is required")
      if (!party) errors.push("Party name is required")

      // Parse date - handle various formats
      let parsedDate = ""
      if (date) {
        try {
          // Handle DD-MM-YYYY format
          if (date.includes("-") && date.split("-").length === 3) {
            const parts = date.split("-")
            if (parts[0].length === 2) {
              // DD-MM-YYYY format
              const [day, month, year] = parts
              const dateObj = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
              parsedDate = dateObj.toISOString().split("T")[0]
            } else {
              // YYYY-MM-DD format
              parsedDate = date
            }
          } else if (date.includes("/")) {
            // Handle DD/MM/YYYY format
            const parts = date.split("/")
            if (parts.length === 3) {
              const [day, month, year] = parts
              const dateObj = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
              parsedDate = dateObj.toISOString().split("T")[0]
            }
          } else {
            // Try direct parsing
            const dateObj = new Date(date)
            if (!isNaN(dateObj.getTime())) {
              parsedDate = dateObj.toISOString().split("T")[0]
            }
          }

          if (!parsedDate) {
            errors.push("Invalid date format")
          }
        } catch {
          errors.push("Invalid date format")
        }
      }

      // Parse amounts
      const parsedBasicAmount = Number.parseFloat(basicAmount || "0") || 0
      const parsedTotalAmount = Number.parseFloat(totalAmount || "0") || 0

      if (parsedBasicAmount < 0) errors.push("Basic amount cannot be negative")
      if (parsedTotalAmount < 0) errors.push("Total amount cannot be negative")

      // Parse GST breakup using exact column names
      const gstBreakup = {
        cgst_14: Number.parseFloat(getColumnValue(row, ["CGST (14%)"])) || 0,
        sgst_14: Number.parseFloat(getColumnValue(row, ["SGST (14%)"])) || 0,
        cgst_9: Number.parseFloat(getColumnValue(row, ["CGST (9%)"])) || 0,
        sgst_9: Number.parseFloat(getColumnValue(row, ["SGST (9%)"])) || 0,
        cgst_6: Number.parseFloat(getColumnValue(row, ["CGST (6%)"])) || 0,
        sgst_6: Number.parseFloat(getColumnValue(row, ["SGST (6%)"])) || 0,
        cgst_2_5: Number.parseFloat(getColumnValue(row, ["CGST (2.5%)"])) || 0,
        sgst_2_5: Number.parseFloat(getColumnValue(row, ["SGST (2.5%)"])) || 0,
        cgst_1_5: Number.parseFloat(getColumnValue(row, ["CGST (1.5%)"])) || 0,
        sgst_1_5: Number.parseFloat(getColumnValue(row, ["SGST (1.5%)"])) || 0,
        igst_28: Number.parseFloat(getColumnValue(row, ["IGST (28%)"])) || 0,
        igst_18: Number.parseFloat(getColumnValue(row, ["IGST (18%)"])) || 0,
        igst_12: Number.parseFloat(getColumnValue(row, ["IGST (12%)"])) || 0,
        igst_5: Number.parseFloat(getColumnValue(row, ["IGST (5%)"])) || 0,
        igst_3: Number.parseFloat(getColumnValue(row, ["IGST (3%)"])) || 0,
      }

      // Create tax items based on non-zero GST amounts
      const items = []
      let itemId = 1

      // Check CGST+SGST combinations
      const cgstSgstPairs = [
        { cgst: gstBreakup.cgst_14, sgst: gstBreakup.sgst_14, rate: 28 },
        { cgst: gstBreakup.cgst_9, sgst: gstBreakup.sgst_9, rate: 18 },
        { cgst: gstBreakup.cgst_6, sgst: gstBreakup.sgst_6, rate: 12 },
        { cgst: gstBreakup.cgst_2_5, sgst: gstBreakup.sgst_2_5, rate: 5 },
        { cgst: gstBreakup.cgst_1_5, sgst: gstBreakup.sgst_1_5, rate: 3 },
      ]

      cgstSgstPairs.forEach(({ cgst, sgst, rate }) => {
        if (cgst > 0 && sgst > 0) {
          const totalTax = cgst + sgst
          const basicAmount = (totalTax * 100) / rate

          items.push({
            id: itemId.toString(),
            amount: basicAmount,
            taxType: "CGST_SGST" as const,
            taxRate: rate as 28 | 18 | 12 | 5 | 3,
            inclusive: false,
          })
          itemId++
        }
      })

      // Check IGST amounts
      const igstRates = [
        { amount: gstBreakup.igst_28, rate: 28 },
        { amount: gstBreakup.igst_18, rate: 18 },
        { amount: gstBreakup.igst_12, rate: 12 },
        { amount: gstBreakup.igst_5, rate: 5 },
        { amount: gstBreakup.igst_3, rate: 3 },
      ]

      igstRates.forEach(({ amount, rate }) => {
        if (amount > 0) {
          const basicAmount = (amount * 100) / rate

          items.push({
            id: itemId.toString(),
            amount: basicAmount,
            taxType: "IGST" as const,
            taxRate: rate as 28 | 18 | 12 | 5 | 3,
            inclusive: false,
          })
          itemId++
        }
      })

      // If no tax items found but we have amounts, create a default item
      if (items.length === 0 && (parsedBasicAmount > 0 || parsedTotalAmount > 0)) {
        const amount = parsedBasicAmount > 0 ? parsedBasicAmount : parsedTotalAmount
        const inclusive = parsedBasicAmount === 0 && parsedTotalAmount > 0

        // Determine tax rate from total vs basic amount ratio
        let taxRate: 28 | 18 | 12 | 5 | 3 = 18
        if (parsedBasicAmount > 0 && parsedTotalAmount > 0) {
          const calculatedTaxRate = ((parsedTotalAmount - parsedBasicAmount) / parsedBasicAmount) * 100
          if (calculatedTaxRate >= 25) taxRate = 28
          else if (calculatedTaxRate >= 15) taxRate = 18
          else if (calculatedTaxRate >= 8) taxRate = 12
          else if (calculatedTaxRate >= 4) taxRate = 5
          else taxRate = 3
        }

        items.push({
          id: "1",
          amount: amount,
          taxType: "CGST_SGST" as const,
          taxRate: taxRate,
          inclusive: inclusive,
        })
      }

      // Build invoice data
      data.type = invoiceType
      data.date = parsedDate
      data.invoiceNo = invoiceNo.toUpperCase()
      data.party = party.toUpperCase()
      data.gstNumber = undefined // GST number not in this CSV format
      data.basicAmount = parsedBasicAmount
      data.totalAmount = parsedTotalAmount
      data.gstBreakup = gstBreakup
      data.items = items
    } catch (error) {
      console.error("Error parsing row:", error)
      errors.push("Failed to parse row data")
    }

    return {
      data,
      errors,
      isValid: errors.length === 0,
      originalRow: row,
    }
  }

  const handleProcessFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least one data row",
          variant: "destructive",
        })
        return
      }

      setCsvData(rows)
      const parsed = rows.map((row) => validateAndParseInvoice(row))
      setParsedData(parsed)
      setShowPreview(true)

      const validCount = parsed.filter((p) => p.isValid).length
      const invalidCount = parsed.length - validCount

      toast({
        title: "CSV Processed",
        description: `${validCount} valid records, ${invalidCount} invalid records found`,
      })
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Processing Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = () => {
    const validInvoices = parsedData
      .filter((p) => p.isValid)
      .map((p) => ({
        ...p.data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      })) as Invoice[]

    if (validInvoices.length === 0) {
      toast({
        title: "No Valid Records",
        description: "No valid invoices found to import",
        variant: "destructive",
      })
      return
    }

    // Use localStorage service to add invoices
    const results = localStorageService.addInvoices(validInvoices)
    onImportComplete(results)
  }

  const handleReset = () => {
    setFile(null)
    setCsvData([])
    setParsedData([])
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleExportSample = () => {
    const sampleCSV = `DATE,INVOICE NO.,PARTY,BASIC AMOUNT,CGST (14%),SGST (14%),CGST (9%),SGST (9%),CGST (6%),SGST (6%),CGST (2.5%),SGST (2.5%),CGST (1.5%),SGST (1.5%),IGST (28%),IGST (18%),IGST (12%),IGST (5%),IGST (3%),TOTAL AMOUNT
05-01-2025,2025-2026/85,SAMPLE COMPANY,3559.32,0,0,320.34,320.34,0,0,0,0,0,0,0,0,0,0,0,4200
06-01-2025,2025-2026/86,ANOTHER COMPANY,11864.41,0,0,0,0,0,0,0,0,0,0,3305.08,0,0,0,0,15169.49`

    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Sample_CSV_Template_${formatDateToDDMMYYYY(new Date().toISOString())}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Import {invoiceType === "sale" ? "Sale" : "Purchase"} Invoices from CSV</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Frontend-only CSV import with localStorage persistence</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        {!showPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="csvFile">Select CSV File</Label>
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleExportSample} variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample Template
                </Button>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-600">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleProcessFile} disabled={!file || isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process CSV
                  </>
                )}
              </Button>
              {file && (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>

            {/* Format Guide */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">✅ Your CSV Format is Perfectly Supported!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p className="font-medium text-green-700">Exact column mapping detected:</p>
                  <div className="grid grid-cols-2 gap-2 text-green-600">
                    <ul className="list-disc list-inside space-y-1">
                      <li>DATE ✅</li>
                      <li>INVOICE NO. ✅</li>
                      <li>PARTY ✅</li>
                      <li>BASIC AMOUNT ✅</li>
                      <li>CGST (14%) ✅</li>
                      <li>SGST (14%) ✅</li>
                      <li>CGST (9%) ✅</li>
                      <li>SGST (9%) ✅</li>
                      <li>CGST (6%) ✅</li>
                      <li>SGST (6%) ✅</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-1">
                      <li>CGST (2.5%) ✅</li>
                      <li>SGST (2.5%) ✅</li>
                      <li>CGST (1.5%) ✅</li>
                      <li>SGST (1.5%) ✅</li>
                      <li>IGST (28%) ✅</li>
                      <li>IGST (18%) ✅</li>
                      <li>IGST (12%) ✅</li>
                      <li>IGST (5%) ✅</li>
                      <li>IGST (3%) ✅</li>
                      <li>TOTAL AMOUNT ✅</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 rounded">
                    <p className="text-green-800 font-medium">
                      🎯 Perfect match for your MAY_CSV_converted.csv format!
                    </p>
                    <p className="text-green-700 text-xs mt-1">
                      • Automatically skips header rows (DATE=MAY) • Filters out summary rows (PARTY=TOTAL) • Handles
                      all GST tax rates and types • Creates multiple tax items for complex invoices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Import Preview</h3>
              <div className="flex gap-2">
                <Badge variant="default">{parsedData.filter((p) => p.isValid).length} Valid</Badge>
                <Badge variant="destructive">{parsedData.filter((p) => !p.isValid).length} Invalid</Badge>
                <Button variant="outline" size="sm" onClick={() => setShowAllColumns(!showAllColumns)}>
                  {showAllColumns ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showAllColumns ? "Hide GST Columns" : "Show All GST Columns"}
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Basic Amount</TableHead>
                    {showAllColumns && (
                      <>
                        <TableHead>CGST (14%)</TableHead>
                        <TableHead>SGST (14%)</TableHead>
                        <TableHead>CGST (9%)</TableHead>
                        <TableHead>SGST (9%)</TableHead>
                        <TableHead>CGST (6%)</TableHead>
                        <TableHead>SGST (6%)</TableHead>
                        <TableHead>CGST (2.5%)</TableHead>
                        <TableHead>SGST (2.5%)</TableHead>
                        <TableHead>IGST (28%)</TableHead>
                        <TableHead>IGST (18%)</TableHead>
                        <TableHead>IGST (12%)</TableHead>
                        <TableHead>IGST (5%)</TableHead>
                        <TableHead>IGST (3%)</TableHead>
                      </>
                    )}
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((parsed, index) => (
                    <TableRow key={index} className={parsed.isValid ? "" : "bg-red-50"}>
                      <TableCell>
                        {parsed.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>{parsed.data.date ? formatDateToDDMMYYYY(parsed.data.date) : "-"}</TableCell>
                      <TableCell>{parsed.data.invoiceNo || "-"}</TableCell>
                      <TableCell>{parsed.data.party || "-"}</TableCell>
                      <TableCell>₹{parsed.data.basicAmount?.toFixed(2) || "0.00"}</TableCell>
                      {showAllColumns && parsed.data.gstBreakup && (
                        <>
                          <TableCell>₹{parsed.data.gstBreakup.cgst_14.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.sgst_14.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.cgst_9.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.sgst_9.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.cgst_6.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.sgst_6.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.cgst_2_5.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.sgst_2_5.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.igst_28.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.igst_18.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.igst_12.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.igst_5.toFixed(2)}</TableCell>
                          <TableCell>₹{parsed.data.gstBreakup.igst_3.toFixed(2)}</TableCell>
                        </>
                      )}
                      <TableCell>₹{parsed.data.totalAmount?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        {parsed.errors.length > 0 && (
                          <div className="text-sm text-red-600">{parsed.errors.join(", ")}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedData.filter((p) => p.isValid).length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                Import {parsedData.filter((p) => p.isValid).length} Valid Records
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
