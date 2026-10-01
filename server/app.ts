import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import wishRoutes from './routes/wishRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): Application => {
  const app = express();

  // Trust proxy for Render / Cloudflare / reverse proxies (enables correct client IP & proto)
  app.set('trust proxy', 1);

  // Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Let frontend load fonts and cdn assets without conflict
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.RENDER_EXTERNAL_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.indexOf(origin) !== -1 ||
          process.env.NODE_ENV !== 'production' ||
          (process.env.RENDER_EXTERNAL_URL && origin === process.env.RENDER_EXTERNAL_URL) ||
          origin.endsWith('.onrender.com')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parse cookies and JSON bodies
  app.use(cookieParser());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      message: 'Manya & Sarthak Wedding API is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/wishes', wishRoutes);
  app.use('/api/admin', adminRoutes);

  // Catch-all 404 for unmatched /api routes (ensures /api/* is NEVER swallowed by SPA fallback)
  app.use('/api', notFoundHandler);

  // Static assets & SPA Fallback for Single-Service Production Deployment
  const distPath = fs.existsSync(path.resolve(process.cwd(), 'dist'))
    ? path.resolve(process.cwd(), 'dist')
    : path.resolve(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(distPath)) {
    // Serve static files from dist/ (assets, images, etc.)
    app.use(express.static(distPath));

    // SPA fallback: Return index.html for all non-API GET routes (e.g. /, /admin, /admin/login)
    app.use((req: Request, res: Response, next) => {
      // Only handle GET requests for SPA routing
      if (req.method !== 'GET') {
        return next();
      }
      // Hard guard: double check that no /api requests reach here
      if (req.path.startsWith('/api')) {
        return notFoundHandler(req, res);
      }
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  }

  // Central Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
