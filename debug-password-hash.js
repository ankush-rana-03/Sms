const bcrypt = require('bcryptjs');

async function debugPasswordHash() {
  console.log('🔍 Debugging Password Hashing\n');
  
  const plainPassword = 'newresetpassword123';
  
  console.log('Original password:', plainPassword);
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  console.log('Hashed password:', hashedPassword);
  
  // Test comparison
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Password matches:', isMatch);
  
  // Test with a different password
  const wrongPassword = 'wrongpassword';
  const isWrongMatch = await bcrypt.compare(wrongPassword, hashedPassword);
  console.log('Wrong password matches:', isWrongMatch);
  
  console.log('\n✅ Password hashing test completed');
}

debugPasswordHash().catch(console.error);