const express = require('express');
const app = express();

console.log('=== TESTING MINIMAL SERVER ===');

// Basic middleware
app.use(express.json());

// Test basic route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Try to load teachers route
try {
  console.log('Loading teachers route...');
  const teachersRoute = require('./routes/teachers');
  console.log('Teachers route loaded successfully');
  
  app.use('/api/teachers', teachersRoute);
  console.log('Teachers route registered successfully');
  
} catch (error) {
  console.error('Error loading teachers route:', error);
}

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test the routes:');
  console.log(`  http://localhost:${PORT}/api/test`);
  console.log(`  http://localhost:${PORT}/api/teachers`);
});