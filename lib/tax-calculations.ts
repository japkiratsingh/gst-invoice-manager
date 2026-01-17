import type { TaxItem, GSTBreakup } from "./types"

export function calculateTax(items: TaxItem[]) {
  let totalBasicAmount = 0
  let totalAmount = 0

  const gstBreakup: GSTBreakup = {
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
  }

  items.forEach((item) => {
    if (item.amount <= 0) return

    let basicAmount: number
    let taxAmount: number

    if (item.inclusive) {
      // Reverse calculation: amount includes GST
      const taxMultiplier = 1 + item.taxRate / 100
      basicAmount = item.amount / taxMultiplier
      taxAmount = item.amount - basicAmount
    } else {
      // Forward calculation: amount excludes GST
      basicAmount = item.amount
      taxAmount = (item.amount * item.taxRate) / 100
    }

    totalBasicAmount += basicAmount
    totalAmount += basicAmount + taxAmount

    // Distribute tax amount to appropriate GST columns
    if (item.taxType === "CGST_SGST") {
      const halfTax = taxAmount / 2

      switch (item.taxRate) {
        case 28:
          gstBreakup.cgst_14 += halfTax
          gstBreakup.sgst_14 += halfTax
          break
        case 18:
          gstBreakup.cgst_9 += halfTax
          gstBreakup.sgst_9 += halfTax
          break
        case 12:
          gstBreakup.cgst_6 += halfTax
          gstBreakup.sgst_6 += halfTax
          break
        case 5:
          gstBreakup.cgst_2_5 += halfTax
          gstBreakup.sgst_2_5 += halfTax
          break
        case 3:
          gstBreakup.cgst_1_5 += halfTax
          gstBreakup.sgst_1_5 += halfTax
          break
      }
    } else if (item.taxType === "IGST") {
      switch (item.taxRate) {
        case 28:
          gstBreakup.igst_28 += taxAmount
          break
        case 18:
          gstBreakup.igst_18 += taxAmount
          break
        case 12:
          gstBreakup.igst_12 += taxAmount
          break
        case 5:
          gstBreakup.igst_5 += taxAmount
          break
        case 3:
          gstBreakup.igst_3 += taxAmount
          break
      }
    }
  })

  return {
    basicAmount: totalBasicAmount,
    totalAmount: totalAmount,
    gstBreakup,
  }
}
