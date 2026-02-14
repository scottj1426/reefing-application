/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { userService } from '../services/user.service';
import { uploadProfileImageToS3, getSignedImageUrl, deleteFromS3 } from '../services/s3.service';
import { uploadLimiter } from '../middleware/rateLimiters';
import { ApiResponse, User } from '../types/shared';

const router: Router = Router();
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel serverless body limit)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// All routes require authentication and user in DB
router.use(authMiddleware);
router.use(ensureUser);

// GET /api/users/me - Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileImageKey, ...rest } = req.user! as any;
    let profileImageUrl: string | null = null;

    if (profileImageKey) {
      try {
        profileImageUrl = await getSignedImageUrl(profileImageKey);
      } catch {
        profileImageUrl = null;
      }
    }

    const response: ApiResponse<User & { profileImageUrl?: string | null }> = {
      success: true,
      data: { ...rest, profileImageUrl },
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

// POST /api/users/me/photo - Upload profile photo
router.post('/me/photo', uploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } as ApiResponse);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'File must be a JPEG, PNG, WebP, or GIF image' } as ApiResponse);
    }

    const existingKey = (req.user as any).profileImageKey as string | null | undefined;
    if (existingKey) {
      try {
        await deleteFromS3(existingKey);
      } catch (err) {
        console.error('Failed to delete old profile image from S3:', err);
      }
    }

    const key = await uploadProfileImageToS3(file.buffer, file.originalname, file.mimetype, req.user!.id);
    const updated = await userService.updateProfileImageKey(req.user!.auth0Id, key);
    const profileImageUrl = await getSignedImageUrl(key);
    const { profileImageKey, ...rest } = updated as any;

    res.json({
      success: true,
      data: { ...rest, profileImageUrl },
      message: 'Profile photo uploaded successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photo' } as ApiResponse);
  }
});

// DELETE /api/users/me/photo - Delete profile photo
router.delete('/me/photo', async (req: Request, res: Response) => {
  try {
    const existingKey = (req.user as any).profileImageKey as string | null | undefined;

    if (existingKey) {
      await deleteFromS3(existingKey);
    }

    const updated = await userService.updateProfileImageKey(req.user!.auth0Id, null);
    const { profileImageKey, ...rest } = updated as any;

    res.json({
      success: true,
      data: { ...rest, profileImageUrl: null },
      message: 'Profile photo deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({ success: false, error: 'Failed to delete photo' } as ApiResponse);
  }
});

export default router;
