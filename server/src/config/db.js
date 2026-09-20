import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder as well as current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const rawSupabaseUrl = process.env.SUPABASE_URL || '';
const SUPABASE_URL = rawSupabaseUrl.trim().replace(/\/rest\/v1\/?$/, '');
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

let supabase = null;
const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_ANON_KEY.includes('your-supabase-anon-key')
);

if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[DATABASE] Connected to Supabase PostgreSQL at:', SUPABASE_URL);
  } catch (err) {
    console.warn('[DATABASE] Supabase initialization failed, falling back to local storage:', err.message);
  }
} else {
  console.log('[DATABASE] Supabase credentials not provided. Using persistent local fallback storage.');
}

// -----------------------------------------------------------------------------
// Persistent Local Storage Fallback (Ensures 100% functionality out-of-the-box)
// -----------------------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

function initLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      tracked_products: [],
      price_history: [],
      scrape_logs: [],
      alerts: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readLocalDb() {
  initLocalDb();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db:', err);
    return { tracked_products: [], price_history: [], scrape_logs: [], alerts: [] };
  }
}

function writeLocalDb(data) {
  initLocalDb();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// -----------------------------------------------------------------------------
// Database Access Layer (Unified API for both Supabase & Local Fallback)
// -----------------------------------------------------------------------------
export const db = {
  isSupabase: Boolean(supabase),

  // 1. Tracked Products
  async getTrackedProducts() {
    if (supabase) {
      const { data, error } = await supabase
        .from('tracked_products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = readLocalDb();
    return local.tracked_products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getTrackedProductById(productId) {
    const pid = Number(productId);
    if (supabase) {
      const { data, error } = await supabase
        .from('tracked_products')
        .select('*')
        .eq('product_id', pid)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }
    const local = readLocalDb();
    return local.tracked_products.find(p => p.product_id === pid) || null;
  },

  async addTrackedProduct(product) {
    const payload = {
      product_id: Number(product.id || product.product_id),
      slug: product.slug || '',
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      sku: product.sku || '',
      current_price: product.current_price || null,
      mrp: product.mrp || null,
      current_stock: product.current_stock !== undefined ? product.current_stock : null,
      currency: product.currency || 'INR',
      frequency_hours: Number(product.frequency_hours) || 2,
      last_scraped_at: product.last_scraped_at || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('tracked_products')
        .upsert(payload, { onConflict: 'product_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const existingIndex = local.tracked_products.findIndex(p => p.product_id === payload.product_id);
    if (existingIndex >= 0) {
      local.tracked_products[existingIndex] = { ...local.tracked_products[existingIndex], ...payload };
    } else {
      payload.id = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      local.tracked_products.push(payload);
    }
    writeLocalDb(local);
    return payload;
  },

  async removeTrackedProduct(productId) {
    const pid = Number(productId);
    if (supabase) {
      const { error } = await supabase
        .from('tracked_products')
        .delete()
        .eq('product_id', pid);
      if (error) throw error;
      return true;
    }

    const local = readLocalDb();
    local.tracked_products = local.tracked_products.filter(p => p.product_id !== pid);
    local.price_history = local.price_history.filter(p => p.product_id !== pid);
    local.scrape_logs = local.scrape_logs.filter(p => p.product_id !== pid);
    local.alerts = local.alerts.filter(p => p.product_id !== pid);
    writeLocalDb(local);
    return true;
  },

  async updateTrackedProduct(productId, updates) {
    const pid = Number(productId);
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('tracked_products')
        .update(payload)
        .eq('product_id', pid)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    const product = local.tracked_products.find(p => p.product_id === pid);
    if (product) {
      Object.assign(product, payload);
      writeLocalDb(local);
      return product;
    }
    return null;
  },

  // 2. Price History
  async getPriceHistory(productId, limit = 50) {
    const pid = Number(productId);
    if (supabase) {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', pid)
        .order('captured_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    return local.price_history
      .filter(p => p.product_id === pid)
      .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at))
      .slice(-limit);
  },

  async addPriceHistory({ productId, price, mrp, stock, currency = 'INR', capturedAt = new Date().toISOString() }) {
    const payload = {
      product_id: Number(productId),
      price: Number(price),
      mrp: mrp ? Number(mrp) : null,
      stock: Number(stock),
      currency,
      captured_at: capturedAt
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('price_history')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    payload.id = 'hist-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    local.price_history.push(payload);
    writeLocalDb(local);
    return payload;
  },

  // 3. Scrape Logs (Honest tracking of every attempt, retry, and failure)
  async getScrapeLogs(productId, limit = 50) {
    const pid = Number(productId);
    if (supabase) {
      const { data, error } = await supabase
        .from('scrape_logs')
        .select('*')
        .eq('product_id', pid)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    return local.scrape_logs
      .filter(l => l.product_id === pid)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  async addScrapeLog({ productId, engine = 'lightweight', status, attempts = 1, responseTimeMs, httpStatus = null, errorMessage = null, rawQuote = null }) {
    const payload = {
      product_id: Number(productId),
      engine,
      status, // 'success' | 'retried' | 'failed'
      attempts: Number(attempts),
      response_time_ms: Math.round(Number(responseTimeMs)),
      http_status: httpStatus,
      error_message: errorMessage,
      raw_quote: rawQuote,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('scrape_logs')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    payload.id = 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    local.scrape_logs.push(payload);
    // Keep max 1000 logs in local storage to prevent bloating
    if (local.scrape_logs.length > 1000) {
      local.scrape_logs = local.scrape_logs.slice(-1000);
    }
    writeLocalDb(local);
    return payload;
  },

  // 4. Alerts (Price Drop & Back In Stock)
  async getAlerts(limit = 30) {
    if (supabase) {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, tracked_products(name, sku, brand)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    return local.alerts
      .map(a => {
        const prod = local.tracked_products.find(p => p.product_id === a.product_id);
        return { ...a, tracked_products: prod ? { name: prod.name, sku: prod.sku, brand: prod.brand } : null };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  async addAlert({ productId, type, title, message, oldValue = null, newValue = null }) {
    const payload = {
      product_id: Number(productId),
      type, // 'price_drop' | 'back_in_stock' | 'out_of_stock' | 'scrape_error'
      title,
      message,
      old_value: oldValue !== null ? Number(oldValue) : null,
      new_value: newValue !== null ? Number(newValue) : null,
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('alerts')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const local = readLocalDb();
    payload.id = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    local.alerts.push(payload);
    writeLocalDb(local);
    return payload;
  },

  async markAlertsAsRead() {
    if (supabase) {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) throw error;
      return true;
    }

    const local = readLocalDb();
    local.alerts.forEach(a => { a.is_read = true; });
    writeLocalDb(local);
    return true;
  },

  // 5. System Analytics / Overview
  async getSystemStats() {
    const products = await this.getTrackedProducts();
    const inStock = products.filter(p => (p.current_stock ?? 0) > 0).length;
    const outOfStock = products.length - inStock;
    const activeScrapes = products.filter(p => p.status === 'active').length;

    let recentLogs = [];
    if (supabase) {
      const { data } = await supabase
        .from('scrape_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      recentLogs = data || [];
    } else {
      const local = readLocalDb();
      recentLogs = local.scrape_logs.slice(-20).reverse();
    }

    const totalAttempts = recentLogs.length;
    const successCount = recentLogs.filter(l => l.status === 'success').length;
    const reliabilityRate = totalAttempts > 0 ? Math.round((successCount / totalAttempts) * 100) : 100;

    return {
      totalTracked: products.length,
      inStock,
      outOfStock,
      activeScrapes,
      recentReliabilityRate: reliabilityRate,
      isSupabaseActive: Boolean(supabase)
    };
  }
};
