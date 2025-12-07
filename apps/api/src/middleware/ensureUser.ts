import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { User } from '@prisma/client';

/**
 * Middleware that auto-creates user on first API call.
 * Must run AFTER authMiddleware (JWT validation).
 */
export const ensureUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth0Id = req.auth?.sub;

    if (!auth0Id) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - missing auth0 ID',
      });
      return;
    }

    // Find or create user
    let user = await userService.findByAuth0Id(auth0Id);

    if (!user) {
      // New user - create with auth0Id
      const email = req.auth?.email ||
                    req.auth?.['https://reefing.com/email'] ||
                    `${auth0Id}@auth0.placeholder`;
      const name = req.auth?.name || req.auth?.['https://reefing.com/name'];

      console.log(`Creating new user: ${auth0Id}`);
      user = await userService.findOrCreate(auth0Id, email, name);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in ensureUser middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize user',
    });
  }
};
