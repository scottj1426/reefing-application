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

// ----------------------
// CORS CONFIG
// ----------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://reefing-application-web.vercel.app',
  'https://reefing-application-9gjem4yo3-scottj1426-5877s-projects.vercel.app', // Vercel preview
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true); // curl, mobile apps
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests (required for serverless)
app.options('*', cors(corsOptions));

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

// API routes
app.use('/users', usersRouter);
app.use('/aquariums', aquariumsRouter);
app.use('/aquariums', equipmentRouter);
app.use('/aquariums', coralsRouter);
app.use('/public', publicRouter);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Reefing API' });
});

export default app;
