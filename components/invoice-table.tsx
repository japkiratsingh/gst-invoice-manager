"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Eye, EyeOff, Ban } from "lucide-react"
import type { Invoice, InvoiceType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface InvoiceTableProps {
  invoices: Invoice[]
  onEdit: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onCancel: (id: string) => void
  invoiceType: InvoiceType
}

export default function InvoiceTable({ invoices, onEdit, onDelete, onCancel, invoiceType }: InvoiceTableProps) {
  const [showAllColumns, setShowAllColumns] = useState(false)
  const { toast } = useToast()

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

  const handleCancel = async (id: string, invoiceNo: string) => {
    if (
      confirm(`Are you sure you want to cancel ${invoiceType} invoice ${invoiceNo}? This will set all amounts to zero.`)
    ) {
      onCancel(id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {invoiceType === "sale" ? "Sale" : "Purchase"} Invoice List ({invoices.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowAllColumns(!showAllColumns)}>
            {showAllColumns ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAllColumns ? "Hide GST Columns" : "Show All GST Columns"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableHead>CGST (1.5%)</TableHead>
                    <TableHead>SGST (1.5%)</TableHead>
                    <TableHead>IGST (28%)</TableHead>
                    <TableHead>IGST (18%)</TableHead>
                    <TableHead>IGST (12%)</TableHead>
                    <TableHead>IGST (5%)</TableHead>
                    <TableHead>IGST (3%)</TableHead>
                  </>
                )}
                <TableHead>Total Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
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
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
