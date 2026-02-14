/// <reference path="./types/express.d.ts" />
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import usersRouter from './routes/users.route';
import aquariumsRouter from './routes/aquariums.route';
import equipmentRouter from './routes/equipment.route';
import coralsRouter from './routes/corals.route';
import publicRouter from './routes/public.route';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production';

// Security headers
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many uploads, please try again later' },
});

app.use('/api/', apiLimiter);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow localhost
    if (!isProduction && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow this project's Vercel deployments
    if (origin.endsWith('.vercel.app') && origin.includes('reefing-application')) {
      return callback(null, true);
    }

    // Check against CORS_ORIGIN env var (strip trailing slash for comparison)
    const allowedOrigin = process.env.CORS_ORIGIN?.replace(/\/$/, '');
    if (allowedOrigin && origin === allowedOrigin) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// ----------------------
// Body parsers
// ----------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ----------------------
// ROUTES
// ----------------------

// Health check (public, lightweight)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health checks require auth
app.get('/api/health/db', authMiddleware, async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/health/s3', authMiddleware, async (req, res) => {
  try {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) {
      return res.status(500).json({
        success: false,
        error: 'S3 not configured',
        timestamp: new Date().toISOString(),
      });
    }
    const s3Config: any = { region: process.env.AWS_REGION || 'us-east-1' };
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    const s3 = new S3Client(s3Config);
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'S3 health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/aquariums', aquariumsRouter);
app.use('/api/aquariums', equipmentRouter);
app.use('/api/aquariums', coralsRouter);
app.use('/api/public', publicRouter);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Reefing API' });
});

export { uploadLimiter };
export default app;
