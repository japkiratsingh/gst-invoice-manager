const BASE_URL = 'https://gst-invoice-manager-1-hoaubdyqw-japkiratsinghs-projects.vercel.app'

async function testDeployment() {
  const { default: fetch } = await import('node-fetch')
  
  try {
    console.log('🚀 Testing deployed application...')
    console.log(`📍 URL: ${BASE_URL}`)
    
    // Test stats endpoint
    console.log('\n📊 Testing /api/invoices/stats...')
    const statsResponse = await fetch(`${BASE_URL}/api/invoices/stats`)
    const stats = await statsResponse.json()
    console.log('✅ Stats Response:', JSON.stringify(stats, null, 2))
    
    // Test sale invoices endpoint
    console.log('\n📝 Testing /api/invoices/sale...')
    const saleResponse = await fetch(`${BASE_URL}/api/invoices/sale`)
    const saleInvoices = await saleResponse.json()
    console.log('✅ Sale Invoices Response:', JSON.stringify(saleInvoices, null, 2))
    
    // Test purchase invoices endpoint
    console.log('\n📝 Testing /api/invoices/purchase...')
    const purchaseResponse = await fetch(`${BASE_URL}/api/invoices/purchase`)
    const purchaseInvoices = await purchaseResponse.json()
    console.log('✅ Purchase Invoices Response:', JSON.stringify(purchaseInvoices, null, 2))
    
    console.log('\n🎉 Deployment test completed successfully!')
    console.log('🌐 Your GST Invoice Manager is now live and accessible!')
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message)
    console.log('Make sure your application is deployed and accessible')
  }
}

testDeployment()
