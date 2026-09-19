-- ====================================================================
-- INE Software Engineer Intern Assignment: Product Price Tracker
-- Database Schema for Supabase (PostgreSQL)
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tracked Products Table
CREATE TABLE IF NOT EXISTS tracked_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL UNIQUE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL,
    current_price NUMERIC,
    mrp NUMERIC,
    current_stock INTEGER,
    currency TEXT DEFAULT 'INR',
    frequency_hours INTEGER DEFAULT 2,
    last_scraped_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES tracked_products(product_id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    mrp NUMERIC,
    stock INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_date 
    ON price_history(product_id, captured_at DESC);

-- 3. Scrape Logs Table (Honest failure, retry & timing tracking)
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES tracked_products(product_id) ON DELETE CASCADE,
    engine TEXT NOT NULL CHECK (engine IN ('lightweight', 'playwright-headed')),
    status TEXT NOT NULL CHECK (status IN ('success', 'retried', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1,
    response_time_ms INTEGER NOT NULL,
    http_status INTEGER,
    error_message TEXT,
    raw_quote JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_product_date 
    ON scrape_logs(product_id, created_at DESC);

-- 4. Alerts Table (Bonus Feature: Price-drop & Back-in-stock notifications)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES tracked_products(product_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('price_drop', 'back_in_stock', 'out_of_stock', 'scrape_error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    old_value NUMERIC,
    new_value NUMERIC,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_product_date 
    ON alerts(product_id, created_at DESC);

-- 5. Helper Function for Updating Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_tracked_products_updated_at
    BEFORE UPDATE ON tracked_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
