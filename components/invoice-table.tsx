"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Eye, EyeOff, Ban, Search, ArrowUpDown } from "lucide-react"
import type { Invoice, InvoiceType } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface InvoiceTableProps {
  invoices: Invoice[]
  onEdit: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onCancel: (id: string) => void
  invoiceType: InvoiceType
}

type SortField = "date" | "invoiceNo" | "party" | "basicAmount" | "totalAmount"
type SortDir = "asc" | "desc"

export default function InvoiceTable({ invoices, onEdit, onDelete, onCancel, invoiceType }: InvoiceTableProps) {
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filtered = useMemo(() => {
    let result = invoices

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.party.toLowerCase().includes(q) ||
          (inv.gstNumber && inv.gstNumber.toLowerCase().includes(q))
      )
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "invoiceNo":
          cmp = a.invoiceNo.localeCompare(b.invoiceNo)
          break
        case "party":
          cmp = a.party.localeCompare(b.party)
          break
        case "basicAmount":
          cmp = a.basicAmount - b.basicAmount
          break
        case "totalAmount":
          cmp = a.totalAmount - b.totalAmount
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [invoices, search, sortField, sortDir])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, inv) => ({
        basicAmount: acc.basicAmount + inv.basicAmount,
        totalAmount: acc.totalAmount + inv.totalAmount,
        tax: acc.tax + (inv.totalAmount - inv.basicAmount),
      }),
      { basicAmount: 0, totalAmount: 0, tax: 0 }
    )
  }, [filtered])

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No {invoiceType} invoices added yet. Click "Add New Invoice" to get started.</p>
        </CardContent>
      </Card>
    )
  }

  const handleDelete = (id: string, invoiceNo: string) => {
    if (confirm(`Are you sure you want to delete ${invoiceType} invoice ${invoiceNo}?`)) {
      onDelete(id)
    }
  }

  const handleCancel = (id: string, invoiceNo: string) => {
    if (
      confirm(`Are you sure you want to cancel ${invoiceType} invoice ${invoiceNo}? This will set all amounts to zero.`)
    ) {
      onCancel(id)
    }
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-100"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </span>
    </TableHead>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>
            {invoiceType === "sale" ? "Sale" : "Purchase"} Invoice List ({filtered.length}
            {filtered.length !== invoices.length ? ` of ${invoices.length}` : ""})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-56"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAllColumns(!showAllColumns)}>
              {showAllColumns ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAllColumns ? "Hide GST" : "Show GST"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="date">Date</SortHeader>
                <SortHeader field="invoiceNo">Invoice No.</SortHeader>
                <SortHeader field="party">Party</SortHeader>
                <TableHead>Status</TableHead>
                <SortHeader field="basicAmount">Basic Amount</SortHeader>
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
                    <TableHead>CGST (1.5%)</TableHead>
                    <TableHead>SGST (1.5%)</TableHead>
                    <TableHead>IGST (28%)</TableHead>
                    <TableHead>IGST (18%)</TableHead>
                    <TableHead>IGST (12%)</TableHead>
                    <TableHead>IGST (5%)</TableHead>
                    <TableHead>IGST (3%)</TableHead>
                  </>
                )}
                <SortHeader field="totalAmount">Total Amount</SortHeader>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice) => (
                <TableRow key={invoice.id} className={invoice.isCancelled ? "opacity-60 bg-red-50" : ""}>
                  <TableCell>{new Date(invoice.date).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                  <TableCell>{invoice.party}</TableCell>
                  <TableCell>
                    {invoice.isCancelled ? (
                      <Badge variant="destructive">CANCELLED</Badge>
                    ) : (
                      <Badge variant="default">ACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell>₹{invoice.basicAmount.toFixed(2)}</TableCell>
                  {showAllColumns && (
                    <>
                      <TableCell>₹{invoice.gstBreakup.cgst_14.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.sgst_14.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.cgst_9.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.sgst_9.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.cgst_6.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.sgst_6.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.cgst_2_5.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.sgst_2_5.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.cgst_1_5.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.sgst_1_5.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.igst_28.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.igst_18.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.igst_12.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.igst_5.toFixed(2)}</TableCell>
                      <TableCell>₹{invoice.gstBreakup.igst_3.toFixed(2)}</TableCell>
                    </>
                  )}
                  <TableCell className="font-bold">₹{invoice.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(invoice)}
                        disabled={invoice.isCancelled}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!invoice.isCancelled && (
                        <Button size="sm" variant="outline" onClick={() => handleCancel(invoice.id, invoice.invoiceNo)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id, invoice.invoiceNo)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-gray-100 font-bold border-t-2">
                <TableCell colSpan={3}>TOTAL ({filtered.length} invoices)</TableCell>
                <TableCell></TableCell>
                <TableCell>₹{totals.basicAmount.toFixed(2)}</TableCell>
                {showAllColumns && (
                  <>
                    {Array.from({ length: 15 }).map((_, i) => (
                      <TableCell key={i}></TableCell>
                    ))}
                  </>
                )}
                <TableCell>₹{totals.totalAmount.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
