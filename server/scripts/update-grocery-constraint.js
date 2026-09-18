const pool = require('../db/pool');

async function run() {
  try {
    // 1. Drop old constraint
    await pool.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check');
    console.log('Old constraint dropped.');

    // 2. Add new constraint
    await pool.query(`ALTER TABLE items ADD CONSTRAINT items_category_check CHECK (category IN ('vegetable', 'fruit', 'grocery'))`);
    console.log('New constraint added (vegetable, fruit, grocery).');

    // 3. Check if grocery items already exist
    const existing = await pool.query("SELECT COUNT(*) FROM items WHERE category = 'grocery'");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`Grocery items already exist (${existing.rows[0].count}), skipping seed.`);
      pool.end();
      return;
    }

    // 4. Seed grocery items
    await pool.query(`
      INSERT INTO items (name, name_ta, category, price_per_kg, emoji) VALUES
        ('Manja Masala',          'மஞ்சள் மசாலா',        'grocery', 200.00, '🌿'),
        ('Manjal Thool',          'மஞ்சள் தூள்',           'grocery', 180.00, '🟡'),
        ('Milagaai Thool',        'மிளகாய் தூள்',          'grocery', 250.00, '🌶️'),
        ('Dhaniya Thool',         'தனியா தூள்',            'grocery', 150.00, '🌿'),
        ('Seeragam',              'சீரகம்',                'grocery', 300.00, '🌾'),
        ('Kadugu',                'கடுகு',                 'grocery', 120.00, '⚫'),
        ('Vendhayam',             'வெந்தயம்',              'grocery', 100.00, '🌾'),
        ('Milagu',                'மிளகு',                 'grocery', 600.00, '⚫'),
        ('Elakkai',               'ஏலக்காய்',              'grocery', 1500.00,'🟢'),
        ('Kirambu',               'கிராம்பு',              'grocery', 800.00, '🟤'),
        ('Pattai',                'இலவங்கப்பட்டை',         'grocery', 500.00, '🟤'),
        ('Biryani Ilai',          'பிரியாணி இலை',          'grocery', 200.00, '🍃'),
        ('Perungayam',            'பெருங்காயம்',           'grocery', 600.00, '🟤'),
        ('Garam Masala',          'கரம் மசாலா',            'grocery', 350.00, '🌶️'),
        ('Sambar Podi',           'சாம்பார் பொடி',         'grocery', 200.00, '🌿'),
        ('Rasam Podi',            'ரசம் பொடி',             'grocery', 200.00, '🌿'),
        ('Biryani Masala',        'பிரியாணி மசாலா',        'grocery', 300.00, '🌶️'),
        ('Uppu',                  'உப்பு',                 'grocery', 20.00,  '🧂'),
        ('Sarkarai',              'சக்கரை',               'grocery', 45.00,  '🍬'),
        ('Arisi',                 'அரிசி',                 'grocery', 60.00,  '🍚'),
        ('Godhumai Maavu',        'கோதுமை மாவு',           'grocery', 50.00,  '🌾'),
        ('Thuvaram Paruppu',      'துவரம் பருப்பு',         'grocery', 120.00, '🟡'),
        ('Paasi Paruppu',         'பாசிப் பருப்பு',         'grocery', 100.00, '🟢'),
        ('Ulutham Paruppu',       'உளுந்தம் பருப்பு',       'grocery', 130.00, '⚪'),
        ('Kadalai Paruppu',       'கடலை பருப்பு',           'grocery', 90.00,  '🟡'),
        ('Samayal Ennai',         'சமையல் எண்ணெய்',        'grocery', 150.00, '🫙'),
        ('Thengai Ennai',         'தேங்காய் எண்ணெய்',      'grocery', 220.00, '🥥'),
        ('Puli Vizhudu',          'புளி விழுது',            'grocery', 80.00,  '🟤'),
        ('Vellam',                'வெல்லம்',               'grocery', 70.00,  '🟤'),
        ('Chukku Podi',           'சுக்கு பொடி',           'grocery', 400.00, '🟤')
    `);
    console.log('Grocery items seeded successfully (30 items including Manja Masala).');
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
}

run();
