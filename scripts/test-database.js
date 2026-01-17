const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Create a sample sale invoice
    console.log('📝 Creating sample sale invoice...')
    const saleInvoice = await prisma.invoice.create({
      data: {
        type: 'sale',
        date: '2025-01-25',
        invoiceNo: 'SALE-001',
        party: 'Test Customer Pvt Ltd',
        gstNumber: '29ABCDE1234F1Z5',
        basicAmount: 10000.00,
        totalAmount: 11800.00,
        isCancelled: false,
        items: {
          create: [
            {
              amount: 10000.00,
              taxType: 'CGST_SGST',
              taxRate: 18,
              inclusive: false
            }
          ]
        },
        gstBreakup: {
          create: {
            cgst_9: 900.00,
            sgst_9: 900.00,
            igst_28: 0,
            igst_18: 0,
            igst_12: 0,
            igst_5: 0,
            igst_3: 0
          }
        }
      },
      include: {
        items: true,
        gstBreakup: true
      }
    })
    
    console.log('✅ Sale invoice created:', saleInvoice.id)
    
    // Create a sample purchase invoice
    console.log('📝 Creating sample purchase invoice...')
    const purchaseInvoice = await prisma.invoice.create({
      data: {
        type: 'purchase',
        date: '2025-01-25',
        invoiceNo: 'PURCHASE-001',
        party: 'Supplier Company Ltd',
        gstNumber: '27XYZAB5678C9D1',
        basicAmount: 5000.00,
        totalAmount: 5900.00,
        isCancelled: false,
        items: {
          create: [
            {
              amount: 5000.00,
              taxType: 'CGST_SGST',
              taxRate: 18,
              inclusive: false
            }
          ]
        },
        gstBreakup: {
          create: {
            cgst_9: 450.00,
            sgst_9: 450.00,
            igst_28: 0,
            igst_18: 0,
            igst_12: 0,
            igst_5: 0,
            igst_3: 0
          }
        }
      },
      include: {
        items: true,
        gstBreakup: true
      }
    })
    
    console.log('✅ Purchase invoice created:', purchaseInvoice.id)
    
    // Get all invoices
    console.log('📊 Fetching all invoices...')
    const allInvoices = await prisma.invoice.findMany({
      include: {
        items: true,
        gstBreakup: true
      }
    })
    
    console.log(`✅ Found ${allInvoices.length} invoices:`)
    allInvoices.forEach(invoice => {
      console.log(`  - ${invoice.type.toUpperCase()}: ${invoice.invoiceNo} (${invoice.party}) - ₹${invoice.totalAmount}`)
    })
    
    // Get statistics
    console.log('📈 Calculating statistics...')
    const saleInvoices = await prisma.invoice.findMany({
      where: { type: 'sale', isCancelled: false }
    })
    const purchaseInvoices = await prisma.invoice.findMany({
      where: { type: 'purchase', isCancelled: false }
    })
    
    const saleTotal = saleInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const purchaseTotal = purchaseInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    
    console.log('📊 Statistics:')
    console.log(`  - Sale Invoices: ${saleInvoices.length} (Total: ₹${saleTotal})`)
    console.log(`  - Purchase Invoices: ${purchaseInvoices.length} (Total: ₹${purchaseTotal})`)
    console.log(`  - Net Amount: ₹${saleTotal - purchaseTotal}`)
    
    console.log('🎉 Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
