/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { aquariumService } from '../services/aquarium.service';
import { uploadAquariumImageToS3, getSignedImageUrl, deleteFromS3 } from '../services/s3.service';
import { uploadLimiter } from '../middleware/rateLimiters';
import { logger } from '../utils/logger';
import { ApiResponse, Aquarium, CreateAquariumDto } from '../types/shared';

const router: Router = Router();
const MAX_FILE_SIZE = 4.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// All routes require authentication and user in DB
router.use(authMiddleware);
router.use(ensureUser);

// Helper: attach signed imageUrl and strip internal imageKey
async function attachImageUrl(aquarium: any): Promise<any> {
  const { imageKey, ...rest } = aquarium;
  if (imageKey) {
    try {
      const imageUrl = await getSignedImageUrl(imageKey);
      return { ...rest, imageUrl };
    } catch {
      return rest;
    }
  }
  return rest;
}

// GET /api/aquariums - Get all aquariums for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aquariums = await aquariumService.findByUserId(req.user!.id);
    const withUrls = await Promise.all(aquariums.map(attachImageUrl));

    const response: ApiResponse<Aquarium[]> = {
      success: true,
      data: withUrls,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch aquariums', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aquariums',
    } as ApiResponse);
  }
});

// GET /api/aquariums/:id - Get single aquarium
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const aquarium = await aquariumService.findById(id);

    if (!aquarium) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    if (aquarium.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const withUrl = await attachImageUrl(aquarium);

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: withUrl,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to fetch aquarium', error, { aquariumId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aquarium',
    } as ApiResponse);
  }
});

// POST /api/aquariums - Create new aquarium
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateAquariumDto = req.body;

    if (!data.name || !data.type || !data.volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, volume',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.create(req.user!.id, data);
    logger.info('Aquarium created', { aquariumId: aquarium.id, userId: req.user!.id });

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: aquarium,
      message: 'Aquarium created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create aquarium', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to create aquarium',
    } as ApiResponse);
  }
});

// POST /api/aquariums/:id/photo - Upload tank photo
router.post('/:id/photo', uploadLimiter, upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } as ApiResponse);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'File must be a JPEG, PNG, WebP, or GIF image' } as ApiResponse);
    }

    const existing = (await aquariumService.findById(id)) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Aquarium not found' } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    // Delete old photo if exists
    if (existing.imageKey) {
      try {
        await deleteFromS3(existing.imageKey);
      } catch (err) {
        logger.error('Failed to delete old aquarium photo from S3', err, { aquariumId: id });
      }
    }

    const key = await uploadAquariumImageToS3(file.buffer, file.originalname, file.mimetype, id);
    const aquarium = await aquariumService.updateImageKey(id, key);
    const imageUrl = await getSignedImageUrl(key);
    const { imageKey: _stripped, ...aquariumData } = aquarium as any;

    logger.info('Aquarium photo uploaded', { aquariumId: id, userId: req.user!.id });

    res.json({
      success: true,
      data: { ...aquariumData, imageUrl },
      message: 'Photo uploaded successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to upload aquarium photo', error, { aquariumId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to upload photo' } as ApiResponse);
  }
});

// DELETE /api/aquariums/:id/photo - Delete tank photo
router.delete('/:id/photo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = (await aquariumService.findById(id)) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Aquarium not found' } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    if (existing.imageKey) {
      await deleteFromS3(existing.imageKey);
    }

    const aquarium = await aquariumService.clearImageKey(id);
    const { imageKey: _stripped, ...aquariumData } = aquarium as any;

    logger.info('Aquarium photo deleted', { aquariumId: id, userId: req.user!.id });

    res.json({
      success: true,
      data: aquariumData,
      message: 'Photo deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to delete aquarium photo', error, { aquariumId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to delete photo' } as ApiResponse);
  }
});

// PUT /api/aquariums/:id - Update aquarium
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateAquariumDto> = req.body;

    const existing = (await aquariumService.findById(id)) as any;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.update(id, data);
    const withUrl = await attachImageUrl(aquarium);

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: withUrl,
      message: 'Aquarium updated successfully',
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to update aquarium', error, { aquariumId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update aquarium',
    } as ApiResponse);
  }
});

// DELETE /api/aquariums/:id - Delete aquarium
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = (await aquariumService.findById(id)) as any;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    // Clean up S3 photo if exists
    if (existing.imageKey) {
      try {
        await deleteFromS3(existing.imageKey);
      } catch (err) {
        logger.error('Failed to delete aquarium photo during deletion', err, { aquariumId: id });
      }
    }

    await aquariumService.delete(id);
    logger.info('Aquarium deleted', { aquariumId: id, userId: req.user!.id });

    const response: ApiResponse = {
      success: true,
      message: 'Aquarium deleted successfully',
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to delete aquarium', error, { aquariumId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to delete aquarium',
    } as ApiResponse);
  }
});

export default router;
