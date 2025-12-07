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
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);

    // Allow localhost preview
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow the deployed frontend (environment variable)
    const allowed = process.env.CORS_ORIGIN;
    if (allowed && origin === allowed) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// THIS IS REQUIRED FOR PREFLIGHT ON VERCEL
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// ROUTES
// ----------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

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
