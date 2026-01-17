"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Invoice, InvoiceType } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CSVUploadProps {
  onImport: (invoices: Invoice[]) => void
  onCancel: () => void
  invoiceType: InvoiceType
}

interface ParsedInvoice {
  data: Partial<Invoice>
  errors: string[]
  isValid: boolean
}

export default function CSVUpload({ onImport, onCancel, invoiceType }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedInvoice[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
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
      setParsedData([])
      setShowPreview(false)
    }
  }

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split("\n").filter((line) => line.trim())
    const result: string[][] = []

    for (const line of lines) {
      const row: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          row.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      row.push(current.trim())
      result.push(row)
    }

    return result
  }

  const validateAndParseInvoice = (row: string[], headers: string[]): ParsedInvoice => {
    const errors: string[] = []
    const data: Partial<Invoice> = {}

    try {
      // Enhanced column mapping for the specific CSV format
      const getValueByHeader = (searchTerms: string[]): string => {
        for (const term of searchTerms) {
          const index = headers.findIndex((h) =>
            h
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .includes(term.toLowerCase().replace(/[^a-z0-9]/g, "")),
          )
          if (index >= 0 && row[index]) {
            return row[index].trim()
          }
        }
        return ""
      }

      // Map columns based on your CSV structure
      const date = getValueByHeader(["date"])
      const invoiceNo = getValueByHeader(["invoice", "invoiceno"])
      const party = getValueByHeader(["party"])
      const basicAmount = getValueByHeader(["basic", "basicamount"])
      const totalAmount = getValueByHeader(["total", "totalamount"])

      // Required field validation
      if (!date) errors.push("Date is required")
      if (!invoiceNo) errors.push("Invoice number is required")
      if (!party) errors.push("Party name is required")

      // Parse date - handle DD-MM-YYYY format specifically
      let parsedDate = ""
      if (date) {
        try {
          let dateObj: Date

          // Handle DD-MM-YYYY format (your CSV format)
          if (date.includes("-") && date.split("-").length === 3) {
            const parts = date.split("-")
            if (parts[0].length === 2) {
              // DD-MM-YYYY format
              const [day, month, year] = parts
              dateObj = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
            } else {
              // YYYY-MM-DD format
              dateObj = new Date(date)
            }
          } else if (date.includes("/")) {
            // Handle MM/DD/YYYY or DD/MM/YYYY format
            const parts = date.split("/")
            if (parts.length === 3) {
              // Assume DD/MM/YYYY for your format
              const [day, month, year] = parts
              dateObj = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
            } else {
              dateObj = new Date(date)
            }
          } else {
            dateObj = new Date(date)
          }

          if (isNaN(dateObj.getTime())) {
            errors.push("Invalid date format")
          } else {
            parsedDate = dateObj.toISOString().split("T")[0]
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

      // Parse GST breakup with exact column matching
      const gstBreakup = {
        cgst_14: Number.parseFloat(getValueByHeader(["cgst14", "cgst(14%)", "cgst 14"])) || 0,
        sgst_14: Number.parseFloat(getValueByHeader(["sgst14", "sgst(14%)", "sgst 14"])) || 0,
        cgst_9: Number.parseFloat(getValueByHeader(["cgst9", "cgst(9%)", "cgst 9"])) || 0,
        sgst_9: Number.parseFloat(getValueByHeader(["sgst9", "sgst(9%)", "sgst 9"])) || 0,
        cgst_6: Number.parseFloat(getValueByHeader(["cgst6", "cgst(6%)", "cgst 6"])) || 0,
        sgst_6: Number.parseFloat(getValueByHeader(["sgst6", "sgst(6%)", "sgst 6"])) || 0,
        cgst_2_5: Number.parseFloat(getValueByHeader(["cgst25", "cgst(2.5%)", "cgst 2.5", "cgst(25%)"])) || 0,
        sgst_2_5: Number.parseFloat(getValueByHeader(["sgst25", "sgst(2.5%)", "sgst 2.5", "sgst(25%)"])) || 0,
        cgst_1_5: Number.parseFloat(getValueByHeader(["cgst15", "cgst(1.5%)", "cgst 1.5"])) || 0,
        sgst_1_5: Number.parseFloat(getValueByHeader(["sgst15", "sgst(1.5%)", "sgst 1.5"])) || 0,
        igst_28: Number.parseFloat(getValueByHeader(["igst28", "igst(28%)", "igst 28"])) || 0,
        igst_18: Number.parseFloat(getValueByHeader(["igst18", "igst(18%)", "igst 18"])) || 0,
        igst_12: Number.parseFloat(getValueByHeader(["igst12", "igst(12%)", "igst 12"])) || 0,
        igst_5: Number.parseFloat(getValueByHeader(["igst5", "igst(5%)", "igst 5"])) || 0,
        igst_3: Number.parseFloat(getValueByHeader(["igst3", "igst(3%)", "igst 3"])) || 0,
      }

      // Create tax items based on GST breakup
      const items = []

      // Determine the primary tax type and rate based on the highest GST amount
      let primaryTaxRate = 18
      let primaryTaxType: "CGST_SGST" | "IGST" = "CGST_SGST"
      let maxGstAmount = 0

      // Check IGST amounts
      if (gstBreakup.igst_28 > maxGstAmount) {
        maxGstAmount = gstBreakup.igst_28
        primaryTaxRate = 28
        primaryTaxType = "IGST"
      }
      if (gstBreakup.igst_18 > maxGstAmount) {
        maxGstAmount = gstBreakup.igst_18
        primaryTaxRate = 18
        primaryTaxType = "IGST"
      }
      if (gstBreakup.igst_12 > maxGstAmount) {
        maxGstAmount = gstBreakup.igst_12
        primaryTaxRate = 12
        primaryTaxType = "IGST"
      }
      if (gstBreakup.igst_5 > maxGstAmount) {
        maxGstAmount = gstBreakup.igst_5
        primaryTaxRate = 5
        primaryTaxType = "IGST"
      }
      if (gstBreakup.igst_3 > maxGstAmount) {
        maxGstAmount = gstBreakup.igst_3
        primaryTaxRate = 3
        primaryTaxType = "IGST"
      }

      // Check CGST+SGST amounts (combined)
      if (gstBreakup.cgst_14 + gstBreakup.sgst_14 > maxGstAmount) {
        maxGstAmount = gstBreakup.cgst_14 + gstBreakup.sgst_14
        primaryTaxRate = 28
        primaryTaxType = "CGST_SGST"
      }
      if (gstBreakup.cgst_9 + gstBreakup.sgst_9 > maxGstAmount) {
        maxGstAmount = gstBreakup.cgst_9 + gstBreakup.sgst_9
        primaryTaxRate = 18
        primaryTaxType = "CGST_SGST"
      }
      if (gstBreakup.cgst_6 + gstBreakup.sgst_6 > maxGstAmount) {
        maxGstAmount = gstBreakup.cgst_6 + gstBreakup.sgst_6
        primaryTaxRate = 12
        primaryTaxType = "CGST_SGST"
      }
      if (gstBreakup.cgst_2_5 + gstBreakup.sgst_2_5 > maxGstAmount) {
        maxGstAmount = gstBreakup.cgst_2_5 + gstBreakup.sgst_2_5
        primaryTaxRate = 5
        primaryTaxType = "CGST_SGST"
      }
      if (gstBreakup.cgst_1_5 + gstBreakup.sgst_1_5 > maxGstAmount) {
        maxGstAmount = gstBreakup.cgst_1_5 + gstBreakup.sgst_1_5
        primaryTaxRate = 3
        primaryTaxType = "CGST_SGST"
      }

      // Create a tax item if we have basic amount or total amount
      if (parsedBasicAmount > 0 || parsedTotalAmount > 0) {
        items.push({
          id: "1",
          amount: parsedBasicAmount > 0 ? parsedBasicAmount : parsedTotalAmount,
          taxType: primaryTaxType,
          taxRate: primaryTaxRate as 28 | 18 | 12 | 5 | 3,
          inclusive: parsedBasicAmount === 0 && parsedTotalAmount > 0, // If only total amount is provided, assume inclusive
        })
      }

      // Build the invoice data
      data.type = invoiceType
      data.date = parsedDate
      data.invoiceNo = invoiceNo.toUpperCase()
      data.party = party.toUpperCase()
      data.gstNumber = getValueByHeader(["gst", "gstnumber", "gst number"]) || undefined
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
    }
  }

  const handleProcessFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)

      if (rows.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least a header row and one data row",
          variant: "destructive",
        })
        return
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim())
      const dataRows = rows.slice(1)

      console.log("Headers found:", headers)
      console.log("Sample row:", dataRows[0])

      const parsed = dataRows.map((row) => validateAndParseInvoice(row, headers))

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

    onImport(validInvoices)
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Import {invoiceType === "sale" ? "Sale" : "Purchase"} Invoices from CSV</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Upload a CSV file to import multiple invoices at once</p>
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

            {/* CSV Format Guide */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Your CSV Format is Supported!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p className="font-medium text-green-600">✅ Detected Format:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>DATE (DD-MM-YYYY format) ✅</li>
                    <li>INVOICE NO. (2025-2026/XXX format) ✅</li>
                    <li>PARTY (Company names) ✅</li>
                    <li>BASIC AMOUNT ✅</li>
                    <li>All GST columns (CGST, SGST, IGST) ✅</li>
                    <li>TOTAL AMOUNT ✅</li>
                  </ul>
                  <p className="text-green-600 font-medium mt-2">
                    Your CSV format matches perfectly! Just upload and import.
                  </p>
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
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Basic Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>GST Total</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((parsed, index) => {
                    const gstTotal = parsed.data.gstBreakup
                      ? Object.values(parsed.data.gstBreakup).reduce((sum, val) => sum + val, 0)
                      : 0

                    return (
                      <TableRow key={index} className={parsed.isValid ? "" : "bg-red-50"}>
                        <TableCell>
                          {parsed.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>{parsed.data.date || "-"}</TableCell>
                        <TableCell>{parsed.data.invoiceNo || "-"}</TableCell>
                        <TableCell>{parsed.data.party || "-"}</TableCell>
                        <TableCell>₹{parsed.data.basicAmount?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>₹{parsed.data.totalAmount?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>₹{gstTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          {parsed.errors.length > 0 && (
                            <div className="text-sm text-red-600">{parsed.errors.join(", ")}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
