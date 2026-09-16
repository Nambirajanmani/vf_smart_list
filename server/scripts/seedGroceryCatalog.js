const pool = require('../db/pool');

const GROCERY_ITEMS = [
  // ── Grains, Millets & Flours (தானியங்கள் & மாவு வகைகள்) ──
  { name: 'Rice', name_ta: 'அரிசி', emoji: '🌾', price_per_kg: 60.00 },
  { name: 'Boiled Rice', name_ta: 'புழுங்கல் அரிசி', emoji: '🍚', price_per_kg: 55.00 },
  { name: 'Raw Rice', name_ta: 'பச்சரிசி', emoji: '🍚', price_per_kg: 60.00 },
  { name: 'Idli Rice', name_ta: 'இட்லி அரிசி', emoji: '🍚', price_per_kg: 50.00 },
  { name: 'Basmati Rice', name_ta: 'பாசுமதி அரிசி', emoji: '🍚', price_per_kg: 120.00 },
  { name: 'Wheat', name_ta: 'கோதுமை', emoji: '🌾', price_per_kg: 40.00 },
  { name: 'Wheat Flour', name_ta: 'கோதுமை மாவு', emoji: '🌾', price_per_kg: 50.00 },
  { name: 'Maida / Refined Flour', name_ta: 'மைதா', emoji: '🥣', price_per_kg: 45.00 },
  { name: 'Semolina / Rava', name_ta: 'ரவை', emoji: '🥣', price_per_kg: 55.00 },
  { name: 'Pearl Millet', name_ta: 'கம்பு', emoji: '🌾', price_per_kg: 40.00 },
  { name: 'Finger Millet / Ragi', name_ta: 'கேழ்வரகு', emoji: '🌾', price_per_kg: 50.00 },
  { name: 'Sorghum / Jowar', name_ta: 'சோளம்', emoji: '🌽', price_per_kg: 45.00 },
  { name: 'Foxtail Millet', name_ta: 'தினை', emoji: '🌾', price_per_kg: 80.00 },
  { name: 'Little Millet', name_ta: 'சாமை', emoji: '🌾', price_per_kg: 90.00 },
  { name: 'Kodo Millet', name_ta: 'வரகு', emoji: '🌾', price_per_kg: 85.00 },
  { name: 'Barnyard Millet', name_ta: 'குதிரைவாலி', emoji: '🌾', price_per_kg: 95.00 },
  { name: 'Oats', name_ta: 'ஓட்ஸ்', emoji: '🥣', price_per_kg: 120.00 },
  { name: 'Flattened Rice / Poha', name_ta: 'அவல்', emoji: '🥣', price_per_kg: 50.00 },
  { name: 'Corn Flour', name_ta: 'சோள மாவு', emoji: '🌽', price_per_kg: 60.00 },
  { name: 'Gram Flour / Besan', name_ta: 'கடலை மாவு', emoji: '🟡', price_per_kg: 90.00 },
  { name: 'Rice Flour', name_ta: 'அரிசி மாவு', emoji: '🍚', price_per_kg: 55.00 },
  { name: 'Urad Flour', name_ta: 'உளுந்து மாவு', emoji: '⚪', price_per_kg: 140.00 },

  // ── Pulses & Lentils (பருப்பு & பயறு) ──
  { name: 'Toor Dal', name_ta: 'துவரம் பருப்பு', emoji: '🟡', price_per_kg: 150.00 },
  { name: 'Moong Dal', name_ta: 'பாசிப்பருப்பு', emoji: '🟡', price_per_kg: 120.00 },
  { name: 'Green Gram', name_ta: 'பாசிப்பயறு', emoji: '🟢', price_per_kg: 110.00 },
  { name: 'Urad Dal', name_ta: 'உளுத்தம் பருப்பு', emoji: '⚪', price_per_kg: 140.00 },
  { name: 'Chana Dal', name_ta: 'கடலைப் பருப்பு', emoji: '🟡', price_per_kg: 95.00 },
  { name: 'Horse Gram', name_ta: 'கொள்ளு', emoji: '🟤', price_per_kg: 80.00 },
  { name: 'Masoor Dal', name_ta: 'மசூர் பருப்பு', emoji: '🟠', price_per_kg: 100.00 },
  { name: 'Peas', name_ta: 'பட்டாணி', emoji: '🫛', price_per_kg: 70.00 },
  { name: 'White Chickpeas', name_ta: 'வெள்ளை கொண்டைக்கடலை', emoji: '⚪', price_per_kg: 130.00 },
  { name: 'Black Chickpeas', name_ta: 'கருப்பு கொண்டைக்கடலை', emoji: '🟤', price_per_kg: 90.00 },
  { name: 'Kidney Beans', name_ta: 'ராஜ்மா', emoji: '🫘', price_per_kg: 140.00 },
  { name: 'Black-Eyed Peas', name_ta: 'காராமணி', emoji: '🫘', price_per_kg: 110.00 },
  { name: 'Field Beans', name_ta: 'மொச்சை', emoji: '🫘', price_per_kg: 100.00 },
  { name: 'Soybeans', name_ta: 'சோயா பீன்ஸ்', emoji: '🫘', price_per_kg: 90.00 },

  // ── Spices & Masalas (மசாலா பொருட்கள்) ──
  { name: 'Salt', name_ta: 'உப்பு', emoji: '🧂', price_per_kg: 20.00 },
  { name: 'Sugar', name_ta: 'சர்க்கரை', emoji: '🍬', price_per_kg: 45.00 },
  { name: 'Jaggery', name_ta: 'வெல்லம்', emoji: '🟤', price_per_kg: 70.00 },
  { name: 'Dry Red Chilli', name_ta: 'மிளகாய்', emoji: '🌶️', price_per_kg: 220.00 },
  { name: 'Chilli Powder', name_ta: 'மிளகாய்த்தூள்', emoji: '🌶️', price_per_kg: 260.00 },
  { name: 'Black Pepper', name_ta: 'மிளகு', emoji: '⚫', price_per_kg: 650.00 },
  { name: 'Pepper Powder', name_ta: 'மிளகுத்தூள்', emoji: '⚫', price_per_kg: 700.00 },
  { name: 'Turmeric', name_ta: 'மஞ்சள்', emoji: '🟡', price_per_kg: 160.00 },
  { name: 'Turmeric Powder', name_ta: 'மஞ்சள் தூள்', emoji: '🟡', price_per_kg: 190.00 },
  { name: 'Cumin', name_ta: 'சீரகம்', emoji: '🌾', price_per_kg: 320.00 },
  { name: 'Coriander Seeds', name_ta: 'தனியா', emoji: '🌿', price_per_kg: 140.00 },
  { name: 'Coriander Powder', name_ta: 'தனியாத்தூள்', emoji: '🌿', price_per_kg: 160.00 },
  { name: 'Fennel Seeds', name_ta: 'சோம்பு', emoji: '🌿', price_per_kg: 220.00 },
  { name: 'Fenugreek', name_ta: 'வெந்தயம்', emoji: '🌾', price_per_kg: 100.00 },
  { name: 'Mustard Seeds', name_ta: 'கடுகு', emoji: '⚫', price_per_kg: 110.00 },
  { name: 'Fennel', name_ta: 'பெருஞ்சீரகம்', emoji: '🌿', price_per_kg: 240.00 },
  { name: 'Ajwain / Carom Seeds', name_ta: 'ஓமம்', emoji: '🌾', price_per_kg: 250.00 },
  { name: 'Cardamom', name_ta: 'ஏலக்காய்', emoji: '🟢', price_per_kg: 1600.00 },
  { name: 'Cloves', name_ta: 'கிராம்பு', emoji: '🟤', price_per_kg: 900.00 },
  { name: 'Cinnamon', name_ta: 'பட்டை', emoji: '🪵', price_per_kg: 550.00 },
  { name: 'Bay Leaf', name_ta: 'பிரியாணி இலை', emoji: '🍃', price_per_kg: 200.00 },
  { name: 'Star Anise', name_ta: 'அன்னாசிப்பூ', emoji: '⭐', price_per_kg: 800.00 },
  { name: 'Nutmeg', name_ta: 'ஜாதிக்காய்', emoji: '🟤', price_per_kg: 1100.00 },
  { name: 'Mace', name_ta: 'ஜாதிபத்திரி', emoji: '🍁', price_per_kg: 1800.00 },
  { name: 'Poppy Seeds', name_ta: 'கசகசா', emoji: '⚪', price_per_kg: 1400.00 },
  { name: 'Sesame Seeds', name_ta: 'எள்', emoji: '⚫', price_per_kg: 180.00 },
  { name: 'Asafoetida', name_ta: 'பெருங்காயம்', emoji: '🟤', price_per_kg: 650.00 },
  { name: 'Curry Leaves', name_ta: 'கறிவேப்பிலை', emoji: '🍃', price_per_kg: 40.00 },
  { name: 'Dried Fenugreek Leaves', name_ta: 'கசூரி மேத்தி', emoji: '🍃', price_per_kg: 300.00 },

  // ── Cooking Essentials (சமையல் பொருட்கள்) ──
  { name: 'Cooking Oil', name_ta: 'சமையல் எண்ணெய்', emoji: '🫙', price_per_kg: 150.00 },
  { name: 'Sesame Oil', name_ta: 'நல்லெண்ணெய்', emoji: '🫙', price_per_kg: 280.00 },
  { name: 'Coconut Oil', name_ta: 'தேங்காய் எண்ணெய்', emoji: '🥥', price_per_kg: 220.00 },
  { name: 'Groundnut Oil', name_ta: 'கடலை எண்ணெய்', emoji: '🫙', price_per_kg: 190.00 },
  { name: 'Sunflower Oil', name_ta: 'சூரியகாந்தி எண்ணெய்', emoji: '🌻', price_per_kg: 140.00 },
  { name: 'Olive Oil', name_ta: 'ஆலிவ் எண்ணெய்', emoji: '🫒', price_per_kg: 600.00 },
  { name: 'Ghee', name_ta: 'நெய்', emoji: '🧈', price_per_kg: 550.00 },
  { name: 'Butter', name_ta: 'வெண்ணெய்', emoji: '🧈', price_per_kg: 480.00 },
  { name: 'Coconut', name_ta: 'தேங்காய்', emoji: '🥥', price_per_kg: 30.00 },
  { name: 'Coconut Milk', name_ta: 'தேங்காய்ப்பால்', emoji: '🥥', price_per_kg: 120.00 },
  { name: 'Tamarind', name_ta: 'புளி', emoji: '🟤', price_per_kg: 110.00 },
  { name: 'Tomato Sauce', name_ta: 'தக்காளி சாஸ்', emoji: '🥫', price_per_kg: 130.00 },
  { name: 'Soy Sauce', name_ta: 'சோயா சாஸ்', emoji: '🍾', price_per_kg: 120.00 },
  { name: 'Vinegar', name_ta: 'வினிகர்', emoji: '🍶', price_per_kg: 60.00 },
  { name: 'Pickle', name_ta: 'ஊறுகாய்', emoji: '🫙', price_per_kg: 150.00 },
  { name: 'Papad', name_ta: 'அப்பளம்', emoji: '🫓', price_per_kg: 120.00 },
  { name: 'Vadam', name_ta: 'வடகம்', emoji: '🫓', price_per_kg: 140.00 },
  { name: 'Idli Powder', name_ta: 'இட்லி பொடி', emoji: '🥣', price_per_kg: 180.00 },
  { name: 'Sambar Powder', name_ta: 'சாம்பார் பொடி', emoji: '🥣', price_per_kg: 220.00 },
  { name: 'Rasam Powder', name_ta: 'ரசப்பொடி', emoji: '🥣', price_per_kg: 220.00 },
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
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding groceries:', err);
    process.exit(1);
  }
}

seedGroceries();
