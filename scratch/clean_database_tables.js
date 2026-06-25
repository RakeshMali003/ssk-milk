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
    console.log('Connected to database. Dropping conflicting tables...');
    
    const tables = [
      'daily_inventory',
      'sales',
      'payments',
      'customers',
      'milk_items',
      'admins'
    ];
    
    for (const table of tables) {
      console.log(`Dropping table: public.${table}...`);
      await client.query(`DROP TABLE IF EXISTS public.${table} CASCADE;`);
    }
    
    console.log('✅ Successfully dropped all conflicting tables and constraints!');
  } catch (e) {
    console.error('❌ Failed to clean database:', e.message);
  } finally {
    await client.end();
  }
}

run();
