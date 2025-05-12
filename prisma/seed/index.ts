import { PrismaClient } from '@prisma/client';
import { seedChannels } from './channel.seed';

const prisma = new PrismaClient();

async function main() {
  try {
    // Run channel seeder
    await seedChannels();
    
    console.log('All seeders completed successfully');
  } catch (error) {
    console.error('Error running seeders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 