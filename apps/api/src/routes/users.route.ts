/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { userService } from '../services/user.service';
import { ApiResponse, User } from '../types/shared';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/users/sync - Sync Auth0 user to database
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;

    // Try to get email from token first, then from request body
    let email = req.auth?.['https://reefing.com/email'] || req.auth?.email;
    let name = req.auth?.['https://reefing.com/name'] || req.auth?.name;

    // If email not in token, get from request body (sent from frontend)
    if (!email && req.body.email) {
      email = req.body.email;
      name = req.body.name;
    }

    console.log('Sync attempt - auth0Id:', auth0Id, 'email:', email, 'name:', name);

    if (!auth0Id || !email) {
      console.error('Missing required fields - auth0Id:', auth0Id, 'email:', email);
      console.log('Request body:', req.body);
      console.log('Auth keys:', req.auth ? Object.keys(req.auth) : []);
      return res.status(400).json({
        success: false,
        error: 'Missing user information from token',
        debug: {
          hasAuth0Id: !!auth0Id,
          hasEmail: !!email,
          authKeys: req.auth ? Object.keys(req.auth) : [],
        },
      } as ApiResponse);
    }

    const user = await userService.findOrCreate(auth0Id, email, name);

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'User synced successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user',
    } as ApiResponse);
  }
});

// GET /api/users/me - Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
    }

    const user = await userService.findByAuth0Id(auth0Id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    } as ApiResponse);
  }
});

export default router;
