// Mock JWT utilities for testing
export interface JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export function signToken(payload: JWTPayload, secret: string): string {
  // Mock implementation
  return 'mock-jwt-token';
}

export function verifyToken(token: string, secret: string): JWTPayload | null {
  // Mock implementation
  return {
    sub: 'mock-user-id',
    email: 'test@example.com',
    role: 'admin'
  };
}

export function decodeToken(token: string): JWTPayload | null {
  // Mock implementation
  return {
    sub: 'mock-user-id',
    email: 'test@example.com',
    role: 'admin'
  };
}

// Export functions for backward compatibility
export const verifyJWT = verifyToken;
