import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { validateRequest } from './middleware/validator';
import { initializeDatabase, pool } from './database';
import { setupWebSocket } from './websocket';

// Routes
import projectRoutes from './routes/projects';
import conversationRoutes from './routes/conversations';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  logger.warn('WARNING: SESSION_SECRET not set, using insecure default. Set SESSION_SECRET in production.');
}
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Global error handlers — prevent crashes from unhandled async errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Create Express app with WebSocket support
    const app = express();
    const wsInstance = expressWs(app);

    // Redis client for sessions with error/reconnect handling
    const redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    await redisClient.connect();
    logger.info('Redis connected');

    // Middleware
    app.use(cors({
      origin: CORS_ORIGIN,
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session management
    app.use(session({
      store: new RedisStore({ client: redisClient }),
      secret: SESSION_SECRET || 'dev-only-insecure-default',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      }
    }));

    // Rate limiting
    app.use(rateLimiter);

    // Routes
    app.use('/api/health', healthRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/conversations', conversationRoutes);
    app.use('/api/users', userRoutes);

    // WebSocket setup
    setupWebSocket(wsInstance.app);

    // Serve frontend static files from production build
    const frontendDist = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });

    // Error handling
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS origin: ${CORS_ORIGIN}`);
    });

    // Graceful shutdown for both SIGTERM and SIGINT
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      await redisClient.quit().catch(() => {});
      await pool.end().catch(() => {});
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
