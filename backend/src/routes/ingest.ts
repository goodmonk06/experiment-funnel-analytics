import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticateApiKey } from '../middleware/auth';

interface IngestEventBody {
  userId?: string;
  anonymousId?: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export async function ingestRoutes(app: FastifyInstance) {
  app.post(
    '/ingest/event',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      const body = request.body as IngestEventBody;
      const project = (request as any).project;

      // Validate required fields
      if (!body.event) {
        return reply.status(400).send({ error: 'Event name is required' });
      }

      const userIdOrAnonId = body.userId || body.anonymousId;
      if (!userIdOrAnonId) {
        return reply.status(400).send({
          error: 'Either userId or anonymousId is required',
        });
      }

      try {
        const event = await prisma.event.create({
          data: {
            projectId: project.id,
            userIdOrAnonId,
            name: body.event,
            propertiesJson: JSON.stringify(body.properties || {}),
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
          },
        });

        return reply.status(201).send({
          success: true,
          eventId: event.id,
        });
      } catch (error) {
        console.error('Error creating event:', error);
        return reply.status(500).send({ error: 'Failed to create event' });
      }
    }
  );

  // Batch ingestion endpoint
  app.post(
    '/ingest/events',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      const body = request.body as { events: IngestEventBody[] };
      const project = (request as any).project;

      if (!Array.isArray(body.events) || body.events.length === 0) {
        return reply.status(400).send({ error: 'Events array is required' });
      }

      try {
        const events = body.events.map((evt) => ({
          projectId: project.id,
          userIdOrAnonId: evt.userId || evt.anonymousId || '',
          name: evt.event,
          propertiesJson: JSON.stringify(evt.properties || {}),
          timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
        }));

        await prisma.event.createMany({
          data: events,
        });

        return reply.status(201).send({
          success: true,
          count: events.length,
        });
      } catch (error) {
        console.error('Error creating events:', error);
        return reply.status(500).send({ error: 'Failed to create events' });
      }
    }
  );
}
