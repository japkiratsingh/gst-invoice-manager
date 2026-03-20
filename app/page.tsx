"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Receipt, Upload } from "lucide-react"
import InvoiceTypeSelector from "@/components/invoice-type-selector"
import InvoiceForm from "@/components/invoice-form"
import InvoiceTable from "@/components/invoice-table"
import CSVImportFrontend from "@/components/csv-import-frontend"
import FrontendExport from "@/components/frontend-export"
import MonthSelector from "@/components/month-selector"
import type { Invoice, InvoiceType } from "@/lib/types"
import { apiClient, type MonthEntry, type SummaryData } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function GST_InvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [months, setMonths] = useState<MonthEntry[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [currentInvoiceType, setCurrentInvoiceType] = useState<InvoiceType | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<InvoiceType>("sale")
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryData | null>(null)

  const { toast } = useToast()

  const loadMonths = useCallback(async () => {
    try {
      const data = await apiClient.getMonths()
      setMonths(data)
      return data
    } catch (error) {
      console.error("Error loading months:", error)
      return []
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params: { type: string; month?: number; year?: number } = { type: activeTab }
      if (selectedMonth !== null && selectedYear !== null) {
        params.month = selectedMonth
        params.year = selectedYear
      }
      const data = await apiClient.getInvoices(params)
      setInvoices(data)

      // Load summary
      const summaryData = await apiClient.getSummary(params)
      setSummary(summaryData)
    } catch (error) {
      console.error("Error loading invoices:", error)
      toast({
        title: "Error",
        description: "Failed to load invoices from server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedMonth, selectedYear, toast])

  useEffect(() => {
    loadMonths()
  }, [loadMonths])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const handleMonthChange = (month: number | null, year: number | null) => {
    setSelectedMonth(month)
    setSelectedYear(year)
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

  const handleAddInvoice = async (invoice: Invoice) => {
    try {
      if (editingInvoice) {
        await apiClient.updateInvoice(editingInvoice.id, invoice)
        setEditingInvoice(null)
        toast({
          title: "Invoice Updated",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been updated successfully.`,
        })
      } else {
        await apiClient.createInvoice(invoice)
        toast({
          title: "Invoice Added",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been added successfully.`,
        })
      }

      setShowForm(false)
      setCurrentInvoiceType(null)
      setActiveTab(invoice.type)
      await loadInvoices()
      await loadMonths()
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save invoice",
        variant: "destructive",
      })
    }
  }

  const handleCSVImportComplete = async (results: { successful: Invoice[]; failed: { invoice: Invoice; error: string }[] }) => {
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

    await loadInvoices()
    await loadMonths()
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setCurrentInvoiceType(invoice.type)
    setShowForm(true)
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === id)
      if (!invoice) return

      await apiClient.deleteInvoice(id)

      toast({
        title: "Invoice Deleted",
        description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been deleted.`,
        variant: "destructive",
      })

      await loadInvoices()
      await loadMonths()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      })
    }
  }

  const handleCancelInvoice = async (id: string) => {
    try {
      const invoice = invoices.find((inv) => inv.id === id)
      if (!invoice) return

      await apiClient.cancelInvoice(id)

      toast({
        title: "Invoice Cancelled",
        description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} has been cancelled.`,
        variant: "destructive",
      })

      await loadInvoices()
      await loadMonths()
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

  if (loading && invoices.length === 0) {
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
              Manage sale &amp; purchase invoices with GST breakup, CSV import/export
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

            <FrontendExport
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
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
            existingInvoices={invoices}
          />
        )}

        {/* Tab Navigation + Month Selector */}
        {!showForm && !showTypeSelector && !showCSVImport && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <MonthSelector
                    months={months}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onChange={handleMonthChange}
                  />
                  <div className="flex space-x-1">
                    <Button
                      variant={activeTab === "sale" ? "default" : "outline"}
                      onClick={() => setActiveTab("sale")}
                      className="flex items-center gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      Sale
                    </Button>
                    <Button
                      variant={activeTab === "purchase" ? "default" : "outline"}
                      onClick={() => setActiveTab("purchase")}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Purchase
                    </Button>
                  </div>
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
                  <FrontendExport
                    invoiceType={activeTab}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
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
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onCancel={handleCancelInvoice}
            invoiceType={activeTab}
          />
        )}

        {/* Summary */}
        {!showForm && !showTypeSelector && !showCSVImport && summary && summary.totalCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Summary — {activeTab === "sale" ? "Sale" : "Purchase"}
                {selectedMonth !== null && selectedYear !== null
                  ? ` (${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][selectedMonth]} ${selectedYear})`
                  : " (All Months)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="font-medium">Active / Cancelled</p>
                  <p className="text-2xl font-bold">
                    {summary.activeCount}{" "}
                    <span className="text-sm font-normal text-gray-500">/ {summary.cancelledCount} cancelled</span>
                  </p>
                </div>
                <div>
                  <p className="font-medium">Basic Amount</p>
                  <p className="text-2xl font-bold">₹{summary.basicAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Tax</p>
                  <p className="text-2xl font-bold">₹{summary.totalTax.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">₹{summary.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold">{summary.totalCount}</p>
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
