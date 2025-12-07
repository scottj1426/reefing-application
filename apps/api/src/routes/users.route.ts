/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { ApiResponse, User } from '../types/shared';

const router: Router = Router();

// All routes require authentication and user in DB
router.use(authMiddleware);
router.use(ensureUser);

// GET /api/users/me - Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response: ApiResponse<User> = {
      success: true,
      data: req.user!,
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
