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

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ───────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ───────────────────────────────────
app.use('/api/items', itemRoutes);
app.use('/api/auth',  authRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Auto-Create Database ─────────────────────
async function ensureDatabaseExists() {
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
    await ensureDatabaseExists();

    // 1. Run schema.sql statement by statement
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema     = fs.readFileSync(schemaPath, 'utf8');
    const schemaStmts = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of schemaStmts) {
      await pool.query(stmt);
    }
    console.log('📋 Schema applied');

    // 2. Seed items if table is empty
    const itemCount = await pool.query('SELECT COUNT(*) FROM items');
    if (parseInt(itemCount.rows[0].count) === 0) {
      const seedPath = path.join(__dirname, 'db', 'seed.sql');
      const seed     = fs.readFileSync(seedPath, 'utf8');
      const seedStmts = seed.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of seedStmts) {
        await pool.query(stmt);
      }
      console.log('🌱 Items seeded (vegetables + fruits)');
    }

    // 3. Seed admin user if table is empty
    const adminCount = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(adminCount.rows[0].count) === 0) {
      const username     = process.env.ADMIN_USERNAME || 'admin';
      const password     = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [username, passwordHash]
      );
      console.log(`🔐 Admin user seeded — username: ${username}`);
    }

    console.log('✅ Database initialization complete');
  } catch (err) {
    console.warn('⚠️ PostgreSQL initialization notice:', err.message);
    console.log('🚀 Server starting in Fail-Safe In-Memory Mode (All 74 items ready!)');
  }
}

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 VF Smart List server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Items:  http://localhost:${PORT}/api/items\n`);
  initDB();
});

