/**
 * Type-safe API response helpers for route handlers
 *
 * These helpers enforce response contracts at compile time, ensuring
 * API routes return responses that match the defined types.
 */

import { NextResponse } from 'next/server';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiCreateResponse,
} from '@/types';

/**
 * Create a typed error response
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false as const, error }, { status });
}

/**
 * Create a typed success response (no data)
 */
export function successResponse(): NextResponse<ApiSuccessResponse> {
  return NextResponse.json({ success: true as const });
}

/**
 * Create a typed success response with created resource ID
 */
export function createResponse(
  id: number | string
): NextResponse<ApiCreateResponse> {
  return NextResponse.json({ success: true as const, id });
}

/**
 * Create a typed success response with data
 * The generic type ensures the data matches the expected response shape
 */
export function dataResponse<T extends { success: true }>(
  data: T
): NextResponse<T> {
  return NextResponse.json(data);
}

/**
 * Common error responses
 */
export const ApiErrors = {
  propertyNotFound: () => errorResponse('Property not found', 404),
  unauthorized: () =>
    errorResponse('Unauthorized - Invalid or missing session token', 401),
  notFound: (resource: string) => errorResponse(`${resource} not found`, 404),
  missingFields: (fields?: string) =>
    errorResponse(fields ? `Missing required fields: ${fields}` : 'Missing required fields', 400),
  internal: () => errorResponse('Internal server error', 500),
} as const;
