"use client"

import type React from "react"
import { calculateTax } from "@/lib/tax-calculations" // Import the calculateTax function

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Save, X, Receipt, ShoppingCart, Loader2 } from "lucide-react"
import type { Invoice, TaxItem, TaxType, InvoiceType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface InvoiceFormProps {
  onSubmit: (invoice: Invoice) => void
  onCancel: () => void
  editingInvoice?: Invoice | null
  invoiceType: InvoiceType
  existingInvoices: Invoice[]
  submitting?: boolean
}

export default function InvoiceForm({
  onSubmit,
  onCancel,
  editingInvoice,
  invoiceType,
  existingInvoices,
  submitting = false,
}: InvoiceFormProps) {
  // Update the state initialization
  const [items, setItems] = useState<TaxItem[]>([
    { id: "1", amount: 0, taxType: "CGST_SGST", taxRate: 18, inclusive: true },
  ])

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    invoicePrefix: "",
    party: "",
    gstNumber: "",
  })

  const [calculatedData, setCalculatedData] = useState({
    basicAmount: 0,
    totalAmount: 0,
    gstBreakup: {
      cgst_14: 0,
      sgst_14: 0,
      cgst_9: 0,
      sgst_9: 0,
      cgst_6: 0,
      sgst_6: 0,
      cgst_2_5: 0,
      sgst_2_5: 0,
      cgst_1_5: 0,
      sgst_1_5: 0,
      igst_28: 0,
      igst_18: 0,
      igst_12: 0,
      igst_5: 0,
      igst_3: 0,
    },
  })

  const { toast } = useToast()

  // Load editing invoice data with smart GST breakup analysis
  useEffect(() => {
    if (editingInvoice) {
      const invoicePrefix = editingInvoice.invoiceNo?.split("/").pop() || ""
      setFormData({
        date: editingInvoice.date || new Date().toISOString().split("T")[0],
        invoicePrefix,
        party: editingInvoice.party || "",
        gstNumber: editingInvoice.gstNumber || "",
      })

      // Smart reconstruction of tax items from GST breakup
      const reconstructedItems = reconstructTaxItemsFromGSTBreakup(editingInvoice)
      setItems(
        reconstructedItems.length > 0
          ? reconstructedItems
          : [{ id: "1", amount: 0, taxType: "CGST_SGST", taxRate: 18, inclusive: false }],
      )
    }
  }, [editingInvoice])

  // Recalculate whenever tax entries change
  useEffect(() => {
    const result = calculateTax(items)
    setCalculatedData(result)
  }, [items])

  // Smart function to reconstruct tax items from GST breakup
  const reconstructTaxItemsFromGSTBreakup = (invoice: Invoice) => {
    const items: TaxItem[] = []
    let itemId = 1

    // Analyze CGST+SGST combinations
    const cgstSgstPairs = [
      { cgst: invoice.gstBreakup.cgst_14, sgst: invoice.gstBreakup.sgst_14, rate: 28 },
      { cgst: invoice.gstBreakup.cgst_9, sgst: invoice.gstBreakup.sgst_9, rate: 18 },
      { cgst: invoice.gstBreakup.cgst_6, sgst: invoice.gstBreakup.sgst_6, rate: 12 },
      { cgst: invoice.gstBreakup.cgst_2_5, sgst: invoice.gstBreakup.sgst_2_5, rate: 5 },
      { cgst: invoice.gstBreakup.cgst_1_5, sgst: invoice.gstBreakup.sgst_1_5, rate: 3 },
    ]

    cgstSgstPairs.forEach(({ cgst, sgst, rate }) => {
      if (cgst > 0 && sgst > 0) {
        // Calculate basic amount from tax amount
        const totalTax = cgst + sgst
        const basicAmount = (totalTax * 100) / rate

        items.push({
          id: itemId.toString(),
          amount: basicAmount,
          taxType: "CGST_SGST",
          taxRate: rate as 28 | 18 | 12 | 5 | 3,
          inclusive: false,
        })
        itemId++
      }
    })

    // Analyze IGST amounts
    const igstRates = [
      { amount: invoice.gstBreakup.igst_28, rate: 28 },
      { amount: invoice.gstBreakup.igst_18, rate: 18 },
      { amount: invoice.gstBreakup.igst_12, rate: 12 },
      { amount: invoice.gstBreakup.igst_5, rate: 5 },
      { amount: invoice.gstBreakup.igst_3, rate: 3 },
    ]

    igstRates.forEach(({ amount, rate }) => {
      if (amount > 0) {
        // Calculate basic amount from tax amount
        const basicAmount = (amount * 100) / rate

        items.push({
          id: itemId.toString(),
          amount: basicAmount,
          taxType: "IGST",
          taxRate: rate as 28 | 18 | 12 | 5 | 3,
          inclusive: false,
        })
        itemId++
      }
    })

    // If no tax items found but we have amounts, try to reconstruct from totals
    if (items.length === 0 && (invoice.basicAmount > 0 || invoice.totalAmount > 0)) {
      const amount = invoice.basicAmount > 0 ? invoice.basicAmount : invoice.totalAmount
      const inclusive = invoice.basicAmount === 0 && invoice.totalAmount > 0

      // Try to determine tax rate from the ratio
      let taxRate: 28 | 18 | 12 | 5 | 3 = 18
      if (invoice.basicAmount > 0 && invoice.totalAmount > 0) {
        const calculatedTaxRate = ((invoice.totalAmount - invoice.basicAmount) / invoice.basicAmount) * 100
        if (calculatedTaxRate >= 25) taxRate = 28
        else if (calculatedTaxRate >= 15) taxRate = 18
        else if (calculatedTaxRate >= 8) taxRate = 12
        else if (calculatedTaxRate >= 4) taxRate = 5
        else taxRate = 3
      }

      items.push({
        id: "1",
        amount: amount,
        taxType: "CGST_SGST",
        taxRate: taxRate,
        inclusive: inclusive,
      })
    }

    return items
  }

  // Update all function names and references
  const addItem = () => {
    const newItem: TaxItem = {
      id: Date.now().toString(),
      amount: 0,
      taxType: "CGST_SGST",
      taxRate: 18,
      inclusive: false,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof TaxItem, value: any) => {
    setItems((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((items) => items.filter((item) => item.id !== id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.invoicePrefix || !formData.party) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Invoice Number and Party Name).",
        variant: "destructive",
      })
      return
    }

    // Add validation for items
    if (items.length === 0 || items.every((item) => item.amount <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item with a valid amount.",
        variant: "destructive",
      })
      return
    }

    // Format the full invoice number
    const fullInvoiceNumber = `2025-2026/${formData.invoicePrefix.toUpperCase()}`

    // Check for duplicate invoice numbers (excluding current invoice when editing)
    const isDuplicate = existingInvoices.some(
      (inv) => inv.invoiceNo === fullInvoiceNumber && (!editingInvoice || inv.id !== editingInvoice.id),
    )

    if (isDuplicate) {
      toast({
        title: "Duplicate Invoice",
        description: `A ${invoiceType} invoice with this number already exists.`,
        variant: "destructive",
      })
      return
    }

    // Update the invoice creation with proper null handling
    const invoice: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      type: invoiceType,
      date: formData.date,
      invoiceNo: fullInvoiceNumber,
      party: formData.party.toUpperCase(),
      gstNumber: formData.gstNumber ? formData.gstNumber.toUpperCase() : undefined,
      items,
      basicAmount: calculatedData.basicAmount,
      totalAmount: calculatedData.totalAmount,
      gstBreakup: calculatedData.gstBreakup,
    }

    onSubmit(invoice)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {invoiceType === "sale" ? (
              <Receipt className="h-6 w-6 text-green-600" />
            ) : (
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <CardTitle>
                {editingInvoice ? "Edit" : "Add"} {invoiceType === "sale" ? "Sale" : "Purchase"} Invoice
              </CardTitle>
              <Badge variant={invoiceType === "sale" ? "default" : "secondary"} className="mt-1">
                {invoiceType === "sale" ? "SALE" : "PURCHASE"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="invoicePrefix">Invoice Number *</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-2 rounded border">2025-2026/</span>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                  placeholder="001"
                  required
                  className="flex-1"
                  disabled={submitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="party">Party Name *</Label>
              <Input
                id="party"
                value={formData.party}
                onChange={(e) => setFormData({ ...formData, party: e.target.value.toUpperCase() })}
                placeholder="COMPANY NAME"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Tax Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Tax Items</h3>
              <Button type="button" onClick={addItem} size="sm" disabled={submitting}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entry.amount || ""}
                    onChange={(e) => updateItem(entry.id, "amount", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label>Tax Type</Label>
                  <Select
                    value={entry.taxType}
                    onValueChange={(value: TaxType) => updateItem(entry.id, "taxType", value)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                      <SelectItem value="IGST">IGST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tax Rate</Label>
                  <Select
                    value={entry.taxRate.toString()}
                    onValueChange={(value) => updateItem(entry.id, "taxRate", Number.parseInt(value))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="28">28%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="3">3%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-center">
                  <Label className="mb-2">Tax Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={entry.inclusive}
                      onCheckedChange={(checked) => updateItem(entry.id, "inclusive", checked)}
                      disabled={submitting}
                    />
                    <span className="text-sm">{entry.inclusive ? "Inc." : "Exc."}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <Label className="mb-2">Calculated</Label>
                  <div className="text-sm text-gray-600">
                    {entry.inclusive ? "Basic: " : "Tax: "}₹{(() => {
                      const calculatedValue = entry.inclusive
                        ? entry.amount / (1 + entry.taxRate / 100)
                        : (entry.amount * entry.taxRate) / 100
                      return isNaN(calculatedValue) ? "0.00" : calculatedValue.toFixed(2)
                    })()}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(entry.id)}
                    disabled={items.length === 1 || submitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Calculation Preview */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Calculation Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Basic Amount</p>
                  <p className="text-lg font-bold">
                    ₹{isNaN(calculatedData.basicAmount) ? "0.00" : calculatedData.basicAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Total Tax</p>
                  <p className="text-lg font-bold">
                    ₹
                    {isNaN(calculatedData.totalAmount - calculatedData.basicAmount)
                      ? "0.00"
                      : (calculatedData.totalAmount - calculatedData.basicAmount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-lg font-bold">
                    ₹{isNaN(calculatedData.totalAmount) ? "0.00" : calculatedData.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Show detailed GST breakdown if multiple items */}
              {items.length > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium text-sm mb-2">GST Breakdown ({items.length} items):</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {calculatedData.gstBreakup.cgst_14 > 0 && (
                      <>
                        <div>CGST 14%: ₹{calculatedData.gstBreakup.cgst_14.toFixed(2)}</div>
                        <div>SGST 14%: ₹{calculatedData.gstBreakup.sgst_14.toFixed(2)}</div>
                      </>
                    )}
                    {calculatedData.gstBreakup.cgst_9 > 0 && (
                      <>
                        <div>CGST 9%: ₹{calculatedData.gstBreakup.cgst_9.toFixed(2)}</div>
                        <div>SGST 9%: ₹{calculatedData.gstBreakup.sgst_9.toFixed(2)}</div>
                      </>
                    )}
                    {calculatedData.gstBreakup.cgst_6 > 0 && (
                      <>
                        <div>CGST 6%: ₹{calculatedData.gstBreakup.cgst_6.toFixed(2)}</div>
                        <div>SGST 6%: ₹{calculatedData.gstBreakup.sgst_6.toFixed(2)}</div>
                      </>
                    )}
                    {calculatedData.gstBreakup.cgst_2_5 > 0 && (
                      <>
                        <div>CGST 2.5%: ₹{calculatedData.gstBreakup.cgst_2_5.toFixed(2)}</div>
                        <div>SGST 2.5%: ₹{calculatedData.gstBreakup.sgst_2_5.toFixed(2)}</div>
                      </>
                    )}
                    {calculatedData.gstBreakup.cgst_1_5 > 0 && (
                      <>
                        <div>CGST 1.5%: ₹{calculatedData.gstBreakup.cgst_1_5.toFixed(2)}</div>
                        <div>SGST 1.5%: ₹{calculatedData.gstBreakup.sgst_1_5.toFixed(2)}</div>
                      </>
                    )}
                    {calculatedData.gstBreakup.igst_28 > 0 && (
                      <div>IGST 28%: ₹{calculatedData.gstBreakup.igst_28.toFixed(2)}</div>
                    )}
                    {calculatedData.gstBreakup.igst_18 > 0 && (
                      <div>IGST 18%: ₹{calculatedData.gstBreakup.igst_18.toFixed(2)}</div>
                    )}
                    {calculatedData.gstBreakup.igst_12 > 0 && (
                      <div>IGST 12%: ₹{calculatedData.gstBreakup.igst_12.toFixed(2)}</div>
                    )}
                    {calculatedData.gstBreakup.igst_5 > 0 && (
                      <div>IGST 5%: ₹{calculatedData.gstBreakup.igst_5.toFixed(2)}</div>
                    )}
                    {calculatedData.gstBreakup.igst_3 > 0 && (
                      <div>IGST 3%: ₹{calculatedData.gstBreakup.igst_3.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingInvoice ? "Update Invoice" : "Save Invoice"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
