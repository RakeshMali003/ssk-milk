import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in dependency order
  console.log('Cleaning old records...');
  await prisma.payment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.dailyInventory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.milkItem.deleteMany();
  await prisma.admin.deleteMany();

  // 2. Insert Admins
  console.log('Seeding admins...');
  const admin = await prisma.admin.create({
    data: {
      name: 'Shree Sai Krupa Admin',
      email: 'admin@gmail.com',
      password: 'password', // Demo plain password
      role: 'admin',
      isActive: true,
    },
  });

  // 3. Insert Milk Items
  console.log('Seeding milk products...');
  const m1 = await prisma.milkItem.create({ data: { name: 'Cow Milk (Full Cream)', price: 60, unit: 'litre' } });
  const m2 = await prisma.milkItem.create({ data: { name: 'Buffalo Milk', price: 70, unit: 'litre' } });
  const m3 = await prisma.milkItem.create({ data: { name: 'Taaza Milk (Pouch)', price: 54, unit: 'packet' } });
  const m4 = await prisma.milkItem.create({ data: { name: 'Gold Milk (Premium)', price: 66, unit: 'litre' } });

  // 4. Insert Customers
  console.log('Seeding customers...');
  const c1 = await prisma.customer.create({
    data: {
      name: 'Ramesh Sharma',
      email: 'ramesh@gmail.com',
      mobile: '9876543210',
      address: 'Plot 42, Sector 5, Vashi',
      milkItemId: m1.id,
      dailyQty: 2,
      isActive: true,
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      name: 'Sanjay Patel',
      email: 'sanjay.p@gmail.com',
      mobile: '9822334455',
      address: 'B-201, Green Heights, Koparkhairane',
      milkItemId: m2.id,
      dailyQty: 1.5,
      isActive: true,
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      name: 'Sunita Deshmukh',
      email: 'sunita.d@gmail.com',
      mobile: '9123456789',
      address: 'Row House 3, Sector 12, Sanpada',
      milkItemId: m3.id,
      dailyQty: 3,
      isActive: true,
    },
  });

  const c4 = await prisma.customer.create({
    data: {
      name: 'Amit Verma',
      email: 'amit@verma.com',
      mobile: '9555112233',
      address: 'A-405, Sai Krupa Towers, Nerul',
      milkItemId: m4.id,
      dailyQty: 2,
      isActive: true,
    },
  });

  const c5 = await prisma.customer.create({
    data: {
      name: 'Kiran Yadav',
      email: 'kiran.yadav@gmail.com',
      mobile: '8888999900',
      address: 'Chawl No. 4, Turbhe Store',
      milkItemId: m1.id,
      dailyQty: 1,
      isActive: true,
    },
  });

  // 5. Insert Payments
  console.log('Seeding payments ledger...');
  await prisma.payment.createMany({
    data: [
      {
        customerId: c1.id,
        amount: 1800,
        status: 'paid',
        mode: 'upi',
        note: 'June Half Payment',
        paymentDate: new Date('2026-06-15'),
      },
      {
        customerId: c2.id,
        amount: 2100,
        status: 'paid',
        mode: 'cash',
        note: 'May Bill Paid',
        paymentDate: new Date('2026-06-10'),
      },
      {
        customerId: c3.id,
        amount: 1620,
        status: 'pending',
        mode: 'upi',
        note: 'Pending confirmation',
        paymentDate: new Date('2026-06-20'),
      },
      {
        customerId: c4.id,
        amount: 3960,
        status: 'unpaid',
        mode: 'cash',
        note: 'To be paid tomorrow',
        paymentDate: new Date('2026-06-05'),
      },
    ],
  });

  // 6. Insert Daily Deliveries Checklists for past 3 days (including today)
  console.log('Seeding historical deliveries and sales records...');
  const dates = [
    new Date(), // today
    new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // day before
  ];

  for (const dateVal of dates) {
    // Add Daily Checklist item
    const deliveryItems = [
      { customerId: c1.id, milkItemId: m1.id, qty: 2, price: 60 },
      { customerId: c2.id, milkItemId: m2.id, qty: 1.5, price: 70 },
      { customerId: c3.id, milkItemId: m3.id, qty: 3, price: 54 },
      { customerId: c4.id, milkItemId: m4.id, qty: 2, price: 66 },
      { customerId: c5.id, milkItemId: m1.id, qty: 1, price: 60 },
    ];

    for (const item of deliveryItems) {
      await prisma.dailyInventory.create({
        data: {
          deliveryDate: dateVal,
          customerId: item.customerId,
          milkItemId: item.milkItemId,
          qty: item.qty,
          delivered: true, // mark all mock past ones as delivered
        },
      });

      // Insert matching sales record
      await prisma.sale.create({
        data: {
          saleDate: dateVal,
          customerId: item.customerId,
          milkItemId: item.milkItemId,
          qty: item.qty,
          price: item.price,
          total: item.qty * item.price,
        },
      });
    }
  }

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
