const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vf_smart_list',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'nambi',
  connectionTimeoutMillis: 3000,
});

const VEG_ADDITIONS = [
  { name: 'Shallots (Small Onion)', name_ta: 'சின்ன வெங்காயம்', emoji: '🧅', price_per_kg: 60.00 },
  { name: 'Chayote (Chow Chow)',    name_ta: 'சௌ சௌ',          emoji: '🍐', price_per_kg: 35.00 },
  { name: 'French Beans',           name_ta: 'பிரெஞ்ச் பீன்ஸ்',   emoji: '🫘', price_per_kg: 60.00 },
  { name: 'Palak (Spinach)',        name_ta: 'பாலக்கீரை',       emoji: '🥬', price_per_kg: 30.00 },
  { name: 'Mint Leaves (Pudina)',   name_ta: 'புதினா',          emoji: '🌿', price_per_kg: 40.00 },
  { name: 'Coriander Leaves',       name_ta: 'கொத்தமல்லி',       emoji: '🌿', price_per_kg: 40.00 },
];

async function addMissingVegetables() {
  console.log('🌱 Checking and adding missing vegetables...');

  try {
    for (const item of VEG_ADDITIONS) {
      // Check if item already exists by name or name_ta
      const checkRes = await pool.query(
        `SELECT id, name FROM items WHERE (name ILIKE $1 OR name_ta = $2) AND category = 'vegetable'`,
        [item.name, item.name_ta]
      );

      if (checkRes.rows.length > 0) {
        console.log(`⏩ "${item.name}" already exists (ID: ${checkRes.rows[0].id}), skipping.`);
      } else {
        const insertRes = await pool.query(
          `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
           VALUES ($1, $2, 'vegetable', $3, $4, true)
           RETURNING id, name, name_ta`,
          [item.name, item.name_ta, item.price_per_kg, item.emoji]
        );
        console.log(`✅ Added: ${insertRes.rows[0].name} (${insertRes.rows[0].name_ta}) [ID: ${insertRes.rows[0].id}]`);
      }
    }

    const totalVeg = await pool.query(`SELECT COUNT(*) FROM items WHERE category = 'vegetable'`);
    const totalAll = await pool.query(`SELECT COUNT(*) FROM items`);
    console.log(`\n🥦 Total Vegetables in DB: ${totalVeg.rows[0].count}`);
    console.log(`📦 Total Items in Catalog: ${totalAll.rows[0].count}`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding vegetables:', err.message);
    await pool.end();
    process.exit(1);
  }
}

addMissingVegetables();
