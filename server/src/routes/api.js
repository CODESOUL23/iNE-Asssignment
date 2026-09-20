import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';
import { scrapeProduct, scrapeAllDueProducts } from '../scraper/scraperService.js';
import { detectStoreChanges } from '../scraper/changeDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '../../data/catalog_cache.json');

const router = express.Router();
const STORE_URL = process.env.MOCK_STORE_URL || 'https://demo.inelabteamdev.com';
const CRON_SECRET = process.env.CRON_SECRET || 'super-secret-cron-token-ine-2026';

// In-memory catalog cache for lightning-fast search
let catalogCache = null;
let lastCatalogFetch = 0;

async function getFullCatalog() {
  const now = Date.now();
  if (catalogCache && catalogCache.length > 0 && now - lastCatalogFetch < 1000 * 60 * 60 * 12) {
    return catalogCache;
  }

  // Check file cache first
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        catalogCache = cachedData;
        lastCatalogFetch = now;
        return catalogCache;
      }
    }
  } catch (err) {
    console.warn('[Catalog] Error reading cache file:', err.message);
  }

  try {
    // 1,000 items in 17 pages of 60 items - fetch concurrently in ~500ms
    const pageNumbers = Array.from({ length: 17 }, (_, i) => i + 1);
    const pageResponses = await Promise.all(
      pageNumbers.map(async (page) => {
        try {
          const res = await fetch(`${STORE_URL}/api/catalog?page=${page}&pageSize=60`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.items || [];
        } catch {
          return [];
        }
      })
    );

    const allItems = pageResponses.flat();
    if (allItems.length > 0) {
      catalogCache = allItems;
      lastCatalogFetch = now;

      // Save to disk cache
      try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(allItems), 'utf-8');
      } catch (saveErr) {
        console.warn('[Catalog] Failed to write cache file:', saveErr.message);
      }
      return allItems;
    }

    return catalogCache || [];
  } catch (err) {
    console.warn('Catalog fetch error:', err.message);
    return catalogCache || [];
  }
}

// Warm up the catalog cache immediately on module load
getFullCatalog().catch(err => console.warn('[Catalog Warmup Error]:', err.message));

// -----------------------------------------------------------------------------
// Catalog & Search Routes
// -----------------------------------------------------------------------------

// Search products by full or partial name, brand, SKU, ID, or pasted URL
router.get('/catalog/search', async (req, res) => {
  try {
    let rawQuery = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 12));

    // Support pasted URLs like https://demo.inelabteamdev.com/product/summit-ar-glasses-neo-980
    let urlExtractedId = null;
    let urlExtractedSlug = null;
    const urlMatch = rawQuery.match(/\/product\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      const fullSlug = urlMatch[1];
      const idMatch = fullSlug.match(/-(\d+)$/);
      if (idMatch) {
        urlExtractedId = parseInt(idMatch[1]);
      }
      urlExtractedSlug = fullSlug.toLowerCase();
    }

    const query = rawQuery.toLowerCase();
    const numericQuery = parseInt(rawQuery, 10);
    const isNumberQuery = !isNaN(numericQuery);

    const catalog = await getFullCatalog();
    let filtered = catalog;

    if (rawQuery) {
      filtered = catalog.filter(item => {
        if (!item) return false;

        // If URL matched
        if (urlExtractedId && item.id === urlExtractedId) return true;
        if (urlExtractedSlug && item.slug && item.slug.toLowerCase().includes(urlExtractedSlug)) return true;

        // Numeric match against ID or SKU number
        if (isNumberQuery && item.id === numericQuery) return true;

        // String matches
        const name = (item.name || '').toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        const sku = (item.sku || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const slug = (item.slug || '').toLowerCase();

        return (
          name.includes(query) ||
          brand.includes(query) ||
          sku.includes(query) ||
          category.includes(query) ||
          slug.includes(query)
        );
      });
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

    // Trigger an immediate scrape so price & stock are populated immediately
    try {
      await Promise.race([
        scrapeProduct(product_id, { engine: 'lightweight' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Initial scrape timed out')), 3500))
      ]);
    } catch (scrapeErr) {
      console.warn(`[Auto-Scrape] Initial scrape for #${product_id} continuing in background:`, scrapeErr.message);
    }

    const fresh = await db.getTrackedProductById(product_id);
    res.status(201).json(fresh || tracked);
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

// Trigger a scrape of all tracked products (or all due products)
router.post('/products/scrape-all', async (req, res) => {
  try {
    const force = req.query.force !== 'false';
    console.log(`[Batch Scrape] Starting sync of tracked products (force=${force})...`);
    const results = await scrapeAllDueProducts({ force });
    
    // Fetch latest fresh alerts
    const alerts = await db.getAlerts(15);
    const unreadAlerts = alerts.filter(a => !a.is_read);

    res.json({
      success: true,
      ...results,
      unreadAlertsCount: unreadAlerts.length,
      alerts
    });
  } catch (err) {
    console.error('[Batch Scrape] Failed:', err);
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
