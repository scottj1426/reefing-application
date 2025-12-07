/// <reference path="./types/express.d.ts" />
import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.route';
import aquariumsRouter from './routes/aquariums.route';
import equipmentRouter from './routes/equipment.route';
import coralsRouter from './routes/corals.route';
import publicRouter from './routes/public.route';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost origins
    if (origin.startsWith('http://localhost:')) {
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/users', usersRouter);
app.use('/aquariums', aquariumsRouter);
app.use('/aquariums', equipmentRouter);
app.use('/aquariums', coralsRouter);
app.use('/public', publicRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Reefing API' });
});

export default app;
