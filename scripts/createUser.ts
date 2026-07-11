import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';

async function createUser() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run create-user -- <email> <password>');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('FATAL: MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`User with email "${email}" already exists.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });

    console.log(`User created successfully:`);
    console.log(`  ID:    ${user._id}`);
    console.log(`  Email: ${user.email}`);
  } catch (err) {
    console.error('Failed to create user:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createUser();
