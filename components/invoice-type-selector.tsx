"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, ShoppingCart, X } from "lucide-react"
import type { InvoiceType } from "@/lib/types"

interface InvoiceTypeSelectorProps {
  onSelect: (type: InvoiceType) => void
  onCancel: () => void
}

export default function InvoiceTypeSelector({ onSelect, onCancel }: InvoiceTypeSelectorProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">What type of invoice do you want to add?</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            onClick={() => onSelect("sale")}
            variant="outline"
            className="h-32 flex flex-col items-center justify-center space-y-4 hover:bg-green-50 hover:border-green-300 transition-colors"
          >
            <Receipt className="h-12 w-12 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Sale Invoice</h3>
              <p className="text-sm text-gray-600">Invoice for goods/services sold</p>
            </div>
          </Button>

          <Button
            onClick={() => onSelect("purchase")}
            variant="outline"
            className="h-32 flex flex-col items-center justify-center space-y-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <ShoppingCart className="h-12 w-12 text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Purchase Invoice</h3>
              <p className="text-sm text-gray-600">Invoice for goods/services purchased</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
