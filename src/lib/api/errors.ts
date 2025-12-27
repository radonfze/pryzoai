import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API Error Handling
 * 
 * Provides consistent error responses across all API endpoints.
 */

export type ApiErrorCode = 
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Create a success response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>,
  status?: number
): NextResponse<ApiError> {
  const statusMap: Record<ApiErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  };

  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status: status ?? statusMap[code] }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiError> {
  const details: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return apiError("VALIDATION_ERROR", "Validation failed", details);
}

/**
 * Catch-all error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error("API Error:", error);

  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : error.message;
    
    return apiError("INTERNAL_ERROR", message);
  }

  return apiError("INTERNAL_ERROR", "An unexpected error occurred");
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch(handleApiError);
}
