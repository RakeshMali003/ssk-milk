const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "wholesale_customers" DISABLE ROW LEVEL SECURITY;`);
    console.log('Disabled RLS on wholesale_customers');
    await prisma.$executeRawUnsafe(`ALTER TABLE "wholesale_daily_entries" DISABLE ROW LEVEL SECURITY;`);
    console.log('Disabled RLS on wholesale_daily_entries');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
