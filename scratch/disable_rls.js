import pg from 'pg';
const { Client } = pg;

const host = 'aws-1-ap-northeast-2.pooler.supabase.com';
const database = 'postgres';
const user = 'postgres.jmikzmnlyufsbxqrjnux';
const password = 'Qal%%%1301200';

async function run() {
  const client = new Client({
    host,
    port: 5432,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('Connected to database. Disabling RLS on tables...');
    
    const tables = [
      'milk_items',
      'customers',
      'daily_inventory',
      'sales',
      'payments',
      'admins'
    ];
    
    for (const table of tables) {
      console.log(`Disabling RLS on: public.${table}...`);
      await client.query(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
    }
    
    console.log('✅ Successfully disabled RLS on all tables!');
  } catch (e) {
    console.error('❌ Failed to disable RLS:', e.message);
  } finally {
    await client.end();
  }
}

run();
