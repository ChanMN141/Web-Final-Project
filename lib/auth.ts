import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const getSession = (request: Request): TokenPayload | null => {
  try {
    // Check cookies first (Preferred)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => {
                const [key, ...v] = c.split('=');
                return [key, v.join('=')];
            })
        );
        const token = cookies['auth-token'];
        if (token) return verifyToken(token);
    }
    
    // Check Auth Header (Fallback)
    const authHeader = request.headers.get('Authorization');
    if(authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        return verifyToken(token);
    }

    return null;
  } catch {
    return null;
  }
};

export function unauthorizedResponse() {
    return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
    );
}
