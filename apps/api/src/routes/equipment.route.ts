/// <reference path="../types/express.d.ts" />
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ensureUser } from '../middleware/ensureUser';
import { equipmentService } from '../services/equipment.service';
import { aquariumService } from '../services/aquarium.service';
import { ApiResponse, Equipment, CreateEquipmentDto } from '../types/shared';

const router: Router = Router();

router.use(authMiddleware);
router.use(ensureUser);

// GET /aquariums/:aquariumId/equipment - Get all equipment for an aquarium
router.get('/:aquariumId/equipment', async (req: Request, res: Response, next: NextFunction) => {
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

    const equipment = await equipmentService.findByAquariumId(aquariumId);

    const response: ApiResponse<Equipment[]> = {
      success: true,
      data: equipment,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment',
    } as ApiResponse);
  }
});

// POST /aquariums/:aquariumId/equipment - Create equipment for an aquarium
router.post('/:aquariumId/equipment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId } = req.params;
    const data: CreateEquipmentDto = req.body;

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
    if (!data.name || !data.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type',
      } as ApiResponse);
    }

    const equipment = await equipmentService.create(aquariumId, data);

    const response: ApiResponse<Equipment> = {
      success: true,
      data: equipment,
      message: 'Equipment added successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create equipment',
    } as ApiResponse);
  }
});

// PUT /aquariums/:aquariumId/equipment/:id - Update equipment
router.put('/:aquariumId/equipment/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;
    const data: Partial<CreateEquipmentDto> = req.body;

    // Verify equipment exists and belongs to user's aquarium
    const existing = await equipmentService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    const equipment = await equipmentService.update(id, data);

    const response: ApiResponse<Equipment> = {
      success: true,
      data: equipment,
      message: 'Equipment updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update equipment',
    } as ApiResponse);
  }
});

// DELETE /aquariums/:aquariumId/equipment/:id - Delete equipment
router.delete('/:aquariumId/equipment/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { aquariumId, id } = req.params;

    const existing = await equipmentService.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found',
      } as ApiResponse);
    }

    const aquarium = await aquariumService.findById(aquariumId);
    if (!aquarium || aquarium.userId !== req.user!.id || existing.aquariumId !== aquariumId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      } as ApiResponse);
    }

    await equipmentService.delete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Equipment deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete equipment',
    } as ApiResponse);
  }
});

export default router;
