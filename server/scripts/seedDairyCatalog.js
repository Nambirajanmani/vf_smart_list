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

const DAIRY_ITEMS = [
  { name: 'Milk',           name_ta: 'பால்',               emoji: '🥛', price_per_kg: 50.00 },
  { name: 'Curd / Yogurt',  name_ta: 'தயிர்',              emoji: '🥣', price_per_kg: 40.00 },
  { name: 'Buttermilk',     name_ta: 'மோர்',               emoji: '🥛', price_per_kg: 25.00 },
  { name: 'Butter',         name_ta: 'வெண்ணெய்',           emoji: '🧈', price_per_kg: 480.00 },
  { name: 'Ghee',           name_ta: 'நெய்',               emoji: '🧈', price_per_kg: 550.00 },
  { name: 'Paneer',         name_ta: 'பன்னீர்',            emoji: '🧀', price_per_kg: 350.00 },
  { name: 'Cheese',         name_ta: 'சீஸ்',               emoji: '🧀', price_per_kg: 450.00 },
  { name: 'Cream',          name_ta: 'கிரீம்',             emoji: '🥛', price_per_kg: 200.00 },
  { name: 'Condensed Milk', name_ta: 'கண்டென்ஸ்டு மில்க்',  emoji: '🥫', price_per_kg: 160.00 },
  { name: 'Milk Powder',    name_ta: 'பால் பவுடர்',         emoji: '🥛', price_per_kg: 300.00 },
];

async function seedDairy() {
  console.log('🥛 Seeding Dairy Items...');

  try {
    // 1. Update database check constraint to include 'dairy'
    await pool.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check');
    await pool.query("ALTER TABLE items ADD CONSTRAINT items_category_check CHECK (category IN ('vegetable', 'fruit', 'grocery', 'dairy'))");
    console.log("✅ Updated category constraint to allow 'dairy'");

    // 2. Remove Butter and Ghee from grocery to avoid duplication
    await pool.query("DELETE FROM items WHERE category = 'grocery' AND name IN ('Butter', 'Ghee')");
    console.log("🗑️ Cleaned duplicate Butter & Ghee from grocery");

    // 3. Clean and re-seed dairy items
    await pool.query("DELETE FROM items WHERE category = 'dairy'");

    for (const item of DAIRY_ITEMS) {
      const res = await pool.query(
        `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
         VALUES ($1, $2, 'dairy', $3, $4, true)
         RETURNING id, name, name_ta`,
        [item.name, item.name_ta, item.price_per_kg, item.emoji]
      );
      console.log(`✅ Added Dairy: ${res.rows[0].name} (${res.rows[0].name_ta}) [ID: ${res.rows[0].id}]`);
    }

    const totalDairy = await pool.query("SELECT COUNT(*) FROM items WHERE category = 'dairy'");
    const totalAll   = await pool.query("SELECT COUNT(*) FROM items");
    console.log(`\n🥛 Total Dairy items in DB: ${totalDairy.rows[0].count}`);
    console.log(`📦 Total Catalog items in DB: ${totalAll.rows[0].count}`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding dairy:', err.message);
    await pool.end();
    process.exit(1);
  }
}

seedDairy();
