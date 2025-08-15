const express = require('express');
const app = express();

console.log('=== DEBUGGING TEACHERS ROUTE ===');

try {
  console.log('1. Attempting to require teachers route...');
  const teachersRoute = require('./routes/teachers');
  console.log('✅ Teachers route loaded successfully');
  
  console.log('2. Checking route structure...');
  console.log('Router type:', typeof teachersRoute);
  console.log('Router stack length:', teachersRoute.stack ? teachersRoute.stack.length : 'No stack');
  
  if (teachersRoute.stack) {
    console.log('3. Registered routes:');
    teachersRoute.stack.forEach((layer, index) => {
      if (layer.route) {
        console.log(`   ${index}: ${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
      }
    });
  }
  
  console.log('4. Testing route registration...');
  app.use('/api/teachers', teachersRoute);
  console.log('✅ Route registered successfully');
  
  console.log('5. Final app routes:');
  if (app._router && app._router.stack) {
    app._router.stack.forEach((layer, index) => {
      if (layer.route) {
        console.log(`   ${index}: ${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
      }
    });
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}