import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI); // ⚠️ confirm this matches your .env variable name

  const result = await User.findOneAndUpdate(
    { email: 'tanishk.20253297@mnnit.ac.in' },
    { role: 'admin' },
    { new: true }
  );

  if (result) {
    console.log(`✅ ${result.email} is now an admin.`);
  } else {
    console.log('❌ No user found with that email — make sure you registered with it first.');
  }

  await mongoose.disconnect();
};

run();
