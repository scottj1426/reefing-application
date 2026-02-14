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

// Helper: attach signed photo URLs and strip internal image keys
async function attachImageUrl(aquarium: any): Promise<any> {
  const photos = Array.isArray(aquarium.photos) ? aquarium.photos : [];
  const photoUrls = await Promise.all(
    photos.map(async (photo: any) => {
      try {
        const imageUrl = await getSignedImageUrl(photo.imageKey);
        return { id: photo.id, imageUrl };
      } catch {
        return null;
      }
    })
  );

  return {
    ...aquarium,
    photos: photoUrls.filter(Boolean),
  };
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

const handlePhotoUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!files.length) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } as ApiResponse);
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'File must be a JPEG, PNG, WebP, or GIF image' } as ApiResponse);
      }
    }

    const existing = await aquariumService.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Aquarium not found' } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    const keys = await Promise.all(
      files.map((file) =>
        uploadAquariumImageToS3(file.buffer, file.originalname, file.mimetype, id)
      )
    );

    const aquarium = await aquariumService.addPhotos(id, keys);
    const withUrls = await attachImageUrl(aquarium as any);

    logger.info('Aquarium photos uploaded', { aquariumId: id, userId: req.user!.id, count: keys.length });

    res.json({
      success: true,
      data: withUrls,
      message: 'Photos uploaded successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to upload aquarium photos', error, { aquariumId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to upload photos' } as ApiResponse);
  }
};

// POST /api/aquariums/:id/photo - Upload single tank photo (compat)
router.post('/:id/photo', uploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  if (req.file) {
    req.files = [req.file] as any;
  }
  return handlePhotoUpload(req, res);
});

// POST /api/aquariums/:id/photos - Upload multiple tank photos
router.post('/:id/photos', uploadLimiter, upload.array('photos', 10), handlePhotoUpload);

// DELETE /api/aquariums/:id/photos/:photoId - Delete single tank photo
router.delete('/:id/photos/:photoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, photoId } = req.params;

    const existing = await aquariumService.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Aquarium not found' } as ApiResponse);
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    const photos = await aquariumService.listPhotos(id);
    const target = photos.find((photo) => photo.id === photoId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Photo not found' } as ApiResponse);
    }

    await deleteFromS3(target.imageKey);
    await aquariumService.deletePhoto(photoId);
    const updated = await aquariumService.findById(id);
    const withUrls = await attachImageUrl(updated as any);

    logger.info('Aquarium photo deleted', { aquariumId: id, userId: req.user!.id, photoId });

    res.json({
      success: true,
      data: withUrls,
      message: 'Photo deleted successfully',
    } as ApiResponse);
  } catch (error) {
    logger.error('Failed to delete aquarium photo', error, { aquariumId: req.params.id, photoId: req.params.photoId });
    res.status(500).json({ success: false, error: 'Failed to delete photo' } as ApiResponse);
  }
});

// PUT /api/aquariums/:id - Update aquarium
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateAquariumDto> = req.body;

    const existing = await aquariumService.findById(id);
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

    const existing = await aquariumService.findById(id);
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

    const photos = await aquariumService.listPhotos(id);
    await Promise.all(
      photos.map(async (photo) => {
        try {
          await deleteFromS3(photo.imageKey);
        } catch (err) {
          logger.error('Failed to delete aquarium photo during deletion', err, { aquariumId: id, photoId: photo.id });
        }
      })
    );

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
