import express from 'express';
import { db } from '../config/db.js';
import { scrapeProduct, scrapeAllDueProducts } from '../scraper/scraperService.js';
import { detectStoreChanges } from '../scraper/changeDetector.js';

const router = express.Router();
const STORE_URL = process.env.MOCK_STORE_URL || 'https://demo.inelabteamdev.com';
const CRON_SECRET = process.env.CRON_SECRET || 'super-secret-cron-token-ine-2026';

// In-memory catalog cache for lightning-fast search
let catalogCache = null;
let lastCatalogFetch = 0;

async function getFullCatalog() {
  const now = Date.now();
  if (catalogCache && now - lastCatalogFetch < 1000 * 60 * 15) {
    return catalogCache;
  }

  try {
    const allItems = [];
    // The store has 1,000 items in chunks of up to 60
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${STORE_URL}/api/catalog?page=${page}&pageSize=50`);
      if (!res.ok) break;
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        allItems.push(...data.items);
      }
      if (data.items.length < 50 || allItems.length >= (data.total || 1000)) break;
    }
    catalogCache = allItems;
    lastCatalogFetch = now;
    return allItems;
  } catch (err) {
    console.warn('Catalog fetch error:', err.message);
    return catalogCache || [];
  }
}

// -----------------------------------------------------------------------------
// Catalog & Search Routes
// -----------------------------------------------------------------------------

// Search products by full or partial name, brand, or SKU
router.get('/catalog/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 12));

    const catalog = await getFullCatalog();
    let filtered = catalog;

    if (query) {
      filtered = catalog.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.sku && item.sku.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    res.json({
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize) || 1,
      items
    });
  } catch (err) {
    res.status(500).json({ error: 'Search catalog failed: ' + err.message });
  }
});

// Get individual product details (specs, reviews, brand, etc.)
router.get('/catalog/product/:id', async (req, res) => {
  try {
    const pid = req.params.id;
    const response = await fetch(`${STORE_URL}/api/product/${pid}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Product #${pid} not found in mock store` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Tracked Products Management
// -----------------------------------------------------------------------------

// List all tracked products
router.get('/products/tracked', async (req, res) => {
  try {
    const products = await db.getTrackedProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product to tracking
router.post('/products/track', async (req, res) => {
  try {
    const { product_id, name, brand, category, sku, slug, frequency_hours } = req.body;

    if (!product_id || !name) {
      return res.status(400).json({ error: 'product_id and name are required' });
    }

    const tracked = await db.addTrackedProduct({
      product_id: Number(product_id),
      name,
      brand: brand || '',
      category: category || '',
      sku: sku || '',
      slug: slug || '',
      frequency_hours: frequency_hours || 2
    });

    // Trigger an immediate background scrape so price & stock are populated immediately
    scrapeProduct(product_id, { engine: 'lightweight' }).catch(err => {
      console.warn(`[Auto-Scrape] Initial scrape for #${product_id} had issue:`, err.message);
    });

    res.status(201).json(tracked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove product from tracking
router.delete('/products/track/:productId', async (req, res) => {
  try {
    const pid = req.params.productId;
    await db.removeTrackedProduct(pid);
    res.json({ success: true, message: `Product #${pid} removed from tracking` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tracking frequency or status
router.patch('/products/track/:productId', async (req, res) => {
  try {
    const pid = req.params.productId;
    const { frequency_hours, status } = req.body;
    const updates = {};
    if (frequency_hours !== undefined) updates.frequency_hours = Number(frequency_hours);
    if (status !== undefined) updates.status = status;

    const updated = await db.updateTrackedProduct(pid, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// History, Logs & Scrape Triggers
// -----------------------------------------------------------------------------

// Price and stock time-series history
router.get('/products/:productId/history', async (req, res) => {
  try {
    const pid = req.params.productId;
    const limit = parseInt(req.query.limit) || 50;
    const history = await db.getPriceHistory(pid, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Honest per-product scrape attempts log
router.get('/products/:productId/logs', async (req, res) => {
  try {
    const pid = req.params.productId;
    const limit = parseInt(req.query.limit) || 50;
    const logs = await db.getScrapeLogs(pid, limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually trigger a scrape right now
router.post('/products/:productId/scrape', async (req, res) => {
  try {
    const pid = req.params.productId;
    const engine = req.query.engine === 'playwright-headed' ? 'playwright-headed' : 'lightweight';

    const result = await scrapeProduct(pid, { engine });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Alerts & Notifications
// -----------------------------------------------------------------------------

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await db.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/mark-read', async (req, res) => {
  try {
    await db.markAlertsAsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// System Analytics & Change Detection
// -----------------------------------------------------------------------------

router.get('/system/stats', async (req, res) => {
  try {
    const stats = await db.getSystemStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/system/change-detection', async (req, res) => {
  try {
    const report = await detectStoreChanges(STORE_URL);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Scheduled Cron Endpoint (for cron-job.org / external cron)
// -----------------------------------------------------------------------------

router.post('/cron/scrape', async (req, res) => {
  // Validate bearer token or secret query parameter
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.secret;

  if (token !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
  }

  try {
    const force = req.query.force === 'true';
    console.log(`[Cron] Received scheduled trigger (force=${force}). Starting scrape batch...`);
    const results = await scrapeAllDueProducts({ force });
    res.json({ success: true, ...results });
  } catch (err) {
    console.error('[Cron] Batch scrape failed:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
