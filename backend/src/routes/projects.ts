import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { createProjectSchema } from '../validation/schemas';
import { AppError } from '../utils/errors';

export async function projectRoutes(app: FastifyInstance) {
  // List all projects
  app.get('/projects', async (request, reply) => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ projects });
  });

  // Get a single project
  app.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
            funnelDefinitions: true,
            experimentDefinitions: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return reply.send({ project });
  });

  // Create a new project
  app.post('/projects', async (request, reply) => {
    const validated = createProjectSchema.parse(request.body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
      },
    });

    return reply.status(201).send({ project });
  });

  // Delete a project
  app.delete('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.project.delete({
      where: { id },
    });

    return reply.send({ success: true });
  });
}
