import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDB, disconnectDB } from './db';
import { ingestRoutes } from './routes/ingest';
import { projectRoutes } from './routes/projects';
import { funnelRoutes } from './routes/funnels';
import { experimentRoutes } from './routes/experiments';
import { errorHandler } from './utils/errors';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
  });

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Connect to database
  await connectDB();

  // Health check
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(ingestRoutes);
  await app.register(projectRoutes);
  await app.register(funnelRoutes);
  await app.register(experimentRoutes);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await disconnectDB();
    await app.close();
    process.exit(0);
  });

  // Start server
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Analytics API ready for ingestion\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
