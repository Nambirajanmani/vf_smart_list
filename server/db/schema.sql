-- VF Smart List Database Schema
-- Run this file first to create tables

-- Drop existing tables if re-running
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Items table (vegetables and fruits)
CREATE TABLE items (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)   NOT NULL,
    name_ta     VARCHAR(100)   DEFAULT '',
    category    VARCHAR(20)    NOT NULL CHECK (category IN ('vegetable', 'fruit')),
    price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    emoji       VARCHAR(10)    NOT NULL DEFAULT '🛒',
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_is_active ON items(is_active);
