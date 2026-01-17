"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Receipt, Upload, Database } from "lucide-react"
import InvoiceTypeSelector from "@/components/invoice-type-selector"
import InvoiceForm from "@/components/invoice-form"
import InvoiceTable from "@/components/invoice-table"
import CSVImportFrontend from "@/components/csv-import-frontend"
import FrontendExport from "@/components/frontend-export"
import type { Invoice, InvoiceType } from "@/lib/types"
import { localStorageService } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function GST_InvoiceManager() {
  const [saleInvoices, setSaleInvoices] = useState<Invoice[]>([])
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([])
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [currentInvoiceType, setCurrentInvoiceType] = useState<InvoiceType | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<InvoiceType>("sale")
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()

  // Load invoices from localStorage on mount
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = () => {
    try {
      setLoading(true)
      const saleData = localStorageService.getInvoices("sale")
      const purchaseData = localStorageService.getInvoices("purchase")

      setSaleInvoices(saleData)
      setPurchaseInvoices(purchaseData)
      console.log(
        `Loaded ${saleData.length} sale invoices and ${purchaseData.length} purchase invoices from localStorage`,
      )
    } catch (error) {
      console.error("Error loading invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load invoices from localStorage",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentInvoices = () => {
    return activeTab === "sale" ? saleInvoices : purchaseInvoices
  }

  const handleAddNewInvoice = () => {
    setShowTypeSelector(true)
  }

  const handleImportCSV = () => {
    setShowCSVImport(true)
  }

  const handleInvoiceTypeSelect = (type: InvoiceType) => {
    setCurrentInvoiceType(type)
    setActiveTab(type)
    setShowTypeSelector(false)
    setShowForm(true)
  }

  const handleAddInvoice = (invoice: Invoice) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        const invoices = localStorageService.getInvoices(invoice.type)
        const updatedInvoices = invoices.map((inv) =>
          inv.id === editingInvoice.id ? { ...invoice, id: editingInvoice.id } : inv,
        )
        localStorageService.saveInvoices(invoice.type, updatedInvoices)

        if (invoice.type === "sale") {
          setSaleInvoices(updatedInvoices)
        } else {
          setPurchaseInvoices(updatedInvoices)
        }

        setEditingInvoice(null)
        toast({
          title: "Invoice Updated",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been updated successfully.`,
        })
      } else {
        // Create new invoice
        localStorageService.addInvoice(invoice)
        loadInvoices() // Reload to get updated data

        toast({
          title: "Invoice Added",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been added successfully.`,
        })
      }

      setShowForm(false)
      setCurrentInvoiceType(null)
      setActiveTab(invoice.type)
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      })
    }
  }

  const handleCSVImportComplete = (results: { successful: Invoice[]; failed: any[] }) => {
    loadInvoices() // Reload data from localStorage
    setShowCSVImport(false)
    setCurrentInvoiceType(null)

    if (results.failed.length > 0) {
      toast({
        title: "Import Completed with Errors",
        description: `${results.successful.length} invoices imported successfully. ${results.failed.length} failed.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Import Successful",
        description: `${results.successful.length} invoices imported successfully.`,
      })
    }

    // Switch to appropriate tab
    const saleImports = results.successful.filter((inv) => inv.type === "sale")
    const purchaseImports = results.successful.filter((inv) => inv.type === "purchase")

    if (saleImports.length > 0) {
      setActiveTab("sale")
    } else if (purchaseImports.length > 0) {
      setActiveTab("purchase")
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setCurrentInvoiceType(invoice.type)
    setShowForm(true)
  }

  const handleDeleteInvoice = (id: string) => {
    try {
      const currentInvoices = getCurrentInvoices()
      const invoice = currentInvoices.find((inv) => inv.id === id)

      if (!invoice) return

      const updatedInvoices = currentInvoices.filter((inv) => inv.id !== id)
      localStorageService.saveInvoices(invoice.type, updatedInvoices)

      if (invoice.type === "sale") {
        setSaleInvoices(updatedInvoices)
      } else {
        setPurchaseInvoices(updatedInvoices)
      }

      toast({
        title: "Invoice Deleted",
        description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been deleted.`,
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  const handleCancelInvoice = (id: string) => {
    try {
      const currentInvoices = getCurrentInvoices()
      const invoice = currentInvoices.find((inv) => inv.id === id)

      if (!invoice) return

      const cancelledInvoice = {
        ...invoice,
        isCancelled: true,
        cancelledAt: new Date().toISOString(),
        cancelledReason: "Invoice cancelled by user",
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
      }

      const updatedInvoices = currentInvoices.map((inv) => (inv.id === id ? cancelledInvoice : inv))

      localStorageService.saveInvoices(invoice.type, updatedInvoices)

      if (invoice.type === "sale") {
        setSaleInvoices(updatedInvoices)
      } else {
        setPurchaseInvoices(updatedInvoices)
      }

      toast({
        title: "Invoice Cancelled",
        description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been cancelled.`,
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error cancelling invoice:", error)
      toast({
        title: "Error",
        description: "Failed to cancel invoice",
        variant: "destructive",
      })
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setShowTypeSelector(false)
    setShowCSVImport(false)
    setCurrentInvoiceType(null)
    setEditingInvoice(null)
  }

  const totalInvoices = saleInvoices.length + purchaseInvoices.length
  const currentInvoices = getCurrentInvoices()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Loading invoices...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">GST Invoice Manager</CardTitle>
            <CardDescription className="text-center">
              Frontend-only CSV import/export with localStorage persistence and DD-MM-YYYY date formatting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={handleAddNewInvoice}
              className="flex items-center gap-2"
              disabled={showForm || showTypeSelector || showCSVImport}
            >
              <Plus className="h-4 w-4" />
              Add New Invoice
            </Button>

            <Button
              onClick={handleImportCSV}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              disabled={showForm || showTypeSelector || showCSVImport}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>

            <FrontendExport />
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800 text-center">
              <span className="inline-flex items-center gap-2">
                <Database className="w-4 h-4" />
                Frontend-only with localStorage - All data persisted locally with DD-MM-YYYY formatting
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Type Selector */}
        {showTypeSelector && <InvoiceTypeSelector onSelect={handleInvoiceTypeSelect} onCancel={handleCancelForm} />}

        {/* CSV Import */}
        {showCSVImport && (
          <CSVImportFrontend
            onImportComplete={handleCSVImportComplete}
            onCancel={handleCancelForm}
            invoiceType={activeTab}
          />
        )}

        {/* Invoice Form */}
        {showForm && currentInvoiceType && (
          <InvoiceForm
            onSubmit={handleAddInvoice}
            onCancel={handleCancelForm}
            editingInvoice={editingInvoice}
            invoiceType={currentInvoiceType}
            existingInvoices={currentInvoiceType === "sale" ? saleInvoices : purchaseInvoices}
          />
        )}

        {/* Tab Navigation */}
        {!showForm && !showTypeSelector && !showCSVImport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <Button
                    variant={activeTab === "sale" ? "default" : "outline"}
                    onClick={() => setActiveTab("sale")}
                    className="flex items-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Sale Invoices ({saleInvoices.length})
                  </Button>
                  <Button
                    variant={activeTab === "purchase" ? "default" : "outline"}
                    onClick={() => setActiveTab("purchase")}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Purchase Invoices ({purchaseInvoices.length})
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCSVImport(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </Button>
                  <FrontendExport invoiceType={activeTab} />
                  <Button
                    onClick={() => {
                      setCurrentInvoiceType(activeTab)
                      setShowForm(true)
                    }}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add {activeTab === "sale" ? "Sale" : "Purchase"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Invoices Table */}
        {!showForm && !showTypeSelector && !showCSVImport && (
          <InvoiceTable
            invoices={currentInvoices}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onCancel={handleCancelInvoice}
            invoiceType={activeTab}
          />
        )}

        {/* Summary */}
        {!showForm && !showTypeSelector && !showCSVImport && totalInvoices > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary - {activeTab === "sale" ? "Sale" : "Purchase"} Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold">{currentInvoices.length}</p>
                </div>
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{currentInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Total Basic Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{currentInvoices.reduce((sum, inv) => sum + inv.basicAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Total Tax</p>
                  <p className="text-2xl font-bold">
                    ₹{currentInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.basicAmount), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Toaster />
      </div>
    </div>
  )
}
