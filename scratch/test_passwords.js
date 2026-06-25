import pg from 'pg';
const { Client } = pg;

const host = 'aws-1-ap-northeast-2.pooler.supabase.com';
const database = 'postgres';
const user = 'postgres.jmikzmnlyufsbxqrjnux';
const password = 'Qal%%%1301200'; // Raw password for pg Client config (no URL encoding needed here)

async function run() {
  console.log(`Testing raw connection with host=${host}, user=${user}, port=6543`);
  const client = new Client({
    host,
    port: 6543,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS! Database connected with raw password.`);
    await client.end();
  } catch (e) {
    console.log(`❌ FAILED raw connection: ${e.message}`);
  }

  // Also test with URL encoded password in connection string
  const encodedPassword = encodeURIComponent(password);
  console.log(`Testing with connection URL: postgresql://${user}:${encodedPassword}@${host}:6543/${database}?pgbouncer=true`);
  
  const clientUrl = new Client({
    connectionString: `postgresql://${user}:${encodedPassword}@${host}:6543/${database}?pgbouncer=true`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await clientUrl.connect();
    console.log(`✅ SUCCESS! Database connected with URL-encoded string: ${encodedPassword}`);
    await clientUrl.end();
  } catch (e) {
    console.log(`❌ FAILED URL connection: ${e.message}`);
  }
}

run();
