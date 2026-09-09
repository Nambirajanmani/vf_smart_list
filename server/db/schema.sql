-- VF Smart List Database Schema
-- Run this file first to create tables

-- Drop existing tables if re-running
DROP TABLE IF EXISTS shopping_history CASCADE;
DROP TABLE IF EXISTS users CASCADE;
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

-- Normal users table (shoppers)
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Shopping selection history table
CREATE TABLE shopping_history (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255)  DEFAULT 'Shopping List',
    total_items  INTEGER       NOT NULL DEFAULT 0,
    total_weight DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    items_data   JSONB         NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_is_active ON items(is_active);
CREATE INDEX idx_shopping_history_user_id ON shopping_history(user_id);

