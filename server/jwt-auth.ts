/**
 * JWT Authentication for Mobile API
 *
 * Simple JWT-based authentication for mobile clients.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

// JWT secret from environment - lazy initialization to allow server to start
const JWT_EXPIRY = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('JWT_SECRET not set - JWT operations will fail');
      return 'missing-jwt-secret-will-fail';
    }
    console.warn('WARNING: JWT_SECRET not set. Using insecure default for development only.');
    return 'dev-only-insecure-secret';
  }
  return secret;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      mobileUser?: User;
    }
  }
}

// Token payload structure
interface TokenPayload {
  userId: string;
  platform: 'mobile';
  iat: number;
  exp: number;
}

// Generate JWT token for a user
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, platform: 'mobile' },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

// Verify JWT token and return payload
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT authentication middleware for mobile routes
export async function mobileAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = await storage.getUser(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.mobileUser = user;
  next();
}

// Optional auth middleware - sets user if token present but doesn't require it
export async function optionalMobileAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload) {
      const user = await storage.getUser(payload.userId);
      if (user) {
        req.mobileUser = user;
      }
    }
  }

  next();
}
