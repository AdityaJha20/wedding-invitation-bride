import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';

const run = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('\n❌ ERROR: Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.');
    console.error('Please configure them in your .env file or run with:');
    console.error('ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="your_password" npm run create-admin\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`\n❌ ERROR: "${email}" is not a valid email address.\n`);
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n❌ ERROR: Admin password must be at least 6 characters long.\n');
    process.exit(1);
  }

  try {
    console.log('[Setup] Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('[Setup] Hashing admin password with bcrypt...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Upsert admin record
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email },
      {
        email,
        passwordHash,
        role: 'admin',
        isActive: true,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    console.log(`\n✅ SUCCESS: Administrator account created/updated.`);
    console.log(`👤 Admin Email: ${updatedAdmin.email}`);
    console.log(`🛡️  Role: ${updatedAdmin.role}`);
    console.log(`🔑 Password: [SECURELY HASHED WITH BCRYPT - NEVER STORED IN PLAINTEXT]\n`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Failed to create admin account:', (error as Error).message);
    try {
      await disconnectDB();
    } catch {
      // Ignore disconnect error on failure
    }
    process.exit(1);
  }
};

run();
