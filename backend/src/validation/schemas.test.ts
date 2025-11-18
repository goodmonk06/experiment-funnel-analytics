import { describe, it, expect } from 'vitest';
import {
  ingestEventSchema,
  createProjectSchema,
  createFunnelSchema,
  createExperimentSchema,
} from './schemas';

describe('Validation Schemas', () => {
  describe('ingestEventSchema', () => {
    it('should validate a valid event with userId', () => {
      const data = {
        userId: 'user123',
        event: 'page_view',
        properties: { page: 'home' },
      };

      const result = ingestEventSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate a valid event with anonymousId', () => {
      const data = {
        anonymousId: 'anon123',
        event: 'signup',
      };

      const result = ingestEventSchema.parse(data);
      expect(result.anonymousId).toBe('anon123');
      expect(result.event).toBe('signup');
    });

    it('should reject event without userId or anonymousId', () => {
      const data = {
        event: 'page_view',
      };

      expect(() => ingestEventSchema.parse(data)).toThrow();
    });

    it('should reject event without event name', () => {
      const data = {
        userId: 'user123',
      };

      expect(() => ingestEventSchema.parse(data)).toThrow();
    });

    it('should validate timestamp in ISO format', () => {
      const data = {
        userId: 'user123',
        event: 'page_view',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const result = ingestEventSchema.parse(data);
      expect(result.timestamp).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('createProjectSchema', () => {
    it('should validate a valid project name', () => {
      const data = { name: 'My Project' };
      const result = createProjectSchema.parse(data);
      expect(result.name).toBe('My Project');
    });

    it('should reject empty project name', () => {
      const data = { name: '' };
      expect(() => createProjectSchema.parse(data)).toThrow();
    });

    it('should reject project name longer than 100 characters', () => {
      const data = { name: 'a'.repeat(101) };
      expect(() => createProjectSchema.parse(data)).toThrow();
    });
  });

  describe('createFunnelSchema', () => {
    it('should validate a valid funnel with multiple steps', () => {
      const data = {
        projectId: 'proj123',
        name: 'Signup Flow',
        steps: ['page_view', 'signup', 'subscribe'],
      };

      const result = createFunnelSchema.parse(data);
      expect(result.steps).toHaveLength(3);
    });

    it('should reject funnel with less than 2 steps', () => {
      const data = {
        projectId: 'proj123',
        name: 'Invalid Funnel',
        steps: ['page_view'],
      };

      expect(() => createFunnelSchema.parse(data)).toThrow();
    });

    it('should reject funnel without projectId', () => {
      const data = {
        name: 'Funnel',
        steps: ['step1', 'step2'],
      };

      expect(() => createFunnelSchema.parse(data)).toThrow();
    });
  });

  describe('createExperimentSchema', () => {
    it('should validate a valid experiment', () => {
      const data = {
        projectId: 'proj123',
        key: 'button_test',
        variants: ['control', 'variant_a', 'variant_b'],
      };

      const result = createExperimentSchema.parse(data);
      expect(result.variants).toHaveLength(3);
    });

    it('should reject experiment with less than 2 variants', () => {
      const data = {
        projectId: 'proj123',
        key: 'invalid_test',
        variants: ['control'],
      };

      expect(() => createExperimentSchema.parse(data)).toThrow();
    });

    it('should validate experiment with status', () => {
      const data = {
        projectId: 'proj123',
        key: 'test',
        variants: ['a', 'b'],
        status: 'paused' as const,
      };

      const result = createExperimentSchema.parse(data);
      expect(result.status).toBe('paused');
    });

    it('should reject invalid status', () => {
      const data = {
        projectId: 'proj123',
        key: 'test',
        variants: ['a', 'b'],
        status: 'invalid',
      };

      expect(() => createExperimentSchema.parse(data)).toThrow();
    });
  });
});
