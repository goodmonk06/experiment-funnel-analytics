import { z } from 'zod';

// Ingest schemas
export const ingestEventSchema = z.object({
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
  event: z.string().min(1, 'Event name is required'),
  properties: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
}).refine(
  (data) => data.userId || data.anonymousId,
  { message: 'Either userId or anonymousId is required' }
);

export const ingestEventsSchema = z.object({
  events: z.array(ingestEventSchema).min(1, 'At least one event is required'),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
});

// Funnel schemas
export const createFunnelSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Funnel name is required').max(100),
  steps: z.array(z.string().min(1)).min(2, 'At least 2 steps are required'),
});

export const computeFunnelQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Experiment schemas
export const createExperimentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  key: z.string().min(1, 'Experiment key is required').max(100),
  variants: z.array(z.string().min(1)).min(2, 'At least 2 variants are required'),
  status: z.enum(['active', 'paused', 'completed']).optional(),
});

export const assignVariantSchema = z.object({
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
}).refine(
  (data) => data.userId || data.anonymousId,
  { message: 'Either userId or anonymousId is required' }
);

export const updateExperimentStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']),
});

export const experimentStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  conversionEvent: z.string().optional(),
});

// Type exports
export type IngestEventInput = z.infer<typeof ingestEventSchema>;
export type IngestEventsInput = z.infer<typeof ingestEventsSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateFunnelInput = z.infer<typeof createFunnelSchema>;
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type AssignVariantInput = z.infer<typeof assignVariantSchema>;
export type UpdateExperimentStatusInput = z.infer<typeof updateExperimentStatusSchema>;
