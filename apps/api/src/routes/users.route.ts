import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { userService } from '../services/user.service';
import { ApiResponse, User } from '@reefing/shared-types';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/users/sync - Sync Auth0 user to database
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    const email = req.auth?.['https://reefing.com/email'] || req.auth?.email;
    const name = req.auth?.['https://reefing.com/name'] || req.auth?.name;

    if (!auth0Id || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing user information from token',
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
