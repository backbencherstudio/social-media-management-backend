import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedChannels() {
  const channels = [
    {
      name: 'Facebook',
      status: 1,
    },
    {
      name: 'Instagram',
      status: 1,
    },
    {
      name: 'Twitter',
      status: 1,
    },
    {
      name: 'LinkedIn',
      status: 1,
    },
    {
      name: 'TikTok',
      status: 1,
    },
    {
      name: 'YouTube',
      status: 1,
    },
    {
      name: 'Pinterest',
      status: 1,
    },
    {
      name: 'Snapchat',
      status: 1,
    },
  ];

  for (const channel of channels) {
    await prisma.channel.upsert({
      //where: { name: channel.name },
      update: {},
      create: channel,
      where: undefined
    });
  }

  console.log('Channels seeded successfully');
} 