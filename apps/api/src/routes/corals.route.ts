/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { coralService } from '../services/coral.service';
import { aquariumService } from '../services/aquarium.service';
import { uploadToS3, getSignedImageUrl, deleteFromS3 } from '../services/s3.service';
import { uploadLimiter } from '../middleware/rateLimiters';
import { ApiResponse, Coral, CreateCoralDto } from '../types/shared';

const router: Router = Router();
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel serverless body limit)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

router.use(authMiddleware);
router.use(ensureUser);

// Helper: attach signed imageUrl and strip internal imageKey from responses
async function attachImageUrls(corals: any[]): Promise<any[]> {
  return Promise.all(
    corals.map(async (coral) => {
      const { imageKey, ...rest } = coral;
      if (imageKey) {
        try {
          const imageUrl = await getSignedImageUrl(imageKey);
          return { ...rest, imageUrl };
        } catch {
          return rest;
        }
      }
      return rest;
    })
  );
}

// GET /aquariums/:aquariumId/corals - Get all corals for an aquarium
router.get('/:aquariumId/corals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId } = req.params;

    const aquarium = await aquariumService.findById(aquariumId);
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

    const corals = await coralService.findByAquariumId(aquariumId);
    const coralsWithUrls = await attachImageUrls(corals);

    const response: ApiResponse<Coral[]> = {
      success: true,
      data: coralsWithUrls,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching corals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch corals',
    } as ApiResponse);
  }
});

// POST /aquariums/:aquariumId/corals - Create coral for an aquarium
router.post('/:aquariumId/corals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId } = req.params;
    const data: CreateCoralDto = req.body;

    const aquarium = await aquariumService.findById(aquariumId);
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

    if (!data.species) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: species',
      } as ApiResponse);
    }

    const coral = await coralService.create(aquariumId, data);

    const response: ApiResponse<Coral> = {
      success: true,
      data: coral,
      message: 'Coral added successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating coral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coral',
    } as ApiResponse);
  }
});

// POST /aquariums/:aquariumId/corals/:id/photo - Upload coral photo
router.post('/:aquariumId/corals/:id/photo', uploadLimiter, upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } as ApiResponse);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'File must be a JPEG, PNG, WebP, or GIF image' } as ApiResponse);
    }

    const existing = await coralService.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Coral not found' } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    // Delete old photo if exists
    if (existing.imageKey) {
      try {
        await deleteFromS3(existing.imageKey);
      } catch (err) {
        console.error('Failed to delete old photo from S3:', err);
      }
    }

    const key = await uploadToS3(file.buffer, file.originalname, file.mimetype, id);
    const coral = await coralService.updateImageKey(id, key);
    const imageUrl = await getSignedImageUrl(key);
    const { imageKey: _stripped, ...coralData } = coral;

    res.json({
      success: true,
      data: { ...coralData, imageUrl },
      message: 'Photo uploaded successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error uploading coral photo:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photo' } as ApiResponse);
  }
});

// DELETE /aquariums/:aquariumId/corals/:id/photo - Delete coral photo
router.delete('/:aquariumId/corals/:id/photo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;

    const existing = await coralService.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Coral not found' } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
      return res.status(403).json({ success: false, error: 'Forbidden' } as ApiResponse);
    }

    if (existing.imageKey) {
      await deleteFromS3(existing.imageKey);
    }

    const coral = await coralService.clearImageKey(id);
    const { imageKey: _stripped, ...coralData } = coral;

    res.json({
      success: true,
      data: coralData,
      message: 'Photo deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting coral photo:', error);
    res.status(500).json({ success: false, error: 'Failed to delete photo' } as ApiResponse);
  }
});

// PUT /aquariums/:aquariumId/corals/:id - Update coral
router.put('/:aquariumId/corals/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;
    const data: Partial<CreateCoralDto> = req.body;

    const existing = await coralService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coral not found',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const coral = await coralService.update(id, data);

    const response: ApiResponse<Coral> = {
      success: true,
      data: coral,
      message: 'Coral updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating coral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coral',
    } as ApiResponse);
  }
});

// DELETE /aquariums/:aquariumId/corals/:id - Delete coral
router.delete('/:aquariumId/corals/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;

    const existing = await coralService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coral not found',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
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
        console.error('Failed to delete photo from S3 during coral deletion:', err);
      }
    }

    await coralService.delete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Coral deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting coral:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coral',
    } as ApiResponse);
  }
});

export default router;
