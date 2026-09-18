const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const cats = await pool.query("SELECT DISTINCT category, COUNT(*) FROM items GROUP BY category");
    console.log('Categories in DB:', cats.rows);

    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'items'::regclass AND contype = 'c'
    `);
    console.log('Current constraints:', JSON.stringify(constraints.rows, null, 2));

    // Try inserting a test dairy item
    try {
      await pool.query("INSERT INTO items (name, name_ta, category, price_per_kg, emoji) VALUES ('TestDairy', 'test', 'dairy', 10, '🥛')");
      console.log('✅ Test dairy insert WORKED!');
      await pool.query("DELETE FROM items WHERE name = 'TestDairy'");
    } catch (e) {
      console.log('❌ Test dairy insert FAILED:', e.message);
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

check();
