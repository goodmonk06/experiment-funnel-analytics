import { FastifyInstance } from 'fastify';
import { prisma } from '../db';

interface CreateExperimentBody {
  projectId: string;
  key: string;
  variants: string[];
  status?: string;
}

interface AssignVariantBody {
  userId?: string;
  anonymousId?: string;
}

interface ExperimentStatsQuery {
  startDate?: string;
  endDate?: string;
  conversionEvent?: string;
}

export async function experimentRoutes(app: FastifyInstance) {
  // Create an experiment definition
  app.post('/experiments', async (request, reply) => {
    const body = request.body as CreateExperimentBody;

    if (!body.projectId || !body.key || !Array.isArray(body.variants)) {
      return reply.status(400).send({
        error: 'projectId, key, and variants array are required',
      });
    }

    try {
      const experiment = await prisma.experimentDefinition.create({
        data: {
          projectId: body.projectId,
          key: body.key,
          variantsJson: JSON.stringify(body.variants),
          status: body.status || 'active',
        },
      });

      return reply.status(201).send({ experiment });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return reply
          .status(409)
          .send({ error: 'Experiment key already exists for this project' });
      }
      throw error;
    }
  });

  // List experiments for a project
  app.get('/projects/:projectId/experiments', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const experiments = await prisma.experimentDefinition.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      experiments: experiments.map((e) => ({
        ...e,
        variants: JSON.parse(e.variantsJson),
      })),
    });
  });

  // Assign a user to a variant
  app.post('/experiments/:experimentKey/assign', async (request, reply) => {
    const { experimentKey } = request.params as { experimentKey: string };
    const body = request.body as AssignVariantBody;

    const userIdOrAnonId = body.userId || body.anonymousId;
    if (!userIdOrAnonId) {
      return reply.status(400).send({
        error: 'Either userId or anonymousId is required',
      });
    }

    // Get experiment from header API key
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

    const experiment = await prisma.experimentDefinition.findUnique({
      where: {
        projectId_key: {
          projectId: project.id,
          key: experimentKey,
        },
      },
    });

    if (!experiment) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    if (experiment.status !== 'active') {
      return reply.status(400).send({ error: 'Experiment is not active' });
    }

    // Check if user already assigned
    const existing = await prisma.userExperimentAssignment.findUnique({
      where: {
        projectId_experimentKey_userIdOrAnonId: {
          projectId: project.id,
          experimentKey,
          userIdOrAnonId,
        },
      },
    });

    if (existing) {
      return reply.send({ variant: existing.variant });
    }

    // Assign random variant
    const variants = JSON.parse(experiment.variantsJson) as string[];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    const assignment = await prisma.userExperimentAssignment.create({
      data: {
        projectId: project.id,
        experimentKey,
        userIdOrAnonId,
        variant,
      },
    });

    return reply.status(201).send({ variant: assignment.variant });
  });

  // Get experiment stats (per-variant metrics)
  app.get('/experiments/:experimentId/stats', async (request, reply) => {
    const { experimentId } = request.params as { experimentId: string };
    const query = request.query as ExperimentStatsQuery;

    const experiment = await prisma.experimentDefinition.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    const variants = JSON.parse(experiment.variantsJson) as string[];

    // Build date filter
    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.lte = new Date(query.endDate);
    }

    try {
      const stats = await computeExperimentStats(
        experiment.projectId,
        experiment.key,
        variants,
        query.conversionEvent,
        dateFilter
      );

      return reply.send({
        experiment: {
          id: experiment.id,
          key: experiment.key,
          variants,
          status: experiment.status,
        },
        stats,
      });
    } catch (error) {
      console.error('Error computing experiment stats:', error);
      return reply
        .status(500)
        .send({ error: 'Failed to compute experiment stats' });
    }
  });

  // Update experiment status
  app.patch('/experiments/:experimentId', async (request, reply) => {
    const { experimentId } = request.params as { experimentId: string };
    const body = request.body as { status: string };

    if (!['active', 'paused', 'completed'].includes(body.status)) {
      return reply.status(400).send({
        error: 'Status must be one of: active, paused, completed',
      });
    }

    const experiment = await prisma.experimentDefinition.update({
      where: { id: experimentId },
      data: { status: body.status },
    });

    return reply.send({ experiment });
  });

  // Delete an experiment
  app.delete('/experiments/:experimentId', async (request, reply) => {
    const { experimentId } = request.params as { experimentId: string };

    try {
      await prisma.experimentDefinition.delete({
        where: { id: experimentId },
      });

      return reply.send({ success: true });
    } catch (error) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }
  });
}

async function computeExperimentStats(
  projectId: string,
  experimentKey: string,
  variants: string[],
  conversionEvent?: string,
  dateFilter?: any
) {
  const variantStats = [];

  for (const variant of variants) {
    // Count users assigned to this variant
    const assignmentWhere: any = {
      projectId,
      experimentKey,
      variant,
    };

    if (dateFilter && Object.keys(dateFilter).length > 0) {
      assignmentWhere.assignedAt = dateFilter;
    }

    const assignments = await prisma.userExperimentAssignment.findMany({
      where: assignmentWhere,
      select: { userIdOrAnonId: true },
    });

    const userCount = assignments.length;
    const userIds = assignments.map((a) => a.userIdOrAnonId);

    let conversionCount = 0;
    let conversionRate = 0;

    if (conversionEvent && userIds.length > 0) {
      // Count users who converted
      const eventWhere: any = {
        projectId,
        name: conversionEvent,
        userIdOrAnonId: { in: userIds },
      };

      if (dateFilter && Object.keys(dateFilter).length > 0) {
        eventWhere.timestamp = dateFilter;
      }

      const conversions = await prisma.event.findMany({
        where: eventWhere,
        select: { userIdOrAnonId: true },
        distinct: ['userIdOrAnonId'],
      });

      conversionCount = conversions.length;
      conversionRate = userCount > 0 ? (conversionCount / userCount) * 100 : 0;
    }

    variantStats.push({
      variant,
      userCount,
      conversionCount,
      conversionRate: Number(conversionRate.toFixed(2)),
    });
  }

  return {
    variants: variantStats,
    totalUsers: variantStats.reduce((sum, v) => sum + v.userCount, 0),
    totalConversions: variantStats.reduce((sum, v) => sum + v.conversionCount, 0),
  };
}
