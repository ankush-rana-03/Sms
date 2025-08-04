const axios = require('axios');

async function createAdmin() {
  console.log('👨‍💼 Creating Admin User for Testing\n');
  
  const adminData = {
    name: 'Test Admin',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
    phone: '1234567890',
    address: 'Test Address'
  };

  try {
    console.log('📤 Creating admin user...');
    const response = await axios.post('http://localhost:5000/api/auth/register', adminData);
    
    if (response.data.success) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('🎭 Role:', adminData.role);
      console.log('🎫 Token:', response.data.token ? 'Received' : 'Not received');
      
      console.log('\n📋 You can now use these credentials:');
      console.log('Email: admin@school.com');
      console.log('Password: admin123');
      console.log('Role: admin');
      
    } else {
      console.log('❌ Admin creation failed:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('💡 Admin user already exists. You can use:');
      console.log('Email: admin@school.com');
      console.log('Password: admin123');
      console.log('Role: admin');
    }
  }
}

createAdmin().catch(console.error);