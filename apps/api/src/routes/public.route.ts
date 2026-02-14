import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Aquarium } from '../types/shared';
import { getSignedImageUrl } from '../services/s3.service';

const prisma = new PrismaClient();

const router: Router = Router();

// Helper: attach signed imageUrl and strip internal imageKey from responses
async function attachImageUrlsToAquariums(aquariums: any[]): Promise<any[]> {
  return Promise.all(
    aquariums.map(async (aquarium) => {
      if (aquarium.corals) {
        const coralsWithUrls = await Promise.all(
          aquarium.corals.map(async (coral: any) => {
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
        return { ...aquarium, corals: coralsWithUrls };
      }
      return aquarium;
    })
  );
}

// GET /public/explore - Get all public aquariums
router.get('/explore', async (req: Request, res: Response) => {
  try {
    const aquariums = await prisma.aquarium.findMany({
      include: {
        equipment: true,
        corals: true,
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const aquariumsWithUrls = await attachImageUrlsToAquariums(aquariums);

    const response: ApiResponse<Aquarium[]> = {
      success: true,
      data: aquariumsWithUrls,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching public aquariums:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aquariums',
    } as ApiResponse);
  }
});

// GET /public/collection/:username - Get public collection for a user
router.get('/collection/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        aquariums: {
          include: {
            equipment: true,
            corals: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
    }

    const response: ApiResponse<{
      user: { name: string | null; username: string };
      aquariums: Aquarium[];
    }> = {
      success: true,
      data: {
        user: {
          name: user.name,
          username: user.username!,
        },
        aquariums: await attachImageUrlsToAquariums(user.aquariums),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching public collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection',
    } as ApiResponse);
  }
});

export default router;
