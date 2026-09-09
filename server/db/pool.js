const { Pool } = require('pg');
const bcrypt   = require('bcrypt');
require('dotenv').config();

const rawPool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'vf_smart_list',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 3000,
});

let isDbConnected = false;

// Test connection on load
rawPool.connect((err, client, release) => {
  if (err) {
    console.warn('⚠️ PostgreSQL connection notice:', err.message);
    console.warn('💡 Running in Fail-Safe In-Memory Mode (All 74 items with Tamil & English work instantly!).');
    isDbConnected = false;
  } else {
    console.log('✅ PostgreSQL connected successfully!');
    isDbConnected = true;
    release();
  }
});

rawPool.on('error', (err) => {
  console.warn('⚠️ PostgreSQL pool notice:', err.message);
  isDbConnected = false;
});

// Initial Seed Data for In-Memory Fallback with English & Tamil names
const DEFAULT_ITEMS = [
  // Vegetables (42)
  { id: 1,  name: 'Tomato',            name_ta: 'தக்காளி',            category: 'vegetable', price_per_kg: 30.00,  emoji: '🍅', is_active: true },
  { id: 2,  name: 'Potato',            name_ta: 'உருளைக்கிழங்கு',      category: 'vegetable', price_per_kg: 25.00,  emoji: '🥔', is_active: true },
  { id: 3,  name: 'Onion',             name_ta: 'வெங்காயம்',          category: 'vegetable', price_per_kg: 35.00,  emoji: '🧅', is_active: true },
  { id: 4,  name: 'Garlic',            name_ta: 'பூண்டு',              category: 'vegetable', price_per_kg: 120.00, emoji: '🧄', is_active: true },
  { id: 5,  name: 'Ginger',            name_ta: 'இஞ்சி',              category: 'vegetable', price_per_kg: 80.00,  emoji: '🫚', is_active: true },
  { id: 6,  name: 'Carrot',            name_ta: 'கேரட்',              category: 'vegetable', price_per_kg: 40.00,  emoji: '🥕', is_active: true },
  { id: 7,  name: 'Cabbage',           name_ta: 'முட்டைக்கோஸ்',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🥬', is_active: true },
  { id: 8,  name: 'Cauliflower',       name_ta: 'காலிஃபிளவர்',       category: 'vegetable', price_per_kg: 30.00,  emoji: '🥦', is_active: true },
  { id: 9,  name: 'Broccoli',          name_ta: 'புரோக்கோலி',         category: 'vegetable', price_per_kg: 60.00,  emoji: '🥦', is_active: true },
  { id: 10, name: 'Spinach',           name_ta: 'கீரை',               category: 'vegetable', price_per_kg: 30.00,  emoji: '🌿', is_active: true },
  { id: 11, name: 'Peas',              name_ta: 'பட்டாணி',            category: 'vegetable', price_per_kg: 60.00,  emoji: '🫛', is_active: true },
  { id: 12, name: 'Beans',             name_ta: 'பீன்ஸ்',              category: 'vegetable', price_per_kg: 50.00,  emoji: '🫘', is_active: true },
  { id: 13, name: 'Lady Finger (Okra)',name_ta: 'வெண்டைக்காய்',        category: 'vegetable', price_per_kg: 40.00,  emoji: '🌾', is_active: true },
  { id: 14, name: 'Brinjal (Eggplant)',name_ta: 'கத்திரிக்காய்',       category: 'vegetable', price_per_kg: 25.00,  emoji: '🍆', is_active: true },
  { id: 15, name: 'Capsicum',          name_ta: 'குடைமிளகாய்',        category: 'vegetable', price_per_kg: 60.00,  emoji: '🫑', is_active: true },
  { id: 16, name: 'Green Chilli',      name_ta: 'பச்சை மிளகாய்',       category: 'vegetable', price_per_kg: 50.00,  emoji: '🌶️', is_active: true },
  { id: 17, name: 'Red Chilli',        name_ta: 'காய்ந்த மிளகாய்',     category: 'vegetable', price_per_kg: 200.00, emoji: '🌶️', is_active: true },
  { id: 18, name: 'Bitter Gourd',      name_ta: 'பாகற்காய்',          category: 'vegetable', price_per_kg: 40.00,  emoji: '🥒', is_active: true },
  { id: 19, name: 'Bottle Gourd',      name_ta: 'சுரைக்காய்',          category: 'vegetable', price_per_kg: 20.00,  emoji: '🥒', is_active: true },
  { id: 20, name: 'Ridge Gourd',       name_ta: 'பீர்க்கங்காய்',        category: 'vegetable', price_per_kg: 30.00,  emoji: '🥒', is_active: true },
  { id: 21, name: 'Snake Gourd',       name_ta: 'புடலங்காய்',          category: 'vegetable', price_per_kg: 25.00,  emoji: '🥒', is_active: true },
  { id: 22, name: 'Ash Gourd',         name_ta: 'பூசணிக்காய்',         category: 'vegetable', price_per_kg: 15.00,  emoji: '🥒', is_active: true },
  { id: 23, name: 'Pumpkin',           name_ta: 'மஞ்சள் பூசணி',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🎃', is_active: true },
  { id: 24, name: 'Sweet Potato',      name_ta: 'சர்க்கரைவள்ளி கிழங்கு',category: 'vegetable', price_per_kg: 35.00,  emoji: '🍠', is_active: true },
  { id: 25, name: 'Yam',               name_ta: 'சேனைக்கிழங்கு',       category: 'vegetable', price_per_kg: 40.00,  emoji: '🌱', is_active: true },
  { id: 26, name: 'Colocasia (Taro)',  name_ta: 'சேப்பங்கிழங்கு',      category: 'vegetable', price_per_kg: 30.00,  emoji: '🌱', is_active: true },
  { id: 27, name: 'Radish',            name_ta: 'முள்ளங்கி',           category: 'vegetable', price_per_kg: 20.00,  emoji: '🌱', is_active: true },
  { id: 28, name: 'Beetroot',          name_ta: 'பீட்ரூட்',            category: 'vegetable', price_per_kg: 30.00,  emoji: '🟣', is_active: true },
  { id: 29, name: 'Turnip',            name_ta: 'டர்னிப்',            category: 'vegetable', price_per_kg: 25.00,  emoji: '🌱', is_active: true },
  { id: 30, name: 'Corn',              name_ta: 'சோளம்',              category: 'vegetable', price_per_kg: 20.00,  emoji: '🌽', is_active: true },
  { id: 31, name: 'Mushroom',          name_ta: 'காளான்',             category: 'vegetable', price_per_kg: 150.00, emoji: '🍄', is_active: true },
  { id: 32, name: 'Spring Onion',      name_ta: 'வெங்காயத்தாள்',      category: 'vegetable', price_per_kg: 30.00,  emoji: '🧅', is_active: true },
  { id: 33, name: 'Leek',              name_ta: 'லீக்ஸ்',              category: 'vegetable', price_per_kg: 40.00,  emoji: '🌿', is_active: true },
  { id: 34, name: 'Celery',            name_ta: 'செலரி',              category: 'vegetable', price_per_kg: 60.00,  emoji: '🌿', is_active: true },
  { id: 35, name: 'Cucumber',          name_ta: 'வெள்ளரிக்காய்',        category: 'vegetable', price_per_kg: 20.00,  emoji: '🥒', is_active: true },
  { id: 36, name: 'Zucchini',          name_ta: 'சுக்கிணி',            category: 'vegetable', price_per_kg: 50.00,  emoji: '🥒', is_active: true },
  { id: 37, name: 'Drumstick',         name_ta: 'முருங்கைக்காய்',        category: 'vegetable', price_per_kg: 60.00,  emoji: '🌿', is_active: true },
  { id: 38, name: 'Raw Banana',        name_ta: 'வாழக்காய்',          category: 'vegetable', price_per_kg: 30.00,  emoji: '🍌', is_active: true },
  { id: 39, name: 'Raw Papaya',        name_ta: 'பப்பாளிக்காய்',        category: 'vegetable', price_per_kg: 25.00,  emoji: '🌱', is_active: true },
  { id: 40, name: 'Cluster Beans',     name_ta: 'கொத்தவரங்காய்',      category: 'vegetable', price_per_kg: 50.00,  emoji: '🫘', is_active: true },
  { id: 41, name: 'Flat Beans',        name_ta: 'அவரைக்காய்',          category: 'vegetable', price_per_kg: 45.00,  emoji: '🫘', is_active: true },
  { id: 42, name: 'Fenugreek Leaves',  name_ta: 'வெந்தயக் கீரை',       category: 'vegetable', price_per_kg: 20.00,  emoji: '🌿', is_active: true },

  // Fruits (32)
  { id: 43, name: 'Mango',          name_ta: 'மாம்பழம்',         category: 'fruit', price_per_kg: 80.00,  emoji: '🥭', is_active: true },
  { id: 44, name: 'Apple',          name_ta: 'ஆப்பிள்',           category: 'fruit', price_per_kg: 150.00, emoji: '🍎', is_active: true },
  { id: 45, name: 'Banana',         name_ta: 'வாழைப்பழம்',       category: 'fruit', price_per_kg: 40.00,  emoji: '🍌', is_active: true },
  { id: 46, name: 'Grapes',         name_ta: 'திராட்சை',          category: 'fruit', price_per_kg: 80.00,  emoji: '🍇', is_active: true },
  { id: 47, name: 'Orange',         name_ta: 'ஆரஞ்சு',           category: 'fruit', price_per_kg: 60.00,  emoji: '🍊', is_active: true },
  { id: 48, name: 'Papaya',         name_ta: 'பப்பாளி',          category: 'fruit', price_per_kg: 35.00,  emoji: '🫐', is_active: true },
  { id: 49, name: 'Watermelon',     name_ta: 'தர்பூசணி',          category: 'fruit', price_per_kg: 20.00,  emoji: '🍉', is_active: true },
  { id: 50, name: 'Muskmelon',      name_ta: 'முலாம்பழம்',        category: 'fruit', price_per_kg: 30.00,  emoji: '🍈', is_active: true },
  { id: 51, name: 'Pineapple',      name_ta: 'அன்னாசி',          category: 'fruit', price_per_kg: 50.00,  emoji: '🍍', is_active: true },
  { id: 52, name: 'Pomegranate',    name_ta: 'மாதுளை',           category: 'fruit', price_per_kg: 120.00, emoji: '🍎', is_active: true },
  { id: 53, name: 'Guava',          name_ta: 'கொய்யா',           category: 'fruit', price_per_kg: 50.00,  emoji: '🍐', is_active: true },
  { id: 54, name: 'Sapota (Chikoo)',name_ta: 'சப்போட்டா',        category: 'fruit', price_per_kg: 60.00,  emoji: '🟤', is_active: true },
  { id: 55, name: 'Coconut',        name_ta: 'தேங்காய்',          category: 'fruit', price_per_kg: 30.00,  emoji: '🥥', is_active: true },
  { id: 56, name: 'Lemon',          name_ta: 'எலுமிச்சை',        category: 'fruit', price_per_kg: 80.00,  emoji: '🍋', is_active: true },
  { id: 57, name: 'Lime',           name_ta: 'பச்சை எலுமிச்சை',   category: 'fruit', price_per_kg: 60.00,  emoji: '🟢', is_active: true },
  { id: 58, name: 'Strawberry',     name_ta: 'ஸ்ட்ராபெர்ரி',     category: 'fruit', price_per_kg: 200.00, emoji: '🍓', is_active: true },
  { id: 59, name: 'Kiwi',           name_ta: 'கிவி',              category: 'fruit', price_per_kg: 250.00, emoji: '🥝', is_active: true },
  { id: 60, name: 'Pear',           name_ta: 'பேரிக்காய்',        category: 'fruit', price_per_kg: 100.00, emoji: '🍐', is_active: true },
  { id: 61, name: 'Peach',          name_ta: 'பீச்',              category: 'fruit', price_per_kg: 150.00, emoji: '🍑', is_active: true },
  { id: 62, name: 'Plum',           name_ta: 'பிளம்ஸ்',           category: 'fruit', price_per_kg: 120.00, emoji: '🟣', is_active: true },
  { id: 63, name: 'Cherry',         name_ta: 'செர்ரி',            category: 'fruit', price_per_kg: 300.00, emoji: '🍒', is_active: true },
  { id: 64, name: 'Fig',            name_ta: 'அத்திப்பழம்',       category: 'fruit', price_per_kg: 200.00, emoji: '🟤', is_active: true },
  { id: 65, name: 'Dragon Fruit',   name_ta: 'டிராகன் பழம்',      category: 'fruit', price_per_kg: 200.00, emoji: '🐉', is_active: true },
  { id: 66, name: 'Avocado',        name_ta: 'வெண்ணெய் பழம்',     category: 'fruit', price_per_kg: 250.00, emoji: '🥑', is_active: true },
  { id: 67, name: 'Jackfruit',      name_ta: 'பலாப்பழம்',        category: 'fruit', price_per_kg: 40.00,  emoji: '🍈', is_active: true },
  { id: 68, name: 'Custard Apple',  name_ta: 'சீதாப்பழம்',       category: 'fruit', price_per_kg: 80.00,  emoji: '🍏', is_active: true },
  { id: 69, name: 'Star Fruit',     name_ta: 'விளிம்பிப் பழம்',    category: 'fruit', price_per_kg: 60.00,  emoji: '⭐', is_active: true },
  { id: 70, name: 'Passion Fruit',  name_ta: 'பாஷன் ஃப்ரூட்',    category: 'fruit', price_per_kg: 150.00, emoji: '🟡', is_active: true },
  { id: 71, name: 'Tamarind',       name_ta: 'புளி',              category: 'fruit', price_per_kg: 100.00, emoji: '🟤', is_active: true },
  { id: 72, name: 'Amla (Gooseberry)', name_ta: 'நெல்லிக்காய்',   category: 'fruit', price_per_kg: 60.00, emoji: '🟢', is_active: true },
  { id: 73, name: 'Dates',          name_ta: 'பேரீச்சம்பழம்',     category: 'fruit', price_per_kg: 200.00, emoji: '🟤', is_active: true },
  { id: 74, name: 'Litchi',         name_ta: 'லிச்சி',            category: 'fruit', price_per_kg: 120.00, emoji: '🔴', is_active: true },
];

let memoryItems = [...DEFAULT_ITEMS];
let memoryNextId = 75;

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
    const total = memoryItems.length;
    const vegetables = memoryItems.filter(i => i.category === 'vegetable').length;
    const fruits = memoryItems.filter(i => i.category === 'fruit').length;
    const active = memoryItems.filter(i => i.is_active).length;
    const hidden = total - active;
    return { rows: [{ total, vegetables, fruits, active, hidden }] };
  }

  // 10. Admin login query
  if (sql.includes('SELECT * FROM admin_users WHERE username = $1')) {
    const username = params[0];
    if (username === (process.env.ADMIN_USERNAME || 'admin')) {
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      return {
        rows: [{
          id: 1,
          username: username,
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
  on: (...args) => rawPool.on(...args),
  get isDbConnected() { return isDbConnected; },
};

