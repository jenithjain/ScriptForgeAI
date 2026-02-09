/**
 * Shared API Utilities
 * Standardized responses, validation, and error handling
 */

import { NextResponse } from 'next/server';

// ============================================================
// Standardized API Response Types
// ============================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// Response Helpers
// ============================================================

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data?: T, message?: string, status = 200): NextResponse {
  const body: ApiSuccessResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

/**
 * Create a standardized error response
 */
export function apiError(
  error: string,
  status = 500,
  code?: string,
  details?: any
): NextResponse {
  const body: ApiErrorResponse = { success: false, error };
  if (code) body.code = code;
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => apiError('Forbidden', 403, 'FORBIDDEN'),
  notFound: (resource = 'Resource') => apiError(`${resource} not found`, 404, 'NOT_FOUND'),
  badRequest: (message = 'Invalid request') => apiError(message, 400, 'BAD_REQUEST'),
  validation: (message: string, details?: any) => apiError(message, 400, 'VALIDATION_ERROR', details),
  internal: (message = 'Internal server error') => apiError(message, 500, 'INTERNAL_ERROR'),
  rateLimited: (retryAfter?: number, message = 'Too many requests') => {
    const response = apiError(message, 429, 'RATE_LIMITED', { retryAfter });
    if (retryAfter) {
      response.headers.set('Retry-After', String(retryAfter));
    }
    return response;
  },
  serviceUnavailable: (message = 'Service temporarily unavailable') => 
    apiError(message, 503, 'SERVICE_UNAVAILABLE'),
};

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
  body: T,
  required: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = required.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  );
  
  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }
  return { valid: true };
}

/**
 * Validate and return request body with required fields check
 */
export async function parseAndValidate<T extends Record<string, any>>(
  request: Request,
  required: (keyof T)[]
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json() as T;
    const validation = validateRequired(body, required);
    
    if (!validation.valid) {
      return {
        success: false,
        response: ApiErrors.validation(`Missing required fields: ${validation.missing.join(', ')}`)
      };
    }
    
    return { success: true, data: body };
  } catch (error) {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid JSON in request body')
    };
  }
}

// ============================================================
// Constants
// ============================================================

export const PDF_CONSTANTS = {
  PAGE_WIDTH: 595,    // A4 width in points
  PAGE_HEIGHT: 842,   // A4 height in points
  MARGIN: 50,
  CONTENT_WIDTH: 495, // PAGE_WIDTH - (MARGIN * 2)
  FONT_SIZE: {
    TITLE: 24,
    HEADING: 16,
    SUBHEADING: 12,
    BODY: 10,
    SMALL: 9,
    TINY: 8,
  },
  LINE_HEIGHT: {
    TITLE: 30,
    HEADING: 20,
    BODY: 14,
    SMALL: 12,
  },
} as const;

export const API_TIMEOUTS = {
  DEFAULT: 30000,     // 30 seconds
  GEMINI: 120000,     // 2 minutes for AI operations (knowledge-graph needs more time)
  LONG_RUNNING: 180000, // 3 minutes for complex operations
} as const;

// ============================================================
// Timeout Helper
// ============================================================

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
