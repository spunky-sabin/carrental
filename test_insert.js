const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['cars']);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
