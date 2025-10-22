const mongoose = require('mongoose');
const { sendCredentialsToAllParents } = require('../services/parentNotificationService');
require('dotenv').config();

async function sendParentCredentials() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== SENDING PARENT CREDENTIALS ===');
    
    const results = await sendCredentialsToAllParents();
    
    console.log('\n=== RESULTS ===');
    console.log(`Emails sent: ${results.sent}`);
    console.log(`Failed: ${results.failed}`);
    
    console.log('\n=== DETAILED RESULTS ===');
    results.details.forEach((detail, index) => {
      console.log(`\n${index + 1}. Parent: ${detail.parent}`);
      console.log(`   Email: ${detail.email}`);
      console.log(`   Student: ${detail.student || 'N/A'}`);
      console.log(`   Status: ${detail.status}`);
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

sendParentCredentials();