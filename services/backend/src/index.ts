import dotenv from 'dotenv';
import path from 'path';
// Load environment variables before initializing any other modules
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';

// Initialize Supabase Client
import './config/supabase';

import { requestLogger } from './middleware/requestLogger';
import { defaultLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Allow clients to join bus-specific tracking rooms
  socket.on('subscribe:bus', (busId: string) => {
    if (busId) {
      socket.join(`bus:${busId}`);
    }
  });

  socket.on('unsubscribe:bus', (busId: string) => {
    if (busId) {
      socket.leave(`bus:${busId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin.split(','),
    credentials: true,
  })
);
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on API routes
app.use('/api', defaultLimiter);

// Mount main API v1 router
app.use('/api/v1', apiRouter);

// Central error handler
app.use(errorHandler);

// Global unhandled error handlers
process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

// Start listening
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Captain Campus Backend API (Supabase) is running!`);
  console.log(` Port:         ${PORT}`);
  console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(` Supabase URL: ${process.env.SUPABASE_URL || 'NOT CONFIGURED'}`);
  console.log(`=======================================================`);
});

export { app, server, io };
