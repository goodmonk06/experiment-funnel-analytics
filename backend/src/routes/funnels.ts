import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

interface CreateFunnelBody {
  projectId: string;
  name: string;
  steps: string[]; // Array of event names
}

interface ComputeFunnelQuery {
  startDate?: string;
  endDate?: string;
}

export async function funnelRoutes(app: FastifyInstance) {
  // Create a funnel definition
  app.post('/funnels', async (request, reply) => {
    const body = request.body as CreateFunnelBody;

    if (!body.projectId || !body.name || !Array.isArray(body.steps)) {
      return reply.status(400).send({
        error: 'projectId, name, and steps array are required',
      });
    }

    const funnel = await prisma.funnelDefinition.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        stepsJson: JSON.stringify(body.steps),
      },
    });

    return reply.status(201).send({ funnel });
  });

  // List funnels for a project
  app.get('/projects/:projectId/funnels', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const funnels = await prisma.funnelDefinition.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      funnels: funnels.map((f) => ({
        ...f,
        steps: JSON.parse(f.stepsJson),
      })),
    });
  });

  // Compute funnel conversion rates
  app.get('/funnels/:funnelId/compute', async (request, reply) => {
    const { funnelId } = request.params as { funnelId: string };
    const query = request.query as ComputeFunnelQuery;

    const funnel = await prisma.funnelDefinition.findUnique({
      where: { id: funnelId },
    });

    if (!funnel) {
      return reply.status(404).send({ error: 'Funnel not found' });
    }

    const steps = JSON.parse(funnel.stepsJson) as string[];

    // Build date filter
    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.lte = new Date(query.endDate);
    }

    try {
      // Compute funnel conversion
      const funnelData = await computeFunnelConversion(
        funnel.projectId,
        steps,
        dateFilter
      );

      return reply.send({
        funnel: {
          id: funnel.id,
          name: funnel.name,
          steps,
        },
        data: funnelData,
      });
    } catch (error) {
      console.error('Error computing funnel:', error);
      return reply.status(500).send({ error: 'Failed to compute funnel' });
    }
  });

  // Delete a funnel
  app.delete('/funnels/:funnelId', async (request, reply) => {
    const { funnelId } = request.params as { funnelId: string };

    try {
      await prisma.funnelDefinition.delete({
        where: { id: funnelId },
      });

      return reply.send({ success: true });
    } catch (error) {
      return reply.status(404).send({ error: 'Funnel not found' });
    }
  });
}

async function computeFunnelConversion(
  projectId: string,
  steps: string[],
  dateFilter: any
) {
  const stepResults = [];

  // Get users who completed the first step
  let usersInFunnel = new Set<string>();

  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i];

    if (i === 0) {
      // First step: get all users who did this event
      const events = await prisma.event.findMany({
        where: {
          projectId,
          name: stepName,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
        },
        select: {
          userIdOrAnonId: true,
        },
        distinct: ['userIdOrAnonId'],
      });

      usersInFunnel = new Set(events.map((e) => e.userIdOrAnonId));

      stepResults.push({
        step: stepName,
        stepNumber: i + 1,
        userCount: usersInFunnel.size,
        conversionRate: 100,
        dropOffRate: 0,
      });
    } else {
      // Subsequent steps: filter users who also did this event
      const events = await prisma.event.findMany({
        where: {
          projectId,
          name: stepName,
          userIdOrAnonId: { in: Array.from(usersInFunnel) },
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
        },
        select: {
          userIdOrAnonId: true,
        },
        distinct: ['userIdOrAnonId'],
      });

      const usersCompletingStep = new Set(events.map((e) => e.userIdOrAnonId));
      const previousCount = usersInFunnel.size;
      const currentCount = usersCompletingStep.size;
      const conversionRate =
        previousCount > 0 ? (currentCount / previousCount) * 100 : 0;
      const dropOffRate = 100 - conversionRate;

      stepResults.push({
        step: stepName,
        stepNumber: i + 1,
        userCount: currentCount,
        conversionRate: Number(conversionRate.toFixed(2)),
        dropOffRate: Number(dropOffRate.toFixed(2)),
      });

      // Update the set for next iteration
      usersInFunnel = usersCompletingStep;
    }
  }

  // Calculate overall conversion rate
  const overallConversionRate =
    stepResults.length > 0
      ? (stepResults[stepResults.length - 1].userCount /
          stepResults[0].userCount) *
        100
      : 0;

  return {
    steps: stepResults,
    overallConversionRate: Number(overallConversionRate.toFixed(2)),
    totalUsers: stepResults[0]?.userCount || 0,
    convertedUsers: stepResults[stepResults.length - 1]?.userCount || 0,
  };
}
