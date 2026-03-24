import { NextResponse } from 'next/server';

export interface StandardErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Standardized error response builder for API routes
 * Ensures consistent error format across all endpoints
 */
export function errorResponse(
  message: string,
  status: number = 500,
  options?: {
    code?: string;
    details?: any;
    logError?: boolean;
  }
): NextResponse<StandardErrorResponse> {
  const response: StandardErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (options?.code) {
    response.code = options.code;
  }

  if (options?.details) {
    response.details = options.details;
  }

  if (options?.logError !== false) {
    console.error(`[API Error ${status}]`, message, options?.details || '');
  }

  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: () => errorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED' }),
  
  forbidden: (reason?: string) => errorResponse(
    reason || 'Forbidden', 
    403, 
    { code: 'FORBIDDEN' }
  ),
  
  notFound: (resource?: string) => errorResponse(
    resource ? `${resource} not found` : 'Not found',
    404,
    { code: 'NOT_FOUND' }
  ),
  
  badRequest: (message: string, details?: any) => errorResponse(
    message,
    400,
    { code: 'BAD_REQUEST', details }
  ),
  
  validationError: (errors: any[]) => errorResponse(
    'Validation failed',
    400,
    { code: 'VALIDATION_ERROR', details: errors }
  ),
  
  internalError: (message?: string, details?: any) => errorResponse(
    message || 'Internal server error',
    500,
    { code: 'INTERNAL_ERROR', details }
  ),
  
  serviceUnavailable: (service?: string) => errorResponse(
    service ? `${service} is unavailable` : 'Service unavailable',
    503,
    { code: 'SERVICE_UNAVAILABLE' }
  ),
  
  rateLimitExceeded: (resetAt: Date) => errorResponse(
    'Too many requests',
    429,
    { 
      code: 'RATE_LIMIT_EXCEEDED',
      details: { resetAt: resetAt.toISOString() }
    }
  ),
};
