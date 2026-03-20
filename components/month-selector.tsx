"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MonthEntry } from "@/lib/api-client"

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

interface MonthSelectorProps {
  months: MonthEntry[]
  selectedMonth: number | null
  selectedYear: number | null
  onChange: (month: number | null, year: number | null) => void
}

export default function MonthSelector({
  months,
  selectedMonth,
  selectedYear,
  onChange,
}: MonthSelectorProps) {
  const value =
    selectedMonth !== null && selectedYear !== null
      ? `${selectedMonth}-${selectedYear}`
      : "all"

  const handleChange = (val: string) => {
    if (val === "all") {
      onChange(null, null)
    } else {
      const [m, y] = val.split("-").map(Number)
      onChange(m, y)
    }
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Months</SelectItem>
        {months.map((entry) => (
          <SelectItem
            key={`${entry.month}-${entry.year}`}
            value={`${entry.month}-${entry.year}`}
          >
            {MONTH_NAMES[entry.month]} {entry.year} ({entry.saleCount}S / {entry.purchaseCount}P)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
