const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const VEGETABLES = [
  { name: 'Thakkali', name_ta: 'தக்காளி', emoji: '🍅', price_per_kg: 30 },
  { name: 'Urulaikizhangu', name_ta: 'உருளைக்கிழங்கு', emoji: '🥔', price_per_kg: 25 },
  { name: 'Vengayam', name_ta: 'வெங்காயம்', emoji: '🧅', price_per_kg: 35 },
  { name: 'Poondu', name_ta: 'பூண்டு', emoji: '🧄', price_per_kg: 120 },
  { name: 'Inji', name_ta: 'இஞ்சி', emoji: '🫚', price_per_kg: 80 },
  { name: 'Carrot', name_ta: 'கேரட்', emoji: '🥕', price_per_kg: 40 },
  { name: 'Muttaikose', name_ta: 'முட்டைக்கோஸ்', emoji: '🥬', price_per_kg: 20 },
  { name: 'Cauliflower', name_ta: 'காலிஃபிளவர்', emoji: '🥦', price_per_kg: 30 },
  { name: 'Broccoli', name_ta: 'புரோக்கோலி', emoji: '🥦', price_per_kg: 60 },
  { name: 'Keerai', name_ta: 'கீரை', emoji: '🌿', price_per_kg: 30 },
  { name: 'Pattani', name_ta: 'பட்டாணி', emoji: '🫛', price_per_kg: 60 },
  { name: 'Beans', name_ta: 'பீன்ஸ்', emoji: '🫘', price_per_kg: 50 },
  { name: 'Vendaikkai', name_ta: 'வெண்டைக்காய்', emoji: '🌾', price_per_kg: 40 },
  { name: 'Kathirikkai', name_ta: 'கத்திரிக்காய்', emoji: '🍆', price_per_kg: 25 },
  { name: 'Kudai Milagaai', name_ta: 'குடைமிளகாய்', emoji: '🫑', price_per_kg: 60 },
  { name: 'Pachai Milagaai', name_ta: 'பச்சை மிளகாய்', emoji: '🌶️', price_per_kg: 50 },
  { name: 'Kaindha Milagaai', name_ta: 'காய்ந்த மிளகாய்', emoji: '🌶️', price_per_kg: 200 },
  { name: 'Paavakkai', name_ta: 'பாகற்காய்', emoji: '🥒', price_per_kg: 40 },
  { name: 'Sorakkai', name_ta: 'சுரைக்காய்', emoji: '🥒', price_per_kg: 20 },
  { name: 'Peerkkangkai', name_ta: 'பீர்க்கங்காய்', emoji: '🥒', price_per_kg: 30 },
  { name: 'Pudalangkai', name_ta: 'புடலங்காய்', emoji: '🥒', price_per_kg: 25 },
  { name: 'Poosanikkai', name_ta: 'பூசணிக்காய்', emoji: '🥒', price_per_kg: 15 },
  { name: 'Manjal Poosani', name_ta: 'மஞ்சள் பூசணி', emoji: '🎃', price_per_kg: 20 },
  { name: 'Sarkkaravalli', name_ta: 'சர்க்கரைவள்ளி கிழங்கு', emoji: '🍠', price_per_kg: 35 },
  { name: 'Senaikizhungu', name_ta: 'சேனைக்கிழங்கு', emoji: '🌱', price_per_kg: 40 },
  { name: 'Cheppankizhungu', name_ta: 'சேப்பங்கிழங்கு', emoji: '🌱', price_per_kg: 30 },
  { name: 'Mullangi', name_ta: 'முள்ளங்கி', emoji: '🌱', price_per_kg: 20 },
  { name: 'Beetroot', name_ta: 'பீட்ரூட்', emoji: '🟣', price_per_kg: 30 },
  { name: 'Turnip', name_ta: 'டர்னிப்', emoji: '🌱', price_per_kg: 25 },
  { name: 'Cholam', name_ta: 'சோளம்', emoji: '🌽', price_per_kg: 20 },
  { name: 'Kaalaan', name_ta: 'காளான்', emoji: '🍄', price_per_kg: 150 },
  { name: 'Vengayathal', name_ta: 'வெங்காயத்தாள்', emoji: '🧅', price_per_kg: 30 },
  { name: 'Leeks', name_ta: 'லீக்ஸ்', emoji: '🌿', price_per_kg: 40 },
  { name: 'Celery', name_ta: 'செலரி', emoji: '🌿', price_per_kg: 60 },
  { name: 'Vellarikai', name_ta: 'வெள்ளரிக்காய்', emoji: '🥒', price_per_kg: 20 },
  { name: 'Zucchini', name_ta: 'சுக்கிணி', emoji: '🥒', price_per_kg: 50 },
  { name: 'Murungakkai', name_ta: 'முருங்கைக்காய்', emoji: '🌿', price_per_kg: 60 },
  { name: 'Vazhakkai', name_ta: 'வாழக்காய்', emoji: '🍌', price_per_kg: 30 },
  { name: 'Pappalikkai', name_ta: 'பப்பாளிக்காய்', emoji: '🌱', price_per_kg: 25 },
  { name: 'Kothavarankkai', name_ta: 'கொத்தவரங்காய்', emoji: '🫘', price_per_kg: 50 },
  { name: 'Avarakkai', name_ta: 'அவரைக்காய்', emoji: '🫘', price_per_kg: 45 },
  { name: 'Vendhaya Keerai', name_ta: 'வெந்தயக் கீரை', emoji: '🌿', price_per_kg: 20 },
  { name: 'Chinna Vengayam', name_ta: 'சின்ன வெங்காயம்', emoji: '🧅', price_per_kg: 60 },
  { name: 'Chow Chow', name_ta: 'சௌ சௌ', emoji: '🍐', price_per_kg: 35 },
  { name: 'French Beans', name_ta: 'பிரெஞ்ச் பீன்ஸ்', emoji: '🫘', price_per_kg: 60 },
  { name: 'Palak Keerai', name_ta: 'பாலக்கீரை', emoji: '🥬', price_per_kg: 30 },
  { name: 'Pudina', name_ta: 'புதினா', emoji: '🌿', price_per_kg: 40 },
  { name: 'Kothamalli', name_ta: 'கொத்தமல்லி', emoji: '🌿', price_per_kg: 40 },
];

const FRUITS = [
  { name: 'Maambazham', name_ta: 'மாம்பழம்', emoji: '🥭', price_per_kg: 80 },
  { name: 'Apple', name_ta: 'ஆப்பிள்', emoji: '🍎', price_per_kg: 150 },
  { name: 'Vazhapazham', name_ta: 'வாழைப்பழம்', emoji: '🍌', price_per_kg: 40 },
  { name: 'Thiratchai', name_ta: 'திராட்சை', emoji: '🍇', price_per_kg: 80 },
  { name: 'Aaranju', name_ta: 'ஆரஞ்சு', emoji: '🍊', price_per_kg: 60 },
  { name: 'Pappali', name_ta: 'பப்பாளி', emoji: '🫐', price_per_kg: 35 },
  { name: 'Tharboosani', name_ta: 'தர்பூசணி', emoji: '🍉', price_per_kg: 20 },
  { name: 'Mulampazham', name_ta: 'முலாம்பழம்', emoji: '🍈', price_per_kg: 30 },
  { name: 'Annasi', name_ta: 'அன்னாசி', emoji: '🍍', price_per_kg: 50 },
  { name: 'Mathulai', name_ta: 'மாதுளை', emoji: '🍎', price_per_kg: 120 },
  { name: 'Koyyapazham', name_ta: 'கொய்யா', emoji: '🍐', price_per_kg: 50 },
  { name: 'Sapota', name_ta: 'சப்போட்டா', emoji: '🟤', price_per_kg: 60 },
  { name: 'Thengai', name_ta: 'தேங்காய்', emoji: '🥥', price_per_kg: 30 },
  { name: 'Elumichai', name_ta: 'எலுமிச்சை', emoji: '🍋', price_per_kg: 80 },
  { name: 'Pachai Elumichai', name_ta: 'பச்சை எலுமிச்சை', emoji: '🟢', price_per_kg: 60 },
  { name: 'Strawberry', name_ta: 'ஸ்ட்ராபெர்ரி', emoji: '🍓', price_per_kg: 200 },
  { name: 'Kiwi', name_ta: 'கிவி', emoji: '🥝', price_per_kg: 250 },
  { name: 'Pearikkai', name_ta: 'பேரிக்காய்', emoji: '🍐', price_per_kg: 100 },
  { name: 'Peach', name_ta: 'பீச்', emoji: '🍑', price_per_kg: 150 },
  { name: 'Plum', name_ta: 'பிளம்ஸ்', emoji: '🟣', price_per_kg: 120 },
  { name: 'Cherry', name_ta: 'செர்ரி', emoji: '🍒', price_per_kg: 300 },
  { name: 'Athipazham', name_ta: 'அத்திப்பழம்', emoji: '🟤', price_per_kg: 200 },
  { name: 'Dragon Pazham', name_ta: 'டிராகன் பழம்', emoji: '🐉', price_per_kg: 200 },
  { name: 'Vennai Pazham', name_ta: 'வெண்ணெய் பழம்', emoji: '🥑', price_per_kg: 250 },
  { name: 'Palabazham', name_ta: 'பலாப்பழம்', emoji: '🍈', price_per_kg: 40 },
  { name: 'Seethapazham', name_ta: 'சீதாப்பழம்', emoji: '🍏', price_per_kg: 80 },
  { name: 'Vilambi Pazham', name_ta: 'விளிம்பிப் பழம்', emoji: '⭐', price_per_kg: 60 },
  { name: 'Passion Fruit', name_ta: 'பாஷன் ஃப்ரூட்', emoji: '🟡', price_per_kg: 150 },
  { name: 'Puli', name_ta: 'புளி', emoji: '🟤', price_per_kg: 100 },
  { name: 'Nellikkai', name_ta: 'நெல்லிக்காய்', emoji: '🟢', price_per_kg: 60 },
  { name: 'Pericham Pazham', name_ta: 'பேரீச்சம்பழம்', emoji: '🟤', price_per_kg: 200 },
  { name: 'Litchi', name_ta: 'லிச்சி', emoji: '🔴', price_per_kg: 120 },
];

async function seed() {
  console.log('🌿 Seeding Vegetables & Fruits...');
  try {
    // Clear existing veg and fruit
    await pool.query("DELETE FROM items WHERE category IN ('vegetable', 'fruit')");
    console.log('🗑️ Cleared existing vegetable & fruit items');

    // Insert vegetables
    for (const item of VEGETABLES) {
      await pool.query(
        "INSERT INTO items (name, name_ta, category, price_per_kg, emoji) VALUES ($1, $2, 'vegetable', $3, $4)",
        [item.name, item.name_ta, item.price_per_kg, item.emoji]
      );
    }
    console.log(`✅ Seeded ${VEGETABLES.length} vegetables`);

    // Insert fruits
    for (const item of FRUITS) {
      await pool.query(
        "INSERT INTO items (name, name_ta, category, price_per_kg, emoji) VALUES ($1, $2, 'fruit', $3, $4)",
        [item.name, item.name_ta, item.price_per_kg, item.emoji]
      );
    }
    console.log(`✅ Seeded ${FRUITS.length} fruits`);

    const total = await pool.query("SELECT category, COUNT(*) FROM items GROUP BY category ORDER BY category");
    console.log('\n📦 Final counts:', total.rows);
    const totalAll = await pool.query("SELECT COUNT(*) FROM items");
    console.log(`📦 Total items: ${totalAll.rows[0].count}`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

seed();
