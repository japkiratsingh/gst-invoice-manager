// Frontend-only CSV parsing utilities
export interface CSVRow {
  [key: string]: string
}

export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const row: CSVRow = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ""
    })
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

// Date formatting utilities
export function formatDateToDDMMYYYY(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export function parseDateFromDDMMYYYY(dateString: string): string {
  if (!dateString) return ""

  try {
    // Handle DD-MM-YYYY format
    if (dateString.includes("-") && dateString.split("-").length === 3) {
      const parts = dateString.split("-")
      if (parts[0].length === 2) {
        // DD-MM-YYYY format
        const [day, month, year] = parts
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        return date.toISOString().split("T")[0]
      }
    }

    // Fallback to standard date parsing
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  } catch {
    return ""
  }
}
