import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a demo user if one doesn't exist
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@reefing.com' },
    update: {},
    create: {
      email: 'demo@reefing.com',
      name: 'Demo User',
      auth0Id: 'auth0|demo-user-123',
    },
  });

  console.log(`Demo user created/found: ${demoUser.email}`);

  // Create reef tank aquariums for the demo user
  const reefTanks = [
    {
      name: 'Main Reef Display',
      type: 'reef',
      volume: 180,
      description: 'Large mixed reef tank with SPS, LPS, and soft corals. Heavy bioload with multiple fish.',
    },
    {
      name: 'Nano Reef',
      type: 'reef',
      volume: 25,
      description: 'Small nano reef focused on soft corals and a few small fish. Perfect for beginners.',
    },
    {
      name: 'SPS Dominant Tank',
      type: 'reef',
      volume: 120,
      description: 'High-light SPS dominant tank with acropora and montipora colonies. Requires stable parameters.',
    },
    {
      name: 'Lagoon Biotope',
      type: 'reef',
      volume: 90,
      description: 'Shallow lagoon-style reef with gentle flow. Focus on mushrooms, zoanthids, and gentle LPS.',
    },
  ];

  for (const tank of reefTanks) {
    const aquarium = await prisma.aquarium.upsert({
      where: {
        id: `seed-${tank.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        ...tank,
        userId: demoUser.id,
      },
    });
    console.log(`Created aquarium: ${aquarium.name} (${aquarium.volume}g)`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
