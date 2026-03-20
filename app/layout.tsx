import type { Metadata } from 'next'
import './globals.css'
import QueryProvider from '@/components/query-provider'

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
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
