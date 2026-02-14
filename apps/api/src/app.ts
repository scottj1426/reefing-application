/// <reference path="./types/express.d.ts" />
import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import usersRouter from './routes/users.route';
import aquariumsRouter from './routes/aquariums.route';
import equipmentRouter from './routes/equipment.route';
import coralsRouter from './routes/corals.route';
import publicRouter from './routes/public.route';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // Check against CORS_ORIGIN env var
    const allowedOrigin = process.env.CORS_ORIGIN;
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// ROUTES
// ----------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const host = databaseUrl ? new URL(databaseUrl).host : null;

    const [users, aquariums, corals, equipment] = await Promise.all([
      prisma.user.count(),
      prisma.aquarium.count(),
      prisma.coral.count(),
      prisma.equipment.count(),
    ]);

    res.json({
      success: true,
      dbHost: host,
      counts: {
        users,
        aquariums,
        corals,
        equipment,
      },
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

// S3 health check
app.get('/api/health/s3', async (req, res) => {
  try {
    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) {
      return res.status(500).json({
        success: false,
        error: 'AWS_BUCKET_NAME not configured',
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

export default app;
