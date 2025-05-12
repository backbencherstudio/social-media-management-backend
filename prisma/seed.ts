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
        minimum_withdrawal_amount: 100,
        withdrawal_processing_fee: 1,
        withdrawal_processing_time: '3-5 Business Days',
        is_flat_commission: false,
        flat_commission_value: null,
        percentage_commission_value: 10,
        payment_methods: ['PayPal', 'Visa/MasterCard', 'Bank Transfer'],
      },
    });
    console.log('✅ Seeded withdrawal settings');
  } else {
    console.log('ℹ️ Withdrawal settings already exist');
  }
}

async function main() {
  await seedWebsiteInfo();
  await seedWithdrawalSettings();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
