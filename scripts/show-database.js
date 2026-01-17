const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function showDatabase() {
  try {
    console.log('🔍 Connecting to Neon database...')
    await prisma.$connect()
    console.log('✅ Connected successfully!')
    
    // Get all invoices with their details
    console.log('\n📊 All Invoices in Database:')
    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
        gstBreakup: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (invoices.length === 0) {
      console.log('❌ No invoices found in database')
      return
    }
    
    console.log(`\n📋 Found ${invoices.length} invoices:`)
    console.log('=' .repeat(80))
    
    invoices.forEach((invoice, index) => {
      console.log(`\n${index + 1}. ${invoice.type.toUpperCase()} INVOICE`)
      console.log(`   Invoice No: ${invoice.invoiceNo}`)
      console.log(`   Party: ${invoice.party}`)
      console.log(`   GST Number: ${invoice.gstNumber || 'N/A'}`)
      console.log(`   Date: ${invoice.date}`)
      console.log(`   Basic Amount: ₹${invoice.basicAmount}`)
      console.log(`   Total Amount: ₹${invoice.totalAmount}`)
      console.log(`   Status: ${invoice.isCancelled ? 'CANCELLED' : 'ACTIVE'}`)
      console.log(`   Created: ${invoice.createdAt}`)
      
      if (invoice.items && invoice.items.length > 0) {
        console.log(`   Items:`)
        invoice.items.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. Amount: ₹${item.amount}, Tax: ${item.taxRate}% (${item.taxType})`)
        })
      }
      
      if (invoice.gstBreakup) {
        console.log(`   GST Breakdown:`)
        const gst = invoice.gstBreakup
        if (gst.cgst_14 > 0) console.log(`     CGST 14%: ₹${gst.cgst_14}, SGST 14%: ₹${gst.sgst_14}`)
        if (gst.cgst_9 > 0) console.log(`     CGST 9%: ₹${gst.cgst_9}, SGST 9%: ₹${gst.sgst_9}`)
        if (gst.cgst_6 > 0) console.log(`     CGST 6%: ₹${gst.cgst_6}, SGST 6%: ₹${gst.sgst_6}`)
        if (gst.igst_28 > 0) console.log(`     IGST 28%: ₹${gst.igst_28}`)
        if (gst.igst_18 > 0) console.log(`     IGST 18%: ₹${gst.igst_18}`)
        if (gst.igst_12 > 0) console.log(`     IGST 12%: ₹${gst.igst_12}`)
        if (gst.igst_5 > 0) console.log(`     IGST 5%: ₹${gst.igst_5}`)
        if (gst.igst_3 > 0) console.log(`     IGST 3%: ₹${gst.igst_3}`)
      }
    })
    
    // Calculate totals
    const saleInvoices = invoices.filter(inv => inv.type === 'sale' && !inv.isCancelled)
    const purchaseInvoices = invoices.filter(inv => inv.type === 'purchase' && !inv.isCancelled)
    
    const saleTotal = saleInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const purchaseTotal = purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    
    console.log('\n' + '=' .repeat(80))
    console.log('📈 SUMMARY STATISTICS')
    console.log('=' .repeat(80))
    console.log(`Total Sale Invoices: ${saleInvoices.length} (₹${saleTotal})`)
    console.log(`Total Purchase Invoices: ${purchaseInvoices.length} (₹${purchaseTotal})`)
    console.log(`Net Amount: ₹${saleTotal - purchaseTotal}`)
    console.log(`Total Invoices: ${invoices.length}`)
    
    console.log('\n🎉 Database query completed successfully!')
    console.log('💡 You can now check your Neon dashboard to see this data!')
    
  } catch (error) {
    console.error('❌ Database query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showDatabase()
