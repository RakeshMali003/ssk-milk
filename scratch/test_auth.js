import { PrismaClient } from '@prisma/client';

async function test() {
  console.log('Testing connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Connection successful!');
  } catch (e) {
    console.log('❌ Connection failed:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
