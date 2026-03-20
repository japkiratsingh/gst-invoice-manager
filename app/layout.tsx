import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GST Invoice Manager',
  description: 'Manage GST sale and purchase invoices with CSV import/export',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
