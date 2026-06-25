import pg from 'pg';
const { Client } = pg;

const host = 'aws-1-ap-northeast-2.pooler.supabase.com';
const database = 'postgres';
const user = 'postgres.jmikzmnlyufsbxqrjnux';
const password = 'Qal%%%1301200';

async function run() {
  const client = new Client({
    host,
    port: 5432, // use direct connection port
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('Connected to database. Dropping admin_profiles table...');
    await client.query('DROP TABLE IF EXISTS public.admin_profiles CASCADE;');
    console.log('✅ Successfully dropped public.admin_profiles table and its foreign keys!');
  } catch (e) {
    console.error('❌ Failed to drop table:', e.message);
  } finally {
    await client.end();
  }
}

run();
