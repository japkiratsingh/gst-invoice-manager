const BASE_URL = 'http://localhost:3001'

async function testAPI() {
  const { default: fetch } = await import('node-fetch')
  try {
    console.log('🚀 Testing API endpoints...')
    
    // Test stats endpoint
    console.log('📊 Testing /api/invoices/stats...')
    const statsResponse = await fetch(`${BASE_URL}/api/invoices/stats`)
    const stats = await statsResponse.json()
    console.log('✅ Stats:', JSON.stringify(stats, null, 2))
    
    // Test sale invoices endpoint
    console.log('📝 Testing /api/invoices/sale...')
    const saleResponse = await fetch(`${BASE_URL}/api/invoices/sale`)
    const saleInvoices = await saleResponse.json()
    console.log('✅ Sale invoices:', JSON.stringify(saleInvoices, null, 2))
    
    // Test purchase invoices endpoint
    console.log('📝 Testing /api/invoices/purchase...')
    const purchaseResponse = await fetch(`${BASE_URL}/api/invoices/purchase`)
    const purchaseInvoices = await purchaseResponse.json()
    console.log('✅ Purchase invoices:', JSON.stringify(purchaseInvoices, null, 2))
    
    // Test search endpoint
    console.log('🔍 Testing /api/invoices/search...')
    const searchResponse = await fetch(`${BASE_URL}/api/invoices/search?type=sale`)
    const searchResults = await searchResponse.json()
    console.log('✅ Search results:', JSON.stringify(searchResults, null, 2))
    
    console.log('🎉 API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    console.log('Make sure your development server is running on port 3000')
  }
}

testAPI()
