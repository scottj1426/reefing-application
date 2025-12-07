/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { aquariumService } from '../services/aquarium.service';
import { userService } from '../services/user.service';
import { ApiResponse, Aquarium, CreateAquariumDto } from '../types/shared';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/aquariums - Get all aquariums for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
    }

    // Get user from database
    const user = await userService.findByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const aquariums = await aquariumService.findByUserId(user.id);

    const response: ApiResponse<Aquarium[]> = {
      success: true,
      data: aquariums,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching aquariums:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aquariums',
    } as ApiResponse);
  }
});

// GET /api/aquariums/:id - Get single aquarium
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    const { id } = req.params;

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

    const aquarium = await aquariumService.findById(id);

    if (!aquarium) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    // Ensure aquarium belongs to user
    if (aquarium.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: aquarium,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching aquarium:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aquarium',
    } as ApiResponse);
  }
});

// POST /api/aquariums - Create new aquarium
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    const data: CreateAquariumDto = req.body;

    if (!auth0Id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse);
    }

    // Validate required fields
    if (!data.name || !data.type || !data.volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, volume',
      } as ApiResponse);
    }

    const user = await userService.findByAuth0Id(auth0Id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.create(user.id, data);

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: aquarium,
      message: 'Aquarium created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating aquarium:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create aquarium',
    } as ApiResponse);
  }
});

// PUT /api/aquariums/:id - Update aquarium
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    const { id } = req.params;
    const data: Partial<CreateAquariumDto> = req.body;

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

    const existing = await aquariumService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.update(id, data);

    const response: ApiResponse<Aquarium> = {
      success: true,
      data: aquarium,
      message: 'Aquarium updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating aquarium:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update aquarium',
    } as ApiResponse);
  }
});

// DELETE /api/aquariums/:id - Delete aquarium
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth0Id = req.auth?.sub;
    const { id } = req.params;

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

    const existing = await aquariumService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Aquarium not found',
      } as ApiResponse);
    }

    if (existing.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    await aquariumService.delete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Aquarium deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting aquarium:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete aquarium',
    } as ApiResponse);
  }
});

export default router;
