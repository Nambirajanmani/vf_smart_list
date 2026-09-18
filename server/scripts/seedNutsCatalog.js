const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const NUTS_ITEMS = [
  { name: 'Mundhiri', name_ta: 'முந்திரி', emoji: '🥜' },
  { name: 'Badam', name_ta: 'பாதாம்', emoji: '🥜' },
  { name: 'Pista', name_ta: 'பிஸ்தா', emoji: '🥜' },
  { name: 'Walnut', name_ta: 'வால்நட்', emoji: '🧠' },
  { name: 'Nilakkadalai', name_ta: 'நிலக்கடலை', emoji: '🥜' },
  { name: 'Ular Thiratchai', name_ta: 'உலர் திராட்சை', emoji: '🍇' },
  { name: 'Pericham Pazham', name_ta: 'பேரீச்சம்பழம்', emoji: '🌴' },
  { name: 'Athipazham', name_ta: 'அத்திப்பழம்', emoji: '🟤' },
  { name: 'Badam Paruppu', name_ta: 'பாதாம் பருப்பு', emoji: '🥜' },
  { name: 'Poosani Vidhai', name_ta: 'பூசணி விதை', emoji: '🎃' },
  { name: 'Suryakanthi Vidhai', name_ta: 'சூரியகாந்தி விதை', emoji: '🌻' },
  { name: 'Chia Vidhai', name_ta: 'சியா விதை', emoji: '⚫' },
  { name: 'Aali Vidhai', name_ta: 'ஆளி விதை', emoji: '🟤' },
];

async function run() {
  try {
    console.log('--- Updating items category constraint to include "nuts" ---');
    await pool.query(`ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check`);
    await pool.query(`
      ALTER TABLE items ADD CONSTRAINT items_category_check
      CHECK (category IN ('vegetable', 'fruit', 'grocery', 'dairy', 'nuts'))
    `);
    console.log('Constraint updated successfully.');

    console.log('--- Seeding Nuts & Dry Fruits ---');
    for (const item of NUTS_ITEMS) {
      const existing = await pool.query(
        'SELECT id, name, category FROM items WHERE (name ILIKE $1 OR name_ta = $2) AND category = $3',
        [item.name, item.name_ta, 'nuts']
      );

      if (existing.rows.length === 0) {
        const res = await pool.query(
          `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
           VALUES ($1, $2, 'nuts', 0.00, $3, TRUE)
           RETURNING id, name, name_ta, category, emoji`,
          [item.name, item.name_ta, item.emoji]
        );
        console.log(`Added [${res.rows[0].id}] ${res.rows[0].name} (${res.rows[0].name_ta})`);
      } else {
        console.log(`Already exists: [${existing.rows[0].id}] ${existing.rows[0].name}`);
      }
    }

    const check = await pool.query('SELECT count(*) FROM items WHERE category = \'nuts\'');
    console.log(`Total nuts in DB: ${check.rows[0].count}`);

    const allStats = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE category = 'vegetable') AS veg,
        COUNT(*) FILTER (WHERE category = 'fruit') AS fruit,
        COUNT(*) FILTER (WHERE category = 'grocery') AS grocery,
        COUNT(*) FILTER (WHERE category = 'dairy') AS dairy,
        COUNT(*) FILTER (WHERE category = 'nuts') AS nuts
      FROM items
    `);
    console.log('Catalog stats:', allStats.rows[0]);

  } catch (err) {
    console.error('Error seeding nuts catalog:', err);
  } finally {
    await pool.end();
  }
}

run();
