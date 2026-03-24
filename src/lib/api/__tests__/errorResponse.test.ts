import { describe, it, expect } from 'vitest';
import { 
  createErrorResponse, 
  badRequest, 
  unauthorized, 
  forbidden, 
  notFound, 
  internalServerError 
} from '../errorResponse';

describe('errorResponse', () => {
  describe('createErrorResponse', () => {
    it('should create error response with message and status', () => {
      const response = createErrorResponse('Test error', 400);
      
      expect(response.status).toBe(400);
      const json = response.json();
      expect(json).toEqual({
        error: 'Test error',
        status: 400,
      });
    });

    it('should include details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' };
      const response = createErrorResponse('Validation failed', 400, details);
      
      const json = response.json();
      expect(json).toEqual({
        error: 'Validation failed',
        status: 400,
        details,
      });
    });
  });

  describe('badRequest', () => {
    it('should create 400 response', () => {
      const response = badRequest('Invalid input');
      
      expect(response.status).toBe(400);
      const json = response.json();
      expect(json.error).toBe('Invalid input');
      expect(json.status).toBe(400);
    });

    it('should include details', () => {
      const details = { errors: ['field required'] };
      const response = badRequest('Validation failed', details);
      
      const json = response.json();
      expect(json.details).toEqual(details);
    });
  });

  describe('unauthorized', () => {
    it('should create 401 response', () => {
      const response = unauthorized('Not authenticated');
      
      expect(response.status).toBe(401);
      const json = response.json();
      expect(json.error).toBe('Not authenticated');
      expect(json.status).toBe(401);
    });
  });

  describe('forbidden', () => {
    it('should create 403 response', () => {
      const response = forbidden('Access denied');
      
      expect(response.status).toBe(403);
      const json = response.json();
      expect(json.error).toBe('Access denied');
      expect(json.status).toBe(403);
    });
  });

  describe('notFound', () => {
    it('should create 404 response', () => {
      const response = notFound('Resource not found');
      
      expect(response.status).toBe(404);
      const json = response.json();
      expect(json.error).toBe('Resource not found');
      expect(json.status).toBe(404);
    });
  });

  describe('internalServerError', () => {
    it('should create 500 response', () => {
      const response = internalServerError('Server error');
      
      expect(response.status).toBe(500);
      const json = response.json();
      expect(json.error).toBe('Server error');
      expect(json.status).toBe(500);
    });

    it('should default to generic message', () => {
      const response = internalServerError();
      
      const json = response.json();
      expect(json.error).toBe('Internal server error');
    });
  });
});
