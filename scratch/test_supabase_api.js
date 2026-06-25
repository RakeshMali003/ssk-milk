async function run() {
  const url = 'https://jmikzmnlyufsbxqrjnux.supabase.co/auth/v1/health';
  try {
    const res = await fetch(url);
    console.log(`Supabase Auth Health status: ${res.status}`);
    const data = await res.json();
    console.log('Health response:', data);
  } catch (e) {
    console.error('Failed to connect to Supabase HTTP API:', e.message);
  }
}

run();
