import mongoose from 'mongoose';
import dns from 'dns';

// Ensure reliable SRV resolution on Windows environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore fallback
}

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is missing. Please define MONGODB_URI in your .env file.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    const activeDbName = conn.connection.name || 'bride_wedding_invitation';
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}/${activeDbName}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', (error as Error).message);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed.');
  }
};

export const isDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
