const axios = require('axios');

// Test a simple route first
async function testSimpleRoute() {
  try {
    console.log('=== TESTING SIMPLE TEACHERS ROUTE ===');
    
    // Test if the teachers route is accessible at all
    const response = await axios.get('http://localhost:5000/api/teachers');
    
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testSimpleRoute();