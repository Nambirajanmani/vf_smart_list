const pool = require('../db/pool');

const GROCERY_ITEMS = [
  // ── Grains, Millets & Flours (தானியங்கள் & மாவு வகைகள்) ──
  { name: 'Arisi', name_ta: 'அரிசி', emoji: '🌾', price_per_kg: 60.00 },
  { name: 'Puzhungal Arisi', name_ta: 'புழுங்கல் அரிசி', emoji: '🍚', price_per_kg: 55.00 },
  { name: 'Pacharisi', name_ta: 'பச்சரிசி', emoji: '🍚', price_per_kg: 60.00 },
  { name: 'Idli Arisi', name_ta: 'இட்லி அரிசி', emoji: '🍚', price_per_kg: 50.00 },
  { name: 'Basmati Arisi', name_ta: 'பாசுமதி அரிசி', emoji: '🍚', price_per_kg: 120.00 },
  { name: 'Godhumai', name_ta: 'கோதுமை', emoji: '🌾', price_per_kg: 40.00 },
  { name: 'Godhumai Maavu', name_ta: 'கோதுமை மாவு', emoji: '🌾', price_per_kg: 50.00 },
  { name: 'Maida', name_ta: 'மைதா', emoji: '🥣', price_per_kg: 45.00 },
  { name: 'Ravai', name_ta: 'ரவை', emoji: '🥣', price_per_kg: 55.00 },
  { name: 'Kambu', name_ta: 'கம்பு', emoji: '🌾', price_per_kg: 40.00 },
  { name: 'Kelvaragu / Ragi', name_ta: 'கேழ்வரகு', emoji: '🌾', price_per_kg: 50.00 },
  { name: 'Cholam', name_ta: 'சோளம்', emoji: '🌽', price_per_kg: 45.00 },
  { name: 'Thinai', name_ta: 'தினை', emoji: '🌾', price_per_kg: 80.00 },
  { name: 'Samai', name_ta: 'சாமை', emoji: '🌾', price_per_kg: 90.00 },
  { name: 'Varagu', name_ta: 'வரகு', emoji: '🌾', price_per_kg: 85.00 },
  { name: 'Kuthiraivali', name_ta: 'குதிரைவாலி', emoji: '🌾', price_per_kg: 95.00 },
  { name: 'Oats', name_ta: 'ஓட்ஸ்', emoji: '🥣', price_per_kg: 120.00 },
  { name: 'Aval', name_ta: 'அவல்', emoji: '🥣', price_per_kg: 50.00 },
  { name: 'Cholam Maavu', name_ta: 'சோள மாவு', emoji: '🌽', price_per_kg: 60.00 },
  { name: 'Kadalai Maavu', name_ta: 'கடலை மாவு', emoji: '🟡', price_per_kg: 90.00 },
  { name: 'Arisi Maavu', name_ta: 'அரிசி மாவு', emoji: '🍚', price_per_kg: 55.00 },
  { name: 'Ulundhu Maavu', name_ta: 'உளுந்து மாவு', emoji: '⚪', price_per_kg: 140.00 },

  // ── Pulses & Lentils (பருப்பு & பயறு) ──
  { name: 'Thuvaram Paruppu', name_ta: 'துவரம் பருப்பு', emoji: '🟡', price_per_kg: 150.00 },
  { name: 'Paasi Paruppu', name_ta: 'பாசிப்பருப்பு', emoji: '🟡', price_per_kg: 120.00 },
  { name: 'Paasi Payaru', name_ta: 'பாசிப்பயறு', emoji: '🟢', price_per_kg: 110.00 },
  { name: 'Ulutham Paruppu', name_ta: 'உளுத்தம் பருப்பு', emoji: '⚪', price_per_kg: 140.00 },
  { name: 'Kadalai Paruppu', name_ta: 'கடலைப் பருப்பு', emoji: '🟡', price_per_kg: 95.00 },
  { name: 'Kollu', name_ta: 'கொள்ளு', emoji: '🟤', price_per_kg: 80.00 },
  { name: 'Masoor Paruppu', name_ta: 'மசூர் பருப்பு', emoji: '🟠', price_per_kg: 100.00 },
  { name: 'Pattani', name_ta: 'பட்டாணி', emoji: '🫛', price_per_kg: 70.00 },
  { name: 'Vellai Kondaikadalai', name_ta: 'வெள்ளை கொண்டைக்கடலை', emoji: '⚪', price_per_kg: 130.00 },
  { name: 'Karuppu Kondaikadalai', name_ta: 'கருப்பு கொண்டைக்கடலை', emoji: '🟤', price_per_kg: 90.00 },
  { name: 'Rajma', name_ta: 'ராஜ்மா', emoji: '🫘', price_per_kg: 140.00 },
  { name: 'Karamani', name_ta: 'காராமணி', emoji: '🫘', price_per_kg: 110.00 },
  { name: 'Mochai', name_ta: 'மொச்சை', emoji: '🫘', price_per_kg: 100.00 },
  { name: 'Soya Beans', name_ta: 'சோயா பீன்ஸ்', emoji: '🫘', price_per_kg: 90.00 },

  // ── Spices & Masalas (மசாலா பொருட்கள்) ──
  { name: 'Uppu', name_ta: 'உப்பு', emoji: '🧂', price_per_kg: 20.00 },
  { name: 'Sarkarai', name_ta: 'சர்க்கரை', emoji: '🍬', price_per_kg: 45.00 },
  { name: 'Vellam', name_ta: 'வெல்லம்', emoji: '🟤', price_per_kg: 70.00 },
  { name: 'Milagaai', name_ta: 'மிளகாய்', emoji: '🌶️', price_per_kg: 220.00 },
  { name: 'Milagaai Thool', name_ta: 'மிளகாய்த்தூள்', emoji: '🌶️', price_per_kg: 260.00 },
  { name: 'Milagu', name_ta: 'மிளகு', emoji: '⚫', price_per_kg: 650.00 },
  { name: 'Milagu Thool', name_ta: 'மிளகுத்தூள்', emoji: '⚫', price_per_kg: 700.00 },
  { name: 'Manjal', name_ta: 'மஞ்சள்', emoji: '🟡', price_per_kg: 160.00 },
  { name: 'Manjal Thool', name_ta: 'மஞ்சள் தூள்', emoji: '🟡', price_per_kg: 190.00 },
  { name: 'Seeragam', name_ta: 'சீரகம்', emoji: '🌾', price_per_kg: 320.00 },
  { name: 'Dhaniya', name_ta: 'தனியா', emoji: '🌿', price_per_kg: 140.00 },
  { name: 'Dhaniya Thool', name_ta: 'தனியாத்தூள்', emoji: '🌿', price_per_kg: 160.00 },
  { name: 'Sombu', name_ta: 'சோம்பு', emoji: '🌿', price_per_kg: 220.00 },
  { name: 'Vendhayam', name_ta: 'வெந்தயம்', emoji: '🌾', price_per_kg: 100.00 },
  { name: 'Kadugu', name_ta: 'கடுகு', emoji: '⚫', price_per_kg: 110.00 },
  { name: 'Perunjeeragam', name_ta: 'பெருஞ்சீரகம்', emoji: '🌿', price_per_kg: 240.00 },
  { name: 'Omam', name_ta: 'ஓமம்', emoji: '🌾', price_per_kg: 250.00 },
  { name: 'Elakkai', name_ta: 'ஏலக்காய்', emoji: '🟢', price_per_kg: 1600.00 },
  { name: 'Kirambu', name_ta: 'கிராம்பு', emoji: '🟤', price_per_kg: 900.00 },
  { name: 'Pattai', name_ta: 'பட்டை', emoji: '🪵', price_per_kg: 550.00 },
  { name: 'Biryani Ilai', name_ta: 'பிரியாணி இலை', emoji: '🍃', price_per_kg: 200.00 },
  { name: 'Annasipoo', name_ta: 'அன்னாசிப்பூ', emoji: '⭐', price_per_kg: 800.00 },
  { name: 'Jathikkai', name_ta: 'ஜாதிக்காய்', emoji: '🟤', price_per_kg: 1100.00 },
  { name: 'Jathipathiri', name_ta: 'ஜாதிபத்திரி', emoji: '🍁', price_per_kg: 1800.00 },
  { name: 'Kasakasa', name_ta: 'கசகசா', emoji: '⚪', price_per_kg: 1400.00 },
  { name: 'Ellu', name_ta: 'எள்', emoji: '⚫', price_per_kg: 180.00 },
  { name: 'Perungayam', name_ta: 'பெருங்காயம்', emoji: '🟤', price_per_kg: 650.00 },
  { name: 'Karuveppilai', name_ta: 'கறிவேப்பிலை', emoji: '🍃', price_per_kg: 40.00 },
  { name: 'Kasuri Methi', name_ta: 'கசூரி மேத்தி', emoji: '🍃', price_per_kg: 300.00 },

  // ── Cooking Essentials (சமையல் பொருட்கள்) ──
  { name: 'Samayal Ennai', name_ta: 'சமையல் எண்ணெய்', emoji: '🫙', price_per_kg: 150.00 },
  { name: 'Nallennai', name_ta: 'நல்லெண்ணெய்', emoji: '🫙', price_per_kg: 280.00 },
  { name: 'Thengai Ennai', name_ta: 'தேங்காய் எண்ணெய்', emoji: '🥥', price_per_kg: 220.00 },
  { name: 'Kadalai Ennai', name_ta: 'கடலை எண்ணெய்', emoji: '🫙', price_per_kg: 190.00 },
  { name: 'Suryakanthi Ennai', name_ta: 'சூரியகாந்தி எண்ணெய்', emoji: '🌻', price_per_kg: 140.00 },
  { name: 'Olive Ennai', name_ta: 'ஆலிவ் எண்ணெய்', emoji: '🫒', price_per_kg: 600.00 },
  { name: 'Nei', name_ta: 'நெய்', emoji: '🧈', price_per_kg: 550.00 },
  { name: 'Vennai', name_ta: 'வெண்ணெய்', emoji: '🧈', price_per_kg: 480.00 },
  { name: 'Thengai', name_ta: 'தேங்காய்', emoji: '🥥', price_per_kg: 30.00 },
  { name: 'Thengai Paal', name_ta: 'தேங்காய்ப்பால்', emoji: '🥥', price_per_kg: 120.00 },
  { name: 'Puli', name_ta: 'புளி', emoji: '🟤', price_per_kg: 110.00 },
  { name: 'Thakkali Sauce', name_ta: 'தக்காளி சாஸ்', emoji: '🥫', price_per_kg: 130.00 },
  { name: 'Soya Sauce', name_ta: 'சோயா சாஸ்', emoji: '🍾', price_per_kg: 120.00 },
  { name: 'Vinegar', name_ta: 'வினிகர்', emoji: '🍶', price_per_kg: 60.00 },
  { name: 'Oorugai', name_ta: 'ஊறுகாய்', emoji: '🫙', price_per_kg: 150.00 },
  { name: 'Appalam', name_ta: 'அப்பளம்', emoji: '🫓', price_per_kg: 120.00 },
  { name: 'Vadagam', name_ta: 'வடகம்', emoji: '🫓', price_per_kg: 140.00 },
  { name: 'Idli Podi', name_ta: 'இட்லி பொடி', emoji: '🥣', price_per_kg: 180.00 },
  { name: 'Sambar Podi', name_ta: 'சாம்பார் பொடி', emoji: '🥣', price_per_kg: 220.00 },
  { name: 'Rasam Podi', name_ta: 'ரசப்பொடி', emoji: '🥣', price_per_kg: 220.00 },
  { name: 'Garam Masala', name_ta: 'கரம் மசாலா', emoji: '🌶️', price_per_kg: 350.00 },
  { name: 'Biryani Masala', name_ta: 'பிரியாணி மசாலா', emoji: '🍛', price_per_kg: 350.00 },
];

async function seedGroceries() {
  console.log('🌱 Updating Grocery Items in Database...');

  try {
    // Delete existing grocery items to ensure fresh sync without duplicates
    await pool.query("DELETE FROM items WHERE category = 'grocery'");
    console.log('🗑️ Cleaned previous grocery items');

    for (const item of GROCERY_ITEMS) {
      await pool.query(
        `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
         VALUES ($1, $2, 'grocery', $3, $4, true)`,
        [item.name, item.name_ta, item.price_per_kg, item.emoji]
      );
    }

    console.log(`✅ Successfully seeded all ${GROCERY_ITEMS.length} grocery items!`);
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error seeding groceries:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seedGroceries();
}

module.exports = { GROCERY_ITEMS, seedGroceries };
