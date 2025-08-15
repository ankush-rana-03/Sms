const express = require('express');
const app = express();

console.log('=== MINIMAL SERVER TEST ===');

// Basic middleware
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server working' });
});

// Load teachers route
try {
  console.log('Loading teachers route...');
  const teachersRoute = require('./routes/teachers');
  console.log('Teachers route loaded successfully');
  
  app.use('/api/teachers', teachersRoute);
  console.log('Teachers route registered successfully');
  
  // Test route registration
  console.log('Registered routes:');
  app._router.stack.forEach((layer, index) => {
    if (layer.route) {
      console.log(`  ${index}: ${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
    }
  });
  
} catch (error) {
  console.error('Error:', error);
}

// Start server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`\n🚀 Minimal server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log(`  http://localhost:${PORT}/api/test`);
  console.log(`  http://localhost:${PORT}/api/teachers`);
  console.log(`  http://localhost:${PORT}/api/teachers/my-assignments`);
});