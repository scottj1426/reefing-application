import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { User } from '@prisma/client';
import axios from 'axios';

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

    if (!user || user.email.includes('@auth0.placeholder')) {
      // Fetch user info from Auth0 to get real email
      const token = req.headers.authorization?.replace('Bearer ', '');
      let email = `${auth0Id}@auth0.placeholder`;
      let name = undefined;

      try {
        const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
        const userInfoResponse = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        email = userInfoResponse.data.email || email;
        name = userInfoResponse.data.name || userInfoResponse.data.nickname;

        console.log(`Got user info from Auth0: email=${email}, name=${name}`);
      } catch (error) {
        console.error('Failed to fetch user info from Auth0:', error);
      }

      if (!user) {
        console.log(`Creating new user: ${auth0Id} with email: ${email}`);
      } else {
        console.log(`Updating user: ${auth0Id} from placeholder to real email: ${email}`);
      }

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
