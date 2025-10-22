const User = require('../models/User');
const { sendParentCredentials } = require('../services/parentNotificationService');

// Generate parent email from student data
const generateParentEmail = (parentName, parentPhone, studentId) => {
  // Clean parent name for email
  const cleanParentName = parentName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  // Get last 4 digits of phone
  const phoneLast4 = parentPhone.slice(-4);
  
  // Get last 4 characters of student ID
  const studentIdLast4 = studentId.toString().slice(-4);
  
  return `parent.${cleanParentName}.${phoneLast4}${studentIdLast4}@school.com`;
};

// Generate simple password
const generateSimplePassword = () => {
  const adjectives = ['happy', 'bright', 'smart', 'kind', 'wise', 'brave', 'calm', 'cool', 'gentle', 'strong'];
  const nouns = ['star', 'moon', 'sun', 'tree', 'bird', 'fish', 'cat', 'dog', 'rose', 'wave'];
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
};

// Create parent account and send credentials
const createParentAccount = async (studentData, studentId) => {
  try {
    const { parentName, parentPhone, address } = studentData;
    
    // Generate parent email
    const parentEmail = generateParentEmail(parentName, parentPhone, studentId);
    
    // Check if parent already exists
    const existingParent = await User.findOne({ email: parentEmail });
    if (existingParent) {
      console.log(`Parent account already exists for ${parentEmail}`);
      return existingParent._id;
    }
    
    // Generate password
    const password = generateSimplePassword();
    
    // Create parent user
    const parentUser = await User.create({
      name: parentName,
      email: parentEmail,
      password: password,
      role: 'parent',
      phone: parentPhone,
      address: address || 'Not provided',
      isActive: true
    });
    
    console.log(`Created parent account: ${parentUser.email} with password: ${password}`);
    
    // Send credentials email (async, don't wait for it)
    sendParentCredentials(parentUser._id, studentData.name)
      .then(result => {
        console.log(`Parent credentials email sent to ${parentUser.email}`);
      })
      .catch(error => {
        console.error(`Failed to send parent credentials email:`, error);
      });
    
    return parentUser._id;
    
  } catch (error) {
    console.error('Error creating parent account:', error);
    throw error;
  }
};

module.exports = {
  generateParentEmail,
  generateSimplePassword,
  createParentAccount
};