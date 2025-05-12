import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedWebsiteInfo() {
  const existing = await prisma.websiteInfo.findFirst();

  if (!existing) {
    await prisma.websiteInfo.create({
      data: {
        id: 'website-info',
        site_name: 'Default Site',
        site_description: 'Default description',
        time_zone: 'UTC',
        phone_number: '1234567890',
        email: 'admin@example.com',
        address: 'Default Address',
        logo: null,
        favicon: null,
        copyright: '',
        cancellation_policy: '',
      },
    });
    console.log('Seeded website info settings');
  } else {
    console.log('Website info already exists');
  }
}




async function main() {
  await seedWebsiteInfo();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
