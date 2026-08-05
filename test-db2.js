const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = env.split('=')[1].replace(/"/g, '').trim();
const sql = neon(dbUrl);

async function run() {
  await sql`ALTER TABLE bookings ALTER COLUMN booking_status TYPE VARCHAR(50)`;
  console.log("Column altered.");
}
run();
