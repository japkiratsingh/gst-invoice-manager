export type InvoiceType = "sale" | "purchase"
export type TaxType = "CGST_SGST" | "IGST"

export interface TaxItem {
  id: string
  amount: number
  taxType: TaxType
  taxRate: 28 | 18 | 12 | 5 | 3
  inclusive: boolean
}

export interface GSTBreakup {
  cgst_14: number // 28% / 2
  sgst_14: number // 28% / 2
  cgst_9: number // 18% / 2
  sgst_9: number // 18% / 2
  cgst_6: number // 12% / 2
  sgst_6: number // 12% / 2
  cgst_2_5: number // 5% / 2
  sgst_2_5: number // 5% / 2
  cgst_1_5: number // 3% / 2
  sgst_1_5: number // 3% / 2
  igst_28: number
  igst_18: number
  igst_12: number
  igst_5: number
  igst_3: number
}

export interface Invoice {
  id: string
  type: InvoiceType
  date: string
  invoiceNo: string
  party: string
  gstNumber?: string
  items: TaxItem[]
  basicAmount: number
  totalAmount: number
  gstBreakup: GSTBreakup
  isCancelled?: boolean
  cancelledAt?: string
  cancelledReason?: string
  createdAt?: string
  updatedAt?: string
}
