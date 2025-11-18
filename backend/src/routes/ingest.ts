import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ingestEventSchema, ingestEventsSchema } from '../validation/schemas';

export async function ingestRoutes(app: FastifyInstance) {
  app.post(
    '/ingest/event',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      const validated = ingestEventSchema.parse(request.body);
      const project = (request as any).project;

      const userIdOrAnonId = validated.userId || validated.anonymousId!;

      const event = await prisma.event.create({
        data: {
          projectId: project.id,
          userIdOrAnonId,
          name: validated.event,
          propertiesJson: JSON.stringify(validated.properties || {}),
          timestamp: validated.timestamp ? new Date(validated.timestamp) : new Date(),
        },
      });

      return reply.status(201).send({
        success: true,
        eventId: event.id,
      });
    }
  );

  // Batch ingestion endpoint
  app.post(
    '/ingest/events',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      const validated = ingestEventsSchema.parse(request.body);
      const project = (request as any).project;

      const events = validated.events.map((evt) => ({
        projectId: project.id,
        userIdOrAnonId: evt.userId || evt.anonymousId!,
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
    }
  );
}
