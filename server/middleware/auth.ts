import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        role: 'admin' | 'user';
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.headers['x-auth-token'] as string;

    if (!token) {
      return res.status(401).json({ message: 'Access token gerekli' });
    }

    // Validate token format
    if (!token.startsWith('user_authenticated_')) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    // Get username from headers (added by frontend)
    const username = req.headers['x-username'] as string;
    if (!username) {
      return res.status(401).json({ message: 'User bilgisi eksik' });
    }

    // Fetch user and validate
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Add user to request
    req.user = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication başarısız' });
  }
};

// Admin role check middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication gerekli' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }

  next();
};

// Basic auth check (for regular authenticated routes)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication gerekli' });
  }
  next();
};