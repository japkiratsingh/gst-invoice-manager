"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Receipt, Upload, Loader2, AlertCircle } from "lucide-react"
import InvoiceTypeSelector from "@/components/invoice-type-selector"
import InvoiceForm from "@/components/invoice-form"
import InvoiceTable from "@/components/invoice-table"
import CSVImportFrontend from "@/components/csv-import-frontend"
import FrontendExport from "@/components/frontend-export"
import MonthSelector from "@/components/month-selector"
import type { Invoice, InvoiceType } from "@/lib/types"
import {
  useInvoices,
  useMonths,
  useSummary,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useCancelInvoice,
} from "@/hooks/use-invoices"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function GST_InvoiceManager() {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [currentInvoiceType, setCurrentInvoiceType] = useState<InvoiceType | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<InvoiceType>("sale")

  const { toast } = useToast()

  // React Query hooks
  const invoiceParams = {
    type: activeTab,
    ...(selectedMonth !== null && selectedYear !== null ? { month: selectedMonth, year: selectedYear } : {}),
  }

  const { data: invoices = [], isLoading, isError, error, isFetching } = useInvoices(invoiceParams)
  const { data: months = [] } = useMonths()
  const { data: summary } = useSummary(invoiceParams)

  const createMutation = useCreateInvoice()
  const updateMutation = useUpdateInvoice()
  const deleteMutation = useDeleteInvoice()
  const cancelMutation = useCancelInvoice()

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || cancelMutation.isPending

  // Handlers
  const handleMonthChange = (month: number | null, year: number | null) => {
    setSelectedMonth(month)
    setSelectedYear(year)
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
        await updateMutation.mutateAsync({ id: editingInvoice.id, invoice })
        setEditingInvoice(null)
        toast({
          title: "Invoice Updated",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} updated.`,
        })
      } else {
        await createMutation.mutateAsync(invoice)
        toast({
          title: "Invoice Added",
          description: `${invoice.type === "sale" ? "Sale" : "Purchase"} invoice ${invoice.invoiceNo} added.`,
        })
      }
      setShowForm(false)
      setCurrentInvoiceType(null)
      setActiveTab(invoice.type)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save invoice",
        variant: "destructive",
      })
    }
  }

  const handleCSVImportComplete = (results: { successful: Invoice[]; failed: { invoice: Invoice; error: string }[] }) => {
    setShowCSVImport(false)
    setCurrentInvoiceType(null)
    if (results.failed.length > 0) {
      toast({
        title: "Import Completed with Errors",
        description: `${results.successful.length} imported, ${results.failed.length} failed.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Import Successful",
        description: `${results.successful.length} invoices imported.`,
      })
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setCurrentInvoiceType(invoice.type)
    setShowForm(true)
  }

  const handleDeleteInvoice = async (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id)
    if (!invoice) return
    try {
      await deleteMutation.mutateAsync(id)
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoice.invoiceNo} deleted.`,
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" })
    }
  }

  const handleCancelInvoice = async (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id)
    if (!invoice) return
    try {
      await cancelMutation.mutateAsync(id)
      toast({
        title: "Invoice Cancelled",
        description: `Invoice ${invoice.invoiceNo} cancelled.`,
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error", description: "Failed to cancel invoice", variant: "destructive" })
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setShowTypeSelector(false)
    setShowCSVImport(false)
    setCurrentInvoiceType(null)
    setEditingInvoice(null)
  }

  const isMainView = !showForm && !showTypeSelector && !showCSVImport

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="font-medium text-red-700">Failed to connect to server</p>
            <p className="text-sm text-gray-500 text-center">{error instanceof Error ? error.message : "Unknown error"}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initial loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
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
              onClick={() => setShowTypeSelector(true)}
              className="flex items-center gap-2"
              disabled={!isMainView}
            >
              <Plus className="h-4 w-4" />
              Add New Invoice
            </Button>
            <Button
              onClick={() => setShowCSVImport(true)}
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              disabled={!isMainView}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <FrontendExport selectedMonth={selectedMonth} selectedYear={selectedYear} />
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
            submitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Tab Navigation + Month Selector */}
        {isMainView && (
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
                  {/* Inline fetching/mutating indicator */}
                  {(isFetching || isMutating) && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
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
        {isMainView && (
          <InvoiceTable
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onCancel={handleCancelInvoice}
            invoiceType={activeTab}
            isLoading={isFetching && !isLoading}
            isDeleting={deleteMutation.isPending}
            isCancelling={cancelMutation.isPending}
          />
        )}

        {/* Summary */}
        {isMainView && summary && summary.totalCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Summary — {activeTab === "sale" ? "Sale" : "Purchase"}
                {selectedMonth !== null && selectedYear !== null
                  ? ` (${MONTH_NAMES[selectedMonth]} ${selectedYear})`
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
