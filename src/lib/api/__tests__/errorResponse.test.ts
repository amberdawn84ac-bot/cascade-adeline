import { describe, it, expect } from 'vitest';
import { errorResponse, ErrorResponses } from '../errorResponse';

describe('errorResponse', () => {
  describe('errorResponse', () => {
    it('should create error response with message and status', async () => {
      const response = errorResponse('Test error', 400, { logError: false });
      
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Test error');
    });

    it('should include details when provided', async () => {
      const details = { field: 'email', issue: 'invalid format' };
      const response = errorResponse('Validation failed', 400, { details, logError: false });
      
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
      expect(json.details).toEqual(details);
    });
  });

  describe('ErrorResponses.badRequest', () => {
    it('should create 400 response', async () => {
      const response = ErrorResponses.badRequest('Invalid input');
      
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid input');
    });

    it('should include details', async () => {
      const details = { errors: ['field required'] };
      const response = ErrorResponses.badRequest('Validation failed', details);
      
      const json = await response.json();
      expect(json.details).toEqual(details);
    });
  });

  describe('ErrorResponses.unauthorized', () => {
    it('should create 401 response', async () => {
      const response = ErrorResponses.unauthorized();
      
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('ErrorResponses.forbidden', () => {
    it('should create 403 response', async () => {
      const response = ErrorResponses.forbidden('Access denied');
      
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Access denied');
    });
  });

  describe('ErrorResponses.notFound', () => {
    it('should create 404 response', async () => {
      const response = ErrorResponses.notFound('Resource');
      
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Resource not found');
    });
  });

  describe('ErrorResponses.internalError', () => {
    it('should create 500 response', async () => {
      const response = ErrorResponses.internalError('Server error');
      
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Server error');
    });

    it('should default to generic message', async () => {
      const response = ErrorResponses.internalError();
      
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });
  });
});
