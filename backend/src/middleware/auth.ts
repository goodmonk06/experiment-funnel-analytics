import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';

export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'API key is required' });
  }

  const project = await prisma.project.findUnique({
    where: { apiKey },
  });

  if (!project) {
    return reply.status(401).send({ error: 'Invalid API key' });
  }

  // Attach project to request
  (request as any).project = project;
}
