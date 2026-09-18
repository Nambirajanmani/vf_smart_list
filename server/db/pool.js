const { Pool } = require('pg');
const bcrypt   = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const rawPool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'vf_smart_list',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      connectionTimeoutMillis: 3000,
    });

let isDbConnected = false;
const dbReadyPromise = new Promise((resolve) => {
  rawPool.connect((err, client, release) => {
    if (err) {
      console.warn('⚠️ PostgreSQL connection notice:', err.message);
      console.warn('💡 Running in Fail-Safe In-Memory Mode (All items ready!).');
      isDbConnected = false;
      resolve(false);
    } else {
      console.log('✅ PostgreSQL connected successfully!');
      isDbConnected = true;
      release();
      resolve(true);
    }
  });
});

rawPool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL pool notice:', err.message);
  isDbConnected = false;
});

// Initial Seed Data for In-Memory Fallback with English & Tamil names
const DEFAULT_ITEMS = [
  // Vegetables (48)
  { id: 1,  name: 'Thakkali',          name_ta: 'தக்காளி',            category: 'vegetable', price_per_kg: 30.00,  emoji: '🍅', is_active: true },
  { id: 2,  name: 'Urulaikizhangu',    name_ta: 'உருளைக்கிழங்கு',      category: 'vegetable', price_per_kg: 25.00,  emoji: '🥔', is_active: true },
  { id: 3,  name: 'Vengayam',          name_ta: 'வெங்காயம்',          category: 'vegetable', price_per_kg: 35.00,  emoji: '🧅', is_active: true },
  { id: 4,  name: 'Poondu',            name_ta: 'பூண்டு',              category: 'vegetable', price_per_kg: 120.00, emoji: '🧄', is_active: true },
  { id: 5,  name: 'Inji',              name_ta: 'இஞ்சி',              category: 'vegetable', price_per_kg: 80.00,  emoji: '🫚', is_active: true },
  { id: 6,  name: 'Carrot',            name_ta: 'கேரட்',              category: 'vegetable', price_per_kg: 40.00,  emoji: '🥕', is_active: true },
  { id: 7,  name: 'Muttaikose',        name_ta: 'முட்டைக்கோஸ்',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🥬', is_active: true },
  { id: 8,  name: 'Cauliflower',       name_ta: 'காலிஃபிளவர்',       category: 'vegetable', price_per_kg: 30.00,  emoji: '🥦', is_active: true },
  { id: 9,  name: 'Broccoli',          name_ta: 'புரோக்கோலி',         category: 'vegetable', price_per_kg: 60.00,  emoji: '🥦', is_active: true },
  { id: 10, name: 'Keerai',            name_ta: 'கீரை',               category: 'vegetable', price_per_kg: 30.00,  emoji: '🌿', is_active: true },
  { id: 11, name: 'Pattani',           name_ta: 'பட்டாணி',            category: 'vegetable', price_per_kg: 60.00,  emoji: '🫛', is_active: true },
  { id: 12, name: 'Beans',             name_ta: 'பீன்ஸ்',              category: 'vegetable', price_per_kg: 50.00,  emoji: '🫘', is_active: true },
  { id: 13, name: 'Vendaikkai',        name_ta: 'வெண்டைக்காய்',        category: 'vegetable', price_per_kg: 40.00,  emoji: '🌾', is_active: true },
  { id: 14, name: 'Kathirikkai',       name_ta: 'கத்திரிக்காய்',       category: 'vegetable', price_per_kg: 25.00,  emoji: '🍆', is_active: true },
  { id: 15, name: 'Kudai Milagaai',    name_ta: 'குடைமிளகாய்',        category: 'vegetable', price_per_kg: 60.00,  emoji: '🫑', is_active: true },
  { id: 16, name: 'Pachai Milagaai',   name_ta: 'பச்சை மிளகாய்',       category: 'vegetable', price_per_kg: 50.00,  emoji: '🌶️', is_active: true },
  { id: 17, name: 'Kaindha Milagaai',  name_ta: 'காய்ந்த மிளகாய்',     category: 'vegetable', price_per_kg: 200.00, emoji: '🌶️', is_active: true },
  { id: 18, name: 'Paavakkai',         name_ta: 'பாகற்காய்',          category: 'vegetable', price_per_kg: 40.00,  emoji: '🥒', is_active: true },
  { id: 19, name: 'Sorakkai',          name_ta: 'சுரைக்காய்',          category: 'vegetable', price_per_kg: 20.00,  emoji: '🥒', is_active: true },
  { id: 20, name: 'Peerkkangkai',      name_ta: 'பீர்க்கங்காய்',        category: 'vegetable', price_per_kg: 30.00,  emoji: '🥒', is_active: true },
  { id: 21, name: 'Pudalangkai',       name_ta: 'புடலங்காய்',          category: 'vegetable', price_per_kg: 25.00,  emoji: '🥒', is_active: true },
  { id: 22, name: 'Poosanikkai',       name_ta: 'பூசணிக்காய்',         category: 'vegetable', price_per_kg: 15.00,  emoji: '🥒', is_active: true },
  { id: 23, name: 'Manjal Poosani',    name_ta: 'மஞ்சள் பூசணி',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🎃', is_active: true },
  { id: 24, name: 'Sarkkaravalli',     name_ta: 'சர்க்கரைவள்ளி கிழங்கு',category: 'vegetable', price_per_kg: 35.00,  emoji: '🍠', is_active: true },
  { id: 25, name: 'Senaikizhungu',     name_ta: 'சேனைக்கிழங்கு',       category: 'vegetable', price_per_kg: 40.00,  emoji: '🌱', is_active: true },
  { id: 26, name: 'Cheppankizhungu',   name_ta: 'சேப்பங்கிழங்கு',      category: 'vegetable', price_per_kg: 30.00,  emoji: '🌱', is_active: true },
  { id: 27, name: 'Mullangi',          name_ta: 'முள்ளங்கி',           category: 'vegetable', price_per_kg: 20.00,  emoji: '🌱', is_active: true },
  { id: 28, name: 'Beetroot',          name_ta: 'பீட்ரூட்',            category: 'vegetable', price_per_kg: 30.00,  emoji: '🟣', is_active: true },
  { id: 29, name: 'Turnip',            name_ta: 'டர்னிப்',            category: 'vegetable', price_per_kg: 25.00,  emoji: '🌱', is_active: true },
  { id: 30, name: 'Cholam',            name_ta: 'சோளம்',              category: 'vegetable', price_per_kg: 20.00,  emoji: '🌽', is_active: true },
  { id: 31, name: 'Kaalaan',           name_ta: 'காளான்',             category: 'vegetable', price_per_kg: 150.00, emoji: '🍄', is_active: true },
  { id: 32, name: 'Vengayathal',       name_ta: 'வெங்காயத்தாள்',      category: 'vegetable', price_per_kg: 30.00,  emoji: '🧅', is_active: true },
  { id: 33, name: 'Leeks',             name_ta: 'லீக்ஸ்',              category: 'vegetable', price_per_kg: 40.00,  emoji: '🌿', is_active: true },
  { id: 34, name: 'Celery',            name_ta: 'செலரி',              category: 'vegetable', price_per_kg: 60.00,  emoji: '🌿', is_active: true },
  { id: 35, name: 'Vellarikai',        name_ta: 'வெள்ளரிக்காய்',        category: 'vegetable', price_per_kg: 20.00,  emoji: '🥒', is_active: true },
  { id: 36, name: 'Zucchini',          name_ta: 'சுக்கிணி',            category: 'vegetable', price_per_kg: 50.00,  emoji: '🥒', is_active: true },
  { id: 37, name: 'Murungakkai',       name_ta: 'முருங்கைக்காய்',        category: 'vegetable', price_per_kg: 60.00,  emoji: '🌿', is_active: true },
  { id: 38, name: 'Vazhakkai',         name_ta: 'வாழக்காய்',          category: 'vegetable', price_per_kg: 30.00,  emoji: '🍌', is_active: true },
  { id: 39, name: 'Pappalikkai',       name_ta: 'பப்பாளிக்காய்',        category: 'vegetable', price_per_kg: 25.00,  emoji: '🌱', is_active: true },
  { id: 40, name: 'Kothavarankkai',    name_ta: 'கொத்தவரங்காய்',      category: 'vegetable', price_per_kg: 50.00,  emoji: '🫘', is_active: true },
  { id: 41, name: 'Avarakkai',         name_ta: 'அவரைக்காய்',          category: 'vegetable', price_per_kg: 45.00,  emoji: '🫘', is_active: true },
  { id: 42, name: 'Vendhaya Keerai',   name_ta: 'வெந்தயக் கீரை',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🌿', is_active: true },
  { id: 162, name: 'Chinna Vengayam',  name_ta: 'சின்ன வெங்காயம்',     category: 'vegetable', price_per_kg: 60.00,  emoji: '🧅', is_active: true },
  { id: 163, name: 'Chow Chow',        name_ta: 'சௌ சௌ',              category: 'vegetable', price_per_kg: 35.00,  emoji: '🍐', is_active: true },
  { id: 164, name: 'French Beans',     name_ta: 'பிரெஞ்ச் பீன்ஸ்',     category: 'vegetable', price_per_kg: 60.00,  emoji: '🫘', is_active: true },
  { id: 165, name: 'Palak Keerai',     name_ta: 'பாலக்கீரை',           category: 'vegetable', price_per_kg: 30.00,  emoji: '🥬', is_active: true },
  { id: 166, name: 'Pudina',           name_ta: 'புதினா',              category: 'vegetable', price_per_kg: 40.00,  emoji: '🌿', is_active: true },
  { id: 167, name: 'Kothamalli',       name_ta: 'கொத்தமல்லி',          category: 'vegetable', price_per_kg: 40.00,  emoji: '🌿', is_active: true },

  // Fruits (32)
  { id: 43, name: 'Maambazham',        name_ta: 'மாம்பழம்',            category: 'fruit', price_per_kg: 80.00,  emoji: '🥭', is_active: true },
  { id: 44, name: 'Apple',             name_ta: 'ஆப்பிள்',             category: 'fruit', price_per_kg: 150.00, emoji: '🍎', is_active: true },
  { id: 45, name: 'Vazhapazham',       name_ta: 'வாழைப்பழம்',          category: 'fruit', price_per_kg: 40.00,  emoji: '🍌', is_active: true },
  { id: 46, name: 'Thiratchai',        name_ta: 'திராட்சை',             category: 'fruit', price_per_kg: 80.00,  emoji: '🍇', is_active: true },
  { id: 47, name: 'Aaranju',           name_ta: 'ஆரஞ்சு',              category: 'fruit', price_per_kg: 60.00,  emoji: '🍊', is_active: true },
  { id: 48, name: 'Pappali',           name_ta: 'பப்பாளி',             category: 'fruit', price_per_kg: 35.00,  emoji: '🫐', is_active: true },
  { id: 49, name: 'Tharboosani',       name_ta: 'தர்பூசணி',             category: 'fruit', price_per_kg: 20.00,  emoji: '🍉', is_active: true },
  { id: 50, name: 'Mulampazham',       name_ta: 'முலாம்பழம்',           category: 'fruit', price_per_kg: 30.00,  emoji: '🍈', is_active: true },
  { id: 51, name: 'Annasi',            name_ta: 'அன்னாசி',             category: 'fruit', price_per_kg: 50.00,  emoji: '🍍', is_active: true },
  { id: 52, name: 'Mathulai',          name_ta: 'மாதுளை',              category: 'fruit', price_per_kg: 120.00, emoji: '🍎', is_active: true },
  { id: 53, name: 'Koyyapazham',       name_ta: 'கொய்யா',              category: 'fruit', price_per_kg: 50.00,  emoji: '🍐', is_active: true },
  { id: 54, name: 'Sapota',            name_ta: 'சப்போட்டா',           category: 'fruit', price_per_kg: 60.00,  emoji: '🟤', is_active: true },
  { id: 55, name: 'Thengai',           name_ta: 'தேங்காய்',             category: 'fruit', price_per_kg: 30.00,  emoji: '🥥', is_active: true },
  { id: 56, name: 'Elumichai',         name_ta: 'எலுமிச்சை',           category: 'fruit', price_per_kg: 80.00,  emoji: '🍋', is_active: true },
  { id: 57, name: 'Pachai Elumichai',  name_ta: 'பச்சை எலுமிச்சை',     category: 'fruit', price_per_kg: 60.00,  emoji: '🟢', is_active: true },
  { id: 58, name: 'Strawberry',        name_ta: 'ஸ்ட்ராபெர்ரி',        category: 'fruit', price_per_kg: 200.00, emoji: '🍓', is_active: true },
  { id: 59, name: 'Kiwi',              name_ta: 'கிவி',                category: 'fruit', price_per_kg: 250.00, emoji: '🥝', is_active: true },
  { id: 60, name: 'Pearikkai',         name_ta: 'பேரிக்காய்',           category: 'fruit', price_per_kg: 100.00, emoji: '🍐', is_active: true },
  { id: 61, name: 'Peach',             name_ta: 'பீச்',                category: 'fruit', price_per_kg: 150.00, emoji: '🍑', is_active: true },
  { id: 62, name: 'Plum',              name_ta: 'பிளம்ஸ்',              category: 'fruit', price_per_kg: 120.00, emoji: '🟣', is_active: true },
  { id: 63, name: 'Cherry',            name_ta: 'செர்ரி',               category: 'fruit', price_per_kg: 300.00, emoji: '🍒', is_active: true },
  { id: 64, name: 'Athipazham',        name_ta: 'அத்திப்பழம்',          category: 'fruit', price_per_kg: 200.00, emoji: '🟤', is_active: true },
  { id: 65, name: 'Dragon Pazham',     name_ta: 'டிராகன் பழம்',         category: 'fruit', price_per_kg: 200.00, emoji: '🐉', is_active: true },
  { id: 66, name: 'Vennai Pazham',     name_ta: 'வெண்ணெய் பழம்',        category: 'fruit', price_per_kg: 250.00, emoji: '🥑', is_active: true },
  { id: 67, name: 'Palabazham',        name_ta: 'பலாப்பழம்',           category: 'fruit', price_per_kg: 40.00,  emoji: '🍈', is_active: true },
  { id: 68, name: 'Seethapazham',      name_ta: 'சீதாப்பழம்',          category: 'fruit', price_per_kg: 80.00,  emoji: '🍏', is_active: true },
  { id: 69, name: 'Vilambi Pazham',    name_ta: 'விளிம்பிப் பழம்',      category: 'fruit', price_per_kg: 60.00,  emoji: '⭐', is_active: true },
  { id: 70, name: 'Passion Fruit',     name_ta: 'பாஷன் ஃப்ரூட்',        category: 'fruit', price_per_kg: 150.00, emoji: '🟡', is_active: true },
  { id: 71, name: 'Puli',              name_ta: 'புளி',                category: 'fruit', price_per_kg: 100.00, emoji: '🟤', is_active: true },
  { id: 72, name: 'Nellikkai',         name_ta: 'நெல்லிக்காய்',         category: 'fruit', price_per_kg: 60.00,  emoji: '🟢', is_active: true },
  { id: 73, name: 'Pericham Pazham',   name_ta: 'பேரீச்சம்பழம்',        category: 'fruit', price_per_kg: 200.00, emoji: '🟤', is_active: true },
  { id: 74, name: 'Litchi',            name_ta: 'லிச்சி',               category: 'fruit', price_per_kg: 120.00, emoji: '🔴', is_active: true },

  // Groceries (87)
  { id: 75,  name: 'Arisi',                   name_ta: 'அரிசி',                 category: 'grocery', price_per_kg: 60.00,  emoji: '🌾', is_active: true },
  { id: 76,  name: 'Puzhungal Arisi',         name_ta: 'புழுங்கல் அரிசி',        category: 'grocery', price_per_kg: 55.00,  emoji: '🍚', is_active: true },
  { id: 77,  name: 'Pacharisi',               name_ta: 'பச்சரிசி',              category: 'grocery', price_per_kg: 60.00,  emoji: '🍚', is_active: true },
  { id: 78,  name: 'Idli Arisi',              name_ta: 'இட்லி அரிசி',           category: 'grocery', price_per_kg: 50.00,  emoji: '🍚', is_active: true },
  { id: 79,  name: 'Basmati Arisi',           name_ta: 'பாசுமதி அரிசி',         category: 'grocery', price_per_kg: 120.00, emoji: '🍚', is_active: true },
  { id: 80,  name: 'Godhumai',                name_ta: 'கோதுமை',               category: 'grocery', price_per_kg: 40.00,  emoji: '🌾', is_active: true },
  { id: 81,  name: 'Godhumai Maavu',          name_ta: 'கோதுமை மாவு',           category: 'grocery', price_per_kg: 50.00,  emoji: '🌾', is_active: true },
  { id: 82,  name: 'Maida',                   name_ta: 'மைதா',                  category: 'grocery', price_per_kg: 45.00,  emoji: '🥣', is_active: true },
  { id: 83,  name: 'Ravai',                   name_ta: 'ரவை',                  category: 'grocery', price_per_kg: 55.00,  emoji: '🥣', is_active: true },
  { id: 84,  name: 'Kambu',                   name_ta: 'கம்பு',                 category: 'grocery', price_per_kg: 40.00,  emoji: '🌾', is_active: true },
  { id: 85,  name: 'Kelvaragu / Ragi',        name_ta: 'கேழ்வரகு',             category: 'grocery', price_per_kg: 50.00,  emoji: '🌾', is_active: true },
  { id: 86,  name: 'Cholam',                  name_ta: 'சோளம்',                category: 'grocery', price_per_kg: 45.00,  emoji: '🌽', is_active: true },
  { id: 87,  name: 'Thinai',                  name_ta: 'தினை',                 category: 'grocery', price_per_kg: 80.00,  emoji: '🌾', is_active: true },
  { id: 88,  name: 'Samai',                   name_ta: 'சாமை',                 category: 'grocery', price_per_kg: 90.00,  emoji: '🌾', is_active: true },
  { id: 89,  name: 'Varagu',                  name_ta: 'வரகு',                 category: 'grocery', price_per_kg: 85.00,  emoji: '🌾', is_active: true },
  { id: 90,  name: 'Kuthiraivali',            name_ta: 'குதிரைவாலி',           category: 'grocery', price_per_kg: 95.00,  emoji: '🌾', is_active: true },
  { id: 91,  name: 'Oats',                   name_ta: 'ஓட்ஸ்',                 category: 'grocery', price_per_kg: 120.00, emoji: '🥣', is_active: true },
  { id: 92,  name: 'Aval',                   name_ta: 'அவல்',                 category: 'grocery', price_per_kg: 50.00,  emoji: '🥣', is_active: true },
  { id: 93,  name: 'Cholam Maavu',           name_ta: 'சோள மாவு',             category: 'grocery', price_per_kg: 60.00,  emoji: '🌽', is_active: true },
  { id: 94,  name: 'Kadalai Maavu',          name_ta: 'கடலை மாவு',            category: 'grocery', price_per_kg: 90.00,  emoji: '🟡', is_active: true },
  { id: 95,  name: 'Arisi Maavu',            name_ta: 'அரிசி மாவு',            category: 'grocery', price_per_kg: 55.00,  emoji: '🍚', is_active: true },
  { id: 96,  name: 'Ulundhu Maavu',          name_ta: 'உளுந்து மாவு',          category: 'grocery', price_per_kg: 140.00, emoji: '⚪', is_active: true },
  { id: 97,  name: 'Thuvaram Paruppu',       name_ta: 'துவரம் பருப்பு',         category: 'grocery', price_per_kg: 150.00, emoji: '🟡', is_active: true },
  { id: 98,  name: 'Paasi Paruppu',          name_ta: 'பாசிப்பருப்பு',         category: 'grocery', price_per_kg: 120.00, emoji: '🟡', is_active: true },
  { id: 99,  name: 'Paasi Payaru',           name_ta: 'பாசிப்பயறு',            category: 'grocery', price_per_kg: 110.00, emoji: '🟢', is_active: true },
  { id: 100, name: 'Ulutham Paruppu',        name_ta: 'உளுத்தம் பருப்பு',       category: 'grocery', price_per_kg: 140.00, emoji: '⚪', is_active: true },
  { id: 101, name: 'Kadalai Paruppu',        name_ta: 'கடலைப் பருப்பு',        category: 'grocery', price_per_kg: 95.00,  emoji: '🟡', is_active: true },
  { id: 102, name: 'Kollu',                  name_ta: 'கொள்ளு',                category: 'grocery', price_per_kg: 80.00,  emoji: '🟤', is_active: true },
  { id: 103, name: 'Masoor Paruppu',         name_ta: 'மசூர் பருப்பு',          category: 'grocery', price_per_kg: 100.00, emoji: '🟠', is_active: true },
  { id: 104, name: 'Pattani',               name_ta: 'பட்டாணி',               category: 'grocery', price_per_kg: 70.00,  emoji: '🫛', is_active: true },
  { id: 105, name: 'Vellai Kondaikadalai',  name_ta: 'வெள்ளை கொண்டைக்கடலை',   category: 'grocery', price_per_kg: 130.00, emoji: '⚪', is_active: true },
  { id: 106, name: 'Karuppu Kondaikadalai',name_ta: 'கருப்பு கொண்டைக்கடலை',   category: 'grocery', price_per_kg: 90.00,  emoji: '🟤', is_active: true },
  { id: 107, name: 'Rajma',                 name_ta: 'ராஜ்மா',               category: 'grocery', price_per_kg: 140.00, emoji: '🫘', is_active: true },
  { id: 108, name: 'Karamani',              name_ta: 'காராமணி',              category: 'grocery', price_per_kg: 110.00, emoji: '🫘', is_active: true },
  { id: 109, name: 'Mochai',                name_ta: 'மொச்சை',               category: 'grocery', price_per_kg: 100.00, emoji: '🫘', is_active: true },
  { id: 110, name: 'Soya Beans',            name_ta: 'சோயா பீன்ஸ்',          category: 'grocery', price_per_kg: 90.00,  emoji: '🫘', is_active: true },
  { id: 111, name: 'Uppu',                  name_ta: 'உப்பு',                 category: 'grocery', price_per_kg: 20.00,  emoji: '🧂', is_active: true },
  { id: 112, name: 'Sarkarai',              name_ta: 'சர்க்கரை',             category: 'grocery', price_per_kg: 45.00,  emoji: '🍬', is_active: true },
  { id: 113, name: 'Vellam',                name_ta: 'வெல்லம்',               category: 'grocery', price_per_kg: 70.00,  emoji: '🟤', is_active: true },
  { id: 114, name: 'Milagaai',              name_ta: 'மிளகாய்',               category: 'grocery', price_per_kg: 220.00, emoji: '🌶️', is_active: true },
  { id: 115, name: 'Milagaai Thool',        name_ta: 'மிளகாய்த்தூள்',         category: 'grocery', price_per_kg: 260.00, emoji: '🌶️', is_active: true },
  { id: 116, name: 'Milagu',                name_ta: 'மிளகு',                 category: 'grocery', price_per_kg: 650.00, emoji: '⚫', is_active: true },
  { id: 117, name: 'Milagu Thool',          name_ta: 'மிளகுத்தூள்',           category: 'grocery', price_per_kg: 700.00, emoji: '⚫', is_active: true },
  { id: 118, name: 'Manjal',                name_ta: 'மஞ்சள்',                category: 'grocery', price_per_kg: 160.00, emoji: '🟡', is_active: true },
  { id: 119, name: 'Manjal Thool',          name_ta: 'மஞ்சள் தூள்',           category: 'grocery', price_per_kg: 190.00, emoji: '🟡', is_active: true },
  { id: 120, name: 'Seeragam',              name_ta: 'சீரகம்',                category: 'grocery', price_per_kg: 320.00, emoji: '🌾', is_active: true },
  { id: 121, name: 'Dhaniya',               name_ta: 'தனியா',                 category: 'grocery', price_per_kg: 140.00, emoji: '🌿', is_active: true },
  { id: 122, name: 'Dhaniya Thool',         name_ta: 'தனியாத்தூள்',           category: 'grocery', price_per_kg: 160.00, emoji: '🌿', is_active: true },
  { id: 123, name: 'Sombu',                 name_ta: 'சோம்பு',                category: 'grocery', price_per_kg: 220.00, emoji: '🌿', is_active: true },
  { id: 124, name: 'Vendhayam',             name_ta: 'வெந்தயம்',              category: 'grocery', price_per_kg: 100.00, emoji: '🌾', is_active: true },
  { id: 125, name: 'Kadugu',                name_ta: 'கடுகு',                 category: 'grocery', price_per_kg: 110.00, emoji: '⚫', is_active: true },
  { id: 126, name: 'Perunjeeragam',         name_ta: 'பெருஞ்சீரகம்',          category: 'grocery', price_per_kg: 240.00, emoji: '🌿', is_active: true },
  { id: 127, name: 'Omam',                  name_ta: 'ஓமம்',                 category: 'grocery', price_per_kg: 250.00, emoji: '🌾', is_active: true },
  { id: 128, name: 'Elakkai',               name_ta: 'ஏலக்காய்',              category: 'grocery', price_per_kg: 1600.00,emoji: '🟢', is_active: true },
  { id: 129, name: 'Kirambu',               name_ta: 'கிராம்பு',              category: 'grocery', price_per_kg: 900.00, emoji: '🟤', is_active: true },
  { id: 130, name: 'Pattai',                name_ta: 'பட்டை',                 category: 'grocery', price_per_kg: 550.00, emoji: '🪵', is_active: true },
  { id: 131, name: 'Biryani Ilai',          name_ta: 'பிரியாணி இலை',          category: 'grocery', price_per_kg: 200.00, emoji: '🍃', is_active: true },
  { id: 132, name: 'Annasipoo',             name_ta: 'அன்னாசிப்பூ',           category: 'grocery', price_per_kg: 800.00, emoji: '⭐', is_active: true },
  { id: 133, name: 'Jathikkai',             name_ta: 'ஜாதிக்காய்',            category: 'grocery', price_per_kg: 1100.00,emoji: '🟤', is_active: true },
  { id: 134, name: 'Jathipathiri',          name_ta: 'ஜாதிபத்திரி',           category: 'grocery', price_per_kg: 1800.00,emoji: '🍁', is_active: true },
  { id: 135, name: 'Kasakasa',              name_ta: 'கசகசா',                 category: 'grocery', price_per_kg: 1400.00,emoji: '⚪', is_active: true },
  { id: 136, name: 'Ellu',                  name_ta: 'எள்',                   category: 'grocery', price_per_kg: 180.00, emoji: '⚫', is_active: true },
  { id: 137, name: 'Perungayam',            name_ta: 'பெருங்காயம்',           category: 'grocery', price_per_kg: 650.00, emoji: '🟤', is_active: true },
  { id: 138, name: 'Karuveppilai',          name_ta: 'கறிவேப்பிலை',           category: 'grocery', price_per_kg: 40.00,  emoji: '🍃', is_active: true },
  { id: 139, name: 'Kasuri Methi',          name_ta: 'கசூரி மேத்தி',          category: 'grocery', price_per_kg: 300.00, emoji: '🍃', is_active: true },
  { id: 140, name: 'Samayal Ennai',         name_ta: 'சமையல் எண்ணெய்',        category: 'grocery', price_per_kg: 150.00, emoji: '🫙', is_active: true },
  { id: 141, name: 'Nallennai',             name_ta: 'நல்லெண்ணெய்',          category: 'grocery', price_per_kg: 280.00, emoji: '🫙', is_active: true },
  { id: 142, name: 'Thengai Ennai',         name_ta: 'தேங்காய் எண்ணெய்',      category: 'grocery', price_per_kg: 220.00, emoji: '🥥', is_active: true },
  { id: 143, name: 'Kadalai Ennai',         name_ta: 'கடலை எண்ணெய்',          category: 'grocery', price_per_kg: 190.00, emoji: '🫙', is_active: true },
  { id: 144, name: 'Suryakanthi Ennai',     name_ta: 'சூரியகாந்தி எண்ணெய்',   category: 'grocery', price_per_kg: 140.00, emoji: '🌻', is_active: true },
  { id: 145, name: 'Olive Ennai',           name_ta: 'ஆலிவ் எண்ணெய்',         category: 'grocery', price_per_kg: 600.00, emoji: '🫒', is_active: true },
  { id: 148, name: 'Thengai',               name_ta: 'தேங்காய்',              category: 'grocery', price_per_kg: 30.00,  emoji: '🥥', is_active: true },
  { id: 149, name: 'Thengai Paal',          name_ta: 'தேங்காய்ப்பால்',         category: 'grocery', price_per_kg: 120.00, emoji: '🥥', is_active: true },
  { id: 150, name: 'Puli',                  name_ta: 'புளி',                  category: 'grocery', price_per_kg: 110.00, emoji: '🟤', is_active: true },
  { id: 151, name: 'Thakkali Sauce',        name_ta: 'தக்காளி சாஸ்',          category: 'grocery', price_per_kg: 130.00, emoji: '🥫', is_active: true },
  { id: 152, name: 'Soya Sauce',            name_ta: 'சோயா சாஸ்',            category: 'grocery', price_per_kg: 120.00, emoji: '🍾', is_active: true },
  { id: 153, name: 'Vinegar',               name_ta: 'வினிகர்',               category: 'grocery', price_per_kg: 60.00,  emoji: '🍶', is_active: true },
  { id: 154, name: 'Oorugai',               name_ta: 'ஊறுகாய்',              category: 'grocery', price_per_kg: 150.00, emoji: '🫙', is_active: true },
  { id: 155, name: 'Appalam',               name_ta: 'அப்பளம்',               category: 'grocery', price_per_kg: 120.00, emoji: '🫓', is_active: true },
  { id: 156, name: 'Vadagam',               name_ta: 'வடகம்',                 category: 'grocery', price_per_kg: 140.00, emoji: '🫓', is_active: true },
  { id: 157, name: 'Idli Podi',             name_ta: 'இட்லி பொடி',            category: 'grocery', price_per_kg: 180.00, emoji: '🥣', is_active: true },
  { id: 158, name: 'Sambar Podi',           name_ta: 'சாம்பார் பொடி',         category: 'grocery', price_per_kg: 220.00, emoji: '🥣', is_active: true },
  { id: 159, name: 'Rasam Podi',            name_ta: 'ரசப்பொடி',              category: 'grocery', price_per_kg: 220.00, emoji: '🥣', is_active: true },
  { id: 160, name: 'Garam Masala',          name_ta: 'கரம் மசாலா',            category: 'grocery', price_per_kg: 350.00, emoji: '🌶️', is_active: true },
  { id: 161, name: 'Biryani Masala',        name_ta: 'பிரியாணி மசாலா',        category: 'grocery', price_per_kg: 350.00, emoji: '🍛', is_active: true },

  // Dairy (10)
  { id: 174, name: 'Cheese',                 name_ta: 'சீஸ்',                  category: 'dairy', price_per_kg: 450.00, emoji: '🧀', is_active: true },
  { id: 175, name: 'Cream',                  name_ta: 'கிரீம்',                category: 'dairy', price_per_kg: 200.00, emoji: '🥛', is_active: true },
  { id: 176, name: 'Condensed Milk',         name_ta: 'கண்டென்ஸ்டு மில்க்',     category: 'dairy', price_per_kg: 160.00, emoji: '🥫', is_active: true },
  { id: 177, name: 'Milk Powder',            name_ta: 'பால் பவுடர்',            category: 'dairy', price_per_kg: 300.00, emoji: '🥛', is_active: true },

  // Nuts & Dry Fruits (13)
  { id: 178, name: 'Cashew',                 name_ta: 'முந்திரி',              category: 'nuts', price_per_kg: 800.00,  emoji: '🥜', is_active: true },
  { id: 179, name: 'Almond',                 name_ta: 'பாதாம்',                category: 'nuts', price_per_kg: 750.00,  emoji: '🥜', is_active: true },
  { id: 180, name: 'Pistachio',              name_ta: 'பிஸ்தா',                category: 'nuts', price_per_kg: 950.00,  emoji: '🥜', is_active: true },
  { id: 181, name: 'Walnut',                 name_ta: 'வால்நட்',                category: 'nuts', price_per_kg: 900.00,  emoji: '🧠', is_active: true },
  { id: 182, name: 'Peanuts',                name_ta: 'நிலக்கடலை',              category: 'nuts', price_per_kg: 140.00,  emoji: '🥜', is_active: true },
  { id: 183, name: 'Raisins',                name_ta: 'உலர் திராட்சை',          category: 'nuts', price_per_kg: 320.00,  emoji: '🍇', is_active: true },
  { id: 184, name: 'Dates',                  name_ta: 'பேரீச்சம்பழம்',          category: 'nuts', price_per_kg: 280.00,  emoji: '🌴', is_active: true },
  { id: 185, name: 'Figs',                   name_ta: 'அத்திப்பழம்',            category: 'nuts', price_per_kg: 600.00,  emoji: '🟤', is_active: true },
  { id: 186, name: 'Almonds (Badam Paruppu)',name_ta: 'பாதாம் பருப்பு',         category: 'nuts', price_per_kg: 750.00,  emoji: '🥜', is_active: true },
  { id: 187, name: 'Pumpkin Seeds',          name_ta: 'பூசணி விதை',             category: 'nuts', price_per_kg: 450.00,  emoji: '🎃', is_active: true },
  { id: 188, name: 'Sunflower Seeds',        name_ta: 'சூரியகாந்தி விதை',       category: 'nuts', price_per_kg: 350.00,  emoji: '🌻', is_active: true },
  { id: 189, name: 'Chia Seeds',             name_ta: 'சியா விதை',              category: 'nuts', price_per_kg: 400.00,  emoji: '⚫', is_active: true },
  { id: 190, name: 'Flax Seeds',             name_ta: 'ஆளி விதை',               category: 'nuts', price_per_kg: 250.00,  emoji: '🟤', is_active: true },
];

let memoryItems = [...DEFAULT_ITEMS];
let memoryNextId = 191;

let memoryUsers = [];
let memoryNextUserId = 1;

let memoryHistory = [];
let memoryNextHistoryId = 1;

// Smart wrapper query function
const query = async (text, params = []) => {
  if (isDbConnected) {
    try {
      return await rawPool.query(text, params);
    } catch (err) {
      console.warn('⚠️ DB query error, switching to fallback mode:', err.message);
      isDbConnected = false;
    }
  }

  // Fallback SQL engine in memory
  const sql = text.trim();

  // 1. SELECT COUNT(*) FROM items / admin_users / users
  if (sql.toUpperCase().includes('SELECT COUNT(*) FROM ITEMS')) {
    if (sql.includes("category = 'grocery'")) {
      const cnt = memoryItems.filter(i => i.category === 'grocery').length;
      return { rows: [{ count: cnt.toString() }] };
    }
    if (sql.includes("category = 'vegetable'")) {
      const cnt = memoryItems.filter(i => i.category === 'vegetable').length;
      return { rows: [{ count: cnt.toString() }] };
    }
    if (sql.includes("category = 'fruit'")) {
      const cnt = memoryItems.filter(i => i.category === 'fruit').length;
      return { rows: [{ count: cnt.toString() }] };
    }
    if (sql.includes("category = 'dairy'")) {
      const cnt = memoryItems.filter(i => i.category === 'dairy').length;
      return { rows: [{ count: cnt.toString() }] };
    }
    if (sql.includes("category = 'nuts'")) {
      const cnt = memoryItems.filter(i => i.category === 'nuts').length;
      return { rows: [{ count: cnt.toString() }] };
    }
    return { rows: [{ count: memoryItems.length.toString() }] };
  }
  if (sql.toUpperCase().includes('SELECT COUNT(*) FROM ADMIN_USERS')) {
    return { rows: [{ count: '1' }] };
  }
  if (sql.toUpperCase().includes('SELECT COUNT(*) FROM USERS')) {
    return { rows: [{ count: memoryUsers.length.toString() }] };
  }

  // 2. GET public items: SELECT * FROM items WHERE is_active = TRUE ...
  if (sql.includes('SELECT * FROM items WHERE is_active = TRUE')) {
    let result = memoryItems.filter(i => i.is_active);
    if (params.length > 0 && params[0]) {
      result = result.filter(i => i.category === params[0]);
    }
    result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return { rows: result };
  }

  // 3. GET admin items: SELECT * FROM items WHERE 1=1 ...
  if (sql.includes('SELECT * FROM items WHERE 1=1')) {
    let result = [...memoryItems];
    if (params.length === 1) {
      if (params[0].startsWith('%')) {
        const search = params[0].replace(/%/g, '').toLowerCase();
        result = result.filter(i => i.name.toLowerCase().includes(search) || (i.name_ta && i.name_ta.toLowerCase().includes(search)));
      } else {
        result = result.filter(i => i.category === params[0]);
      }
    } else if (params.length === 2) {
      result = result.filter(i => i.category === params[0]);
      const search = params[1].replace(/%/g, '').toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(search) || (i.name_ta && i.name_ta.toLowerCase().includes(search)));
    }
    result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return { rows: result };
  }

  // 4. SELECT * FROM items WHERE id = $1
  if (sql.includes('SELECT * FROM items WHERE id = $1')) {
    const item = memoryItems.find(i => i.id == params[0]);
    return { rows: item ? [item] : [] };
  }

  // 5. INSERT INTO items ...
  if (sql.startsWith('INSERT INTO items')) {
    const newItem = {
      id: memoryNextId++,
      name: params[0],
      name_ta: params[1] || '',
      category: params[2],
      price_per_kg: params[3] || 0,
      emoji: params[4] || '🛒',
      is_active: true,
    };
    memoryItems.push(newItem);
    return { rows: [newItem] };
  }

  // 6. UPDATE items SET name ...
  if (sql.startsWith('UPDATE items SET name')) {
    const id = params[6] || params[5];
    const index = memoryItems.findIndex(i => i.id == id);
    if (index !== -1) {
      memoryItems[index] = {
        ...memoryItems[index],
        name: params[0],
        name_ta: params[1] || memoryItems[index].name_ta || '',
        category: params[2],
        price_per_kg: params[3],
        emoji: params[4],
        is_active: params[5],
      };
      return { rows: [memoryItems[index]] };
    }
    return { rows: [] };
  }

  // 7. TOGGLE item: UPDATE items SET is_active = $1 WHERE id = $2
  if (sql.includes('UPDATE items SET is_active = $1 WHERE id = $2')) {
    const index = memoryItems.findIndex(i => i.id == params[1]);
    if (index !== -1) {
      memoryItems[index].is_active = params[0];
      return { rows: [memoryItems[index]] };
    }
    return { rows: [] };
  }

  // 8. DELETE FROM items WHERE id = $1
  if (sql.startsWith('DELETE FROM items WHERE id = $1')) {
    memoryItems = memoryItems.filter(i => i.id != params[0]);
    return { rows: [] };
  }

  // 9. Admin Stats query
  if (sql.includes("WHERE category = 'vegetable'")) {
    const total      = memoryItems.length;
    const vegetables = memoryItems.filter(i => i.category === 'vegetable').length;
    const fruits     = memoryItems.filter(i => i.category === 'fruit').length;
    const groceries  = memoryItems.filter(i => i.category === 'grocery').length;
    const dairy      = memoryItems.filter(i => i.category === 'dairy').length;
    const nuts       = memoryItems.filter(i => i.category === 'nuts').length;
    const active     = memoryItems.filter(i => i.is_active).length;
    const hidden     = total - active;
    return { rows: [{ total, vegetables, fruits, groceries, dairy, nuts, active, hidden }] };
  }

  // 10. Admin login query
  if (sql.includes('SELECT * FROM admin_users WHERE username = $1') || sql.toLowerCase().includes('from admin_users where lower(username) = lower($1)')) {
    const username = (params[0] || '').trim();
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    if (username.toLowerCase() === defaultUser.toLowerCase()) {
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      return {
        rows: [{
          id: 1,
          username: defaultUser,
          password_hash: bcrypt.hashSync(password, 10),
        }],
      };
    }
    return { rows: [] };
  }

  // 11. User Auth Queries
  // User Registration check
  if (sql.includes('SELECT * FROM users WHERE username = $1 OR email = $2')) {
    const u = memoryUsers.find(x => x.username.toLowerCase() === params[0].toLowerCase() || x.email.toLowerCase() === (params[1] || '').toLowerCase());
    return { rows: u ? [u] : [] };
  }
  // User Login query
  if (sql.includes('SELECT * FROM users WHERE username = $1 OR email = $1') || sql.includes('SELECT * FROM users WHERE username = $1 OR email = $2')) {
    const term = (params[0] || '').toLowerCase();
    const u = memoryUsers.find(x => x.username.toLowerCase() === term || x.email.toLowerCase() === term);
    return { rows: u ? [u] : [] };
  }
  // Find User by ID
  if (sql.includes('SELECT id, username, email, created_at FROM users WHERE id = $1')) {
    const u = memoryUsers.find(x => x.id == params[0]);
    return { rows: u ? [{ id: u.id, username: u.username, email: u.email, created_at: u.created_at }] : [] };
  }
  // Insert new User
  if (sql.startsWith('INSERT INTO users')) {
    const newUser = {
      id: memoryNextUserId++,
      username: params[0],
      email: params[1],
      password_hash: params[2],
      created_at: new Date().toISOString(),
    };
    memoryUsers.push(newUser);
    return { rows: [{ id: newUser.id, username: newUser.username, email: newUser.email, created_at: newUser.created_at }] };
  }

  // 12. Shopping History Queries
  // Insert History
  if (sql.startsWith('INSERT INTO shopping_history')) {
    let parsedItems = params[4];
    if (typeof parsedItems === 'string') {
      try { parsedItems = JSON.parse(parsedItems); } catch { /* ignore */ }
    }
    const newEntry = {
      id: memoryNextHistoryId++,
      user_id: params[0],
      title: params[1] || 'Shopping List',
      total_items: params[2] || 0,
      total_weight: params[3] || 0,
      items_data: parsedItems,
      created_at: new Date().toISOString(),
    };
    memoryHistory.push(newEntry);
    return { rows: [newEntry] };
  }

  // Fetch History for user
  if (sql.includes('SELECT * FROM shopping_history WHERE user_id = $1')) {
    const userHist = memoryHistory
      .filter(h => h.user_id == params[0])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: userHist };
  }

  // Delete History entry
  if (sql.includes('DELETE FROM shopping_history WHERE id = $1 AND user_id = $2')) {
    memoryHistory = memoryHistory.filter(h => !(h.id == params[0] && h.user_id == params[1]));
    return { rows: [] };
  }

  return { rows: [] };
};

module.exports = {
  query,
  rawPool,
  dbReady: () => dbReadyPromise,
  on: (...args) => rawPool.on(...args),
  get isDbConnected() { return isDbConnected; },
};

