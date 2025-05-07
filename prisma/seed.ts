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
    console.log('✅ Seeded website info settings');
  } else {
    console.log('ℹ️ Website info already exists');
  }
}

async function seedWithdrawalSettings() {
  const existing = await prisma.withdrawalSettings.findFirst();

  if (!existing) {
    await prisma.withdrawalSettings.create({
      data: {
        minimumWithdrawalAmount: 100,
        withdrawalProcessingFee: 1,
        withdrawalProcessingTime: '3-5 Business Days',
        isFlatCommission: false,
        flatCommissionValue: null,
        percentageCommissionValue: 10,
        paymentMethods: ['PayPal', 'Visa/MasterCard', 'Bank Transfer'],
      },
    });
    console.log('✅ Seeded withdrawal settings');
  } else {
    console.log('ℹ️ Withdrawal settings already exist');
  }
}

async function main() {
  await seedWebsiteInfo();
  await seedWithdrawalSettings(); // ← just added
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
