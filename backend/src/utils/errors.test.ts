import { describe, it, expect } from 'vitest';
import { AppError } from './errors';

describe('AppError', () => {
  it('should create an error with status code and message', () => {
    const error = new AppError(404, 'Resource not found');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
    expect(error.name).toBe('AppError');
  });

  it('should create an error with details', () => {
    const error = new AppError(400, 'Validation failed', {
      field: 'email',
      issue: 'invalid format',
    });

    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({
      field: 'email',
      issue: 'invalid format',
    });
  });

  it('should be throwable', () => {
    expect(() => {
      throw new AppError(500, 'Server error');
    }).toThrow('Server error');
  });
});
