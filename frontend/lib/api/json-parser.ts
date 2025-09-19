import { NextRequest, NextResponse } from 'next/server';

/**
 * Safely parse JSON from a request body with proper error handling
 * @param request - The NextRequest object
 * @returns Parsed JSON body or error response
 */
export async function parseJsonBody(request: NextRequest): Promise<
  | { success: true; data: any }
  | { success: false; error: NextResponse }
> {
  try {
    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    const contentType = request.headers.get('content-type');
    
    if (!contentLength || contentLength === '0') {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        ),
      };
    }
    
    if (!contentType?.includes('application/json')) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 400 }
        ),
      };
    }

    const body = await request.json();
    return { success: true, data: body };
  } catch (error) {
    console.error('JSON parsing error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Safely parse JSON from a request body with a default value
 * @param request - The NextRequest object
 * @param defaultValue - Default value to return if parsing fails
 * @returns Parsed JSON body or default value
 */
export async function parseJsonBodyWithDefault<T = any>(
  request: NextRequest,
  defaultValue: T
): Promise<T> {
  try {
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return defaultValue;
    }
    
    return await request.json();
  } catch (error) {
    console.error('JSON parsing error (using default):', error);
    return defaultValue;
  }
}