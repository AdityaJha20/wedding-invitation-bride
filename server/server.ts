import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`\n=================================================`);
      console.log(`💍 Manya & Sarthak Wedding Backend Server`);
      console.log(`🚀 Running at: http://localhost:${PORT}`);
      console.log(`🔒 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`💌 Wishes API: http://localhost:${PORT}/api/wishes`);
      console.log(`🛡️  Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`=================================================\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed out remaining connections. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to initialize server:', (error as Error).message);
    process.exit(1);
  }
};

startServer();
