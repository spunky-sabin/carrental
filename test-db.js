const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = env.split('=')[1].replace(/"/g, '').trim();

const sql = neon(dbUrl);

async function run() {
  try {
    const res = await sql`SELECT data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_status'`;
    console.log("Schema:", res);
    
    // Check if there is a CHECK constraint on booking_status
    const constraints = await sql`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'bookings' AND pg_get_constraintdef(c.oid) LIKE '%booking_status%';
    `;
    console.log("Constraints:", constraints);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
