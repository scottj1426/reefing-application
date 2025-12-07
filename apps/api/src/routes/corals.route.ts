/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { coralService } from '../services/coral.service';
import { aquariumService } from '../services/aquarium.service';
import { ApiResponse, Coral, CreateCoralDto } from '../types/shared';

const router: Router = Router();

router.use(authMiddleware);
router.use(ensureUser);

// GET /aquariums/:aquariumId/corals - Get all corals for an aquarium
router.get('/:aquariumId/corals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId } = req.params;

    // Verify aquarium ownership
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

    const response: ApiResponse<Coral[]> = {
      success: true,
      data: corals,
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

    // Verify aquarium ownership
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

    // Validate required fields
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

// PUT /aquariums/:aquariumId/corals/:id - Update coral
router.put('/:aquariumId/corals/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;
    const data: Partial<CreateCoralDto> = req.body;

    // Verify coral exists and belongs to user's aquarium
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
