const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vf_smart_list',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 3000,
});

async function check() {
  try {
    const res = await pool.query("SELECT COUNT(*) FROM items WHERE category = 'grocery'");
    console.log('PG CONNECTED! Grocery Count in PG:', res.rows[0].count);
    const total = await pool.query("SELECT COUNT(*) FROM items");
    console.log('Total items in PG:', total.rows[0].count);
  } catch (err) {
    console.log('PG FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

check();
