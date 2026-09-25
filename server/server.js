require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const fs       = require('fs');
const path     = require('path');
const { Client } = require('pg');
const pool     = require('./db/pool');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const historyRoutes  = require('./routes/historyRoutes');
const voiceRoutes    = require('./routes/voiceRoutes');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ───────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://vf-smart-list-1.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());

// ── Routes ───────────────────────────────────
app.use('/api/items',     itemRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/user-auth', userAuthRoutes);
app.use('/api/history',   historyRoutes);
app.use('/api/voice',     voiceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Auto-Create Database ─────────────────────
async function ensureDatabaseExists() {
  if (process.env.DATABASE_URL) {
    return; // Cloud databases (Neon PostgreSQL) are pre-provisioned
  }
  const dbName = process.env.DB_NAME || 'vf_smart_list';
  const client = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',
    connectionTimeoutMillis: 2000,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`🔨 Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    }
  } catch (err) {
    console.error('⚠️ Could not check/create database automatically:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

// ── DB Initializer ───────────────────────────
async function initDB() {
  try {
    await pool.dbReady();
    const db = pool.isDbConnected ? pool.rawPool : pool;
    console.log(`🔌 Initializing database (mode: ${pool.isDbConnected ? 'PostgreSQL' : 'Fail-safe Memory'})...`);

    await ensureDatabaseExists();

    // 1. Run schema.sql statement by statement safely
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const schemaStmts = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of schemaStmts) {
        try {
          await db.query(stmt);
        } catch (sErr) {
          // Ignore harmless duplicate table / constraint errors
        }
      }
      console.log('📋 Schema verified');
    }

    // 2. Ensure category check constraint allows all 5 categories
    try {
      await db.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check');
      await db.query("ALTER TABLE items ADD CONSTRAINT items_category_check CHECK (category IN ('vegetable', 'fruit', 'grocery', 'dairy', 'nuts'))");
    } catch (cErr) {
      console.warn('⚠️ Category constraint update notice:', cErr.message);
    }

    // 3. Seed items if table is empty
    try {
      const itemCount = await db.query('SELECT COUNT(*) FROM items');
      if (parseInt(itemCount.rows[0].count) === 0) {
        const seedPath = path.join(__dirname, 'db', 'seed.sql');
        if (fs.existsSync(seedPath)) {
          const seed = fs.readFileSync(seedPath, 'utf8');
          const seedStmts = seed.split(';').map(s => s.trim()).filter(s => s.length > 0);
          for (const stmt of seedStmts) {
            try { await db.query(stmt); } catch (e) {}
          }
          console.log('🌱 Items seeded from seed.sql');
        }
      }
    } catch (seedErr) {
      console.warn('⚠️ Initial seed notice:', seedErr.message);
    }

    // 4. Ensure Groceries are seeded if grocery count is 0
    try {
      const groceryRes = await db.query("SELECT COUNT(*) FROM items WHERE category = 'grocery'");
      if (parseInt(groceryRes.rows[0].count) === 0) {
        console.log('🌱 Seeding missing Grocery catalog items...');
        const { GROCERY_ITEMS } = require('./scripts/seedGroceryCatalog');
        for (const item of GROCERY_ITEMS) {
          // Skip Butter / Ghee / Nei / Vennai to avoid duplicating dairy items
          if (['butter', 'ghee', 'nei', 'vennai'].includes(item.name.toLowerCase())) continue;
          await db.query(
            `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
             VALUES ($1, $2, 'grocery', $3, $4, true)`,
            [item.name, item.name_ta || '', item.price_per_kg || 0, item.emoji || '🛒']
          );
        }
        console.log(`✅ Successfully seeded ${GROCERY_ITEMS.length} grocery items!`);
      }
    } catch (gErr) {
      console.warn('⚠️ Grocery seed notice:', gErr.message);
    }

    // 5. Ensure Dairy items are seeded if dairy count is 0
    try {
      const dairyRes = await db.query("SELECT COUNT(*) FROM items WHERE category = 'dairy'");
      if (parseInt(dairyRes.rows[0].count) === 0) {
        console.log('🥛 Seeding missing Dairy items...');
        const DAIRY_ITEMS = [
          { name: 'Paal',              name_ta: 'பால்',               emoji: '🥛', price_per_kg: 50.00 },
          { name: 'Thayir',            name_ta: 'தயிர்',              emoji: '🥣', price_per_kg: 40.00 },
          { name: 'Mor',               name_ta: 'மோர்',               emoji: '🥛', price_per_kg: 25.00 },
          { name: 'Vennai',            name_ta: 'வெண்ணெய்',           emoji: '🧈', price_per_kg: 480.00 },
          { name: 'Nei',               name_ta: 'நெய்',               emoji: '🧈', price_per_kg: 550.00 },
          { name: 'Paneer',            name_ta: 'பன்னீர்',            emoji: '🧀', price_per_kg: 350.00 },
          { name: 'Cheese',            name_ta: 'சீஸ்',               emoji: '🧀', price_per_kg: 450.00 },
          { name: 'Cream',             name_ta: 'கிரீம்',             emoji: '🥛', price_per_kg: 200.00 },
          { name: 'Condensed Paal',    name_ta: 'கண்டென்ஸ்டு மில்க்',  emoji: '🥫', price_per_kg: 160.00 },
          { name: 'Paal Pavadar',      name_ta: 'பால் பவுடர்',         emoji: '🥛', price_per_kg: 300.00 },
        ];
        for (const d of DAIRY_ITEMS) {
          await db.query(
            `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
             VALUES ($1, $2, 'dairy', $3, $4, true)`,
            [d.name, d.name_ta, d.price_per_kg, d.emoji]
          );
        }
        console.log('✅ Dairy items seeded successfully!');
      }
    } catch (dErr) {
      console.warn('⚠️ Dairy seed notice:', dErr.message);
    }

    // 6. Ensure Nuts items are seeded if nuts count is 0
    try {
      const nutsRes = await db.query("SELECT COUNT(*) FROM items WHERE category = 'nuts'");
      if (parseInt(nutsRes.rows[0].count) === 0) {
        console.log('🥜 Seeding missing Nuts items...');
        const NUTS_ITEMS = [
          { name: 'Mundhiri',          name_ta: 'முந்திரி',          emoji: '🥜', price_per_kg: 800.00 },
          { name: 'Badam',             name_ta: 'பாதாம்',            emoji: '🥜', price_per_kg: 750.00 },
          { name: 'Pista',             name_ta: 'பிஸ்தா',            emoji: '🥜', price_per_kg: 950.00 },
          { name: 'Walnut',            name_ta: 'வால்நட்',            emoji: '🧠', price_per_kg: 900.00 },
          { name: 'Nilakkadalai',      name_ta: 'நிலக்கடலை',          emoji: '🥜', price_per_kg: 140.00 },
          { name: 'Raisins',           name_ta: 'உலர் திராட்சை',      emoji: '🍇', price_per_kg: 320.00 },
          { name: 'Dates',             name_ta: 'பேரீச்சம்பழம்',      emoji: '🌴', price_per_kg: 280.00 },
          { name: 'Figs',              name_ta: 'அத்திப்பழம்',        emoji: '🟤', price_per_kg: 600.00 },
          { name: 'Badam Paruppu',     name_ta: 'பாதாம் பருப்பு',     emoji: '🥜', price_per_kg: 750.00 },
          { name: 'Poosani Vidhai',    name_ta: 'பூசணி விதை',         emoji: '🎃', price_per_kg: 450.00 },
          { name: 'Suryakanthi Vidhai',name_ta: 'சூரியகாந்தி விதை',   emoji: '🌻', price_per_kg: 350.00 },
          { name: 'Chia Vidhai',       name_ta: 'சியா விதை',          emoji: '⚫', price_per_kg: 400.00 },
          { name: 'Aali Vidhai',       name_ta: 'ஆளி விதை',           emoji: '🟤', price_per_kg: 250.00 },
        ];
        for (const n of NUTS_ITEMS) {
          await db.query(
            `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
             VALUES ($1, $2, 'nuts', $3, $4, true)`,
            [n.name, n.name_ta, n.price_per_kg, n.emoji]
          );
        }
        console.log('✅ Nuts items seeded successfully!');
      }
    } catch (nErr) {
      console.warn('⚠️ Nuts seed notice:', nErr.message);
    }

    // 7. Seed admin user if table is empty
    try {
      const adminCount = await db.query('SELECT COUNT(*) FROM admin_users');
      if (parseInt(adminCount.rows[0].count) === 0) {
        const username     = process.env.ADMIN_USERNAME || 'admin';
        const password     = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);
        await db.query(
          'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
          [username, passwordHash]
        );
        console.log(`🔐 Admin user seeded — username: ${username}`);
      }
    } catch (aErr) {
      console.warn('⚠️ Admin user check notice:', aErr.message);
    }

    console.log('✅ Database initialization complete');
  } catch (err) {
    console.warn('⚠️ PostgreSQL initialization notice:', err.message);
    console.log('🚀 Server starting in Fail-Safe In-Memory Mode (All items ready!)');
  }
}

// ── Manual & Automated Grocery Seed Route ────
app.get('/api/seed-groceries', async (req, res) => {
  try {
    await pool.dbReady();
    const db = pool.isDbConnected ? pool.rawPool : pool;
    try {
      await db.query('ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check');
      await db.query("ALTER TABLE items ADD CONSTRAINT items_category_check CHECK (category IN ('vegetable', 'fruit', 'grocery', 'dairy', 'nuts'))");
    } catch (cErr) {}

    const { GROCERY_ITEMS } = require('./scripts/seedGroceryCatalog');
    let inserted = 0;
    for (const item of GROCERY_ITEMS) {
      if (['butter', 'ghee', 'nei', 'vennai'].includes(item.name.toLowerCase())) continue;
      const chk = await db.query(
        "SELECT id FROM items WHERE (LOWER(name) = LOWER($1) OR name_ta = $2) AND category = 'grocery'",
        [item.name, item.name_ta || '']
      );
      if (chk.rows.length === 0) {
        await db.query(
          `INSERT INTO items (name, name_ta, category, price_per_kg, emoji, is_active)
           VALUES ($1, $2, 'grocery', $3, $4, true)`,
          [item.name, item.name_ta || '', item.price_per_kg || 0, item.emoji || '🛒']
        );
        inserted++;
      }
    }
    const total = await db.query('SELECT COUNT(*) FROM items');
    const groceries = await db.query("SELECT COUNT(*) FROM items WHERE category = 'grocery'");
    return res.json({
      success: true,
      inserted,
      totalItems: parseInt(total.rows[0].count),
      groceriesCount: parseInt(groceries.rows[0].count)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 VF Smart List server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Items:  http://localhost:${PORT}/api/items\n`);
  initDB();
});

