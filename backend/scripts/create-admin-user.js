const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function upsertAdmin() {
	const email = 'admin@school.com';
	const password = 'test123';
	const name = 'Administrator';

	const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
	console.log('Connecting to MongoDB:', mongoUri.replace(/:\/\/.+@/, '://****@'));
	await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

	try {
		let user = await User.findOne({ email });
		if (user) {
			console.log('Admin user already exists. Updating password and ensuring role...');
			user.password = password;
			user.role = 'admin';
			user.isActive = true;
			await user.save();
			console.log('✅ Admin user updated');
		} else {
			console.log('Creating new admin user...');
			user = await User.create({
				name,
				email,
				password,
				role: 'admin',
				phone: '0000000000',
				address: 'N/A',
				isActive: true
			});
			console.log('✅ Admin user created');
		}
		console.log('Email:', email);
		console.log('Password:', password);
		console.log('Role:', 'admin');
	} catch (err) {
		console.error('Failed to upsert admin:', err.message);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	}
}

upsertAdmin().catch((e) => { console.error(e); process.exit(1); });