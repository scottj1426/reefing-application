/// <reference path="./types/express.d.ts" />
import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.route';
import aquariumsRouter from './routes/aquariums.route';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
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
app.use('/api/users', usersRouter);
app.use('/api/aquariums', aquariumsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Reefing API' });
});

export default app;
