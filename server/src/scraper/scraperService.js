/**
 * Scraper Orchestration Service
 * Handles single-product and batch scraping with exponential backoff,
 * audit logging, state updates, and price/stock alert triggers.
 */

import { solveChallengeAndFetchPrice } from './lightweightSolver.js';
import { runHeadedScraper } from './headedRunner.js';
import { db } from '../config/db.js';

const DEFAULT_STORE_URL = process.env.MOCK_STORE_URL || 'https://demo.inelabteamdev.com';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape a single product with full retry logic and honest logging
 */
export async function scrapeProduct(productId, options = {}) {
  const {
    engine = 'lightweight',
    maxRetries = 3,
    baseBackoffMs = 500,
    storeUrl = DEFAULT_STORE_URL,
    skipDb = false
  } = options;

  const pid = Number(productId);
  const startTime = Date.now();

  let lastError = null;
  let quote = null;
  let attemptsUsed = 0;
  let httpStatus = null;
  let triggeredAlert = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attemptsUsed = attempt;
    try {
      if (engine === 'playwright-headed') {
        const result = await runHeadedScraper(pid, { storeUrl, headless: false });
        quote = result.quote;
      } else {
        const result = await solveChallengeAndFetchPrice(pid, storeUrl);
        quote = result.quote;
      }

      // Validate quote correctness: must have valid price number
      if (!quote || typeof quote.shown !== 'number' || isNaN(quote.shown)) {
        throw new Error('Scraped quote returned invalid price data');
      }

      // If we made it here, this attempt succeeded
      break;
    } catch (err) {
      lastError = err;
      httpStatus = err.status || (err.message && err.message.includes('429') ? 429 : 500);

      if (attempt < maxRetries) {
        // Exponential backoff with jitter and special handling for 429 rate limit
        const jitter = Math.floor(Math.random() * 250);
        const is429 = httpStatus === 429 || (err.message && err.message.includes('429'));
        const backoff = is429 
          ? Math.max(1000 * attempt, baseBackoffMs * Math.pow(2, attempt - 1)) + jitter
          : baseBackoffMs * Math.pow(2, attempt - 1) + jitter;
        console.warn(`[Scraper] Product #${pid} attempt ${attempt} failed (${err.message}). Retrying in ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;

  // Determine scrape status
  let status = 'failed';
  if (quote) {
    status = attemptsUsed === 1 ? 'success' : 'retried';
  }

  // Persist scrape log
  if (!skipDb) {
    try {
      await db.addScrapeLog({
        productId: pid,
        engine,
        status,
        attempts: attemptsUsed,
        responseTimeMs: totalDurationMs,
        httpStatus: quote ? 200 : httpStatus,
        errorMessage: quote ? null : (lastError?.message || 'Scrape failed'),
        rawQuote: quote || null
      });
    } catch (logErr) {
      console.error(`Failed to write scrape log for product #${pid}:`, logErr);
    }
  }

  // If failed, preserve existing price and stock data
  if (!quote) {
    if (!skipDb) {
      await db.updateTrackedProduct(pid, {
        status: 'error',
        last_scraped_at: new Date().toISOString()
      }).catch(() => {});
    }

    return {
      success: false,
      productId: pid,
      error: lastError?.message || 'Unknown scrape error',
      attempts: attemptsUsed,
      durationMs: totalDurationMs
    };
  }

  if (!skipDb) {
    const currentProduct = await db.getTrackedProductById(pid);

    const oldPrice = (currentProduct && currentProduct.current_price !== null && currentProduct.current_price !== undefined)
      ? Number(currentProduct.current_price)
      : null;
    const newPrice = Number(quote.shown);
    const oldStock = (currentProduct && currentProduct.current_stock !== null && currentProduct.current_stock !== undefined)
      ? Number(currentProduct.current_stock)
      : null;
    const newStock = Number(quote.stock || 0);

    // Record price snapshot
    await db.addPriceHistory({
      productId: pid,
      price: newPrice,
      mrp: quote.mrp ? Number(quote.mrp) : null,
      stock: newStock,
      currency: quote.currency || 'INR',
      capturedAt: new Date().toISOString()
    });

    // Update product snapshot
    await db.updateTrackedProduct(pid, {
      current_price: newPrice,
      mrp: quote.mrp ? Number(quote.mrp) : null,
      current_stock: newStock,
      currency: quote.currency || 'INR',
      status: 'active',
      last_scraped_at: new Date().toISOString()
    });

    // Evaluate alert conditions
    if (oldPrice !== null && newPrice < oldPrice) {
      const diff = oldPrice - newPrice;
      const pct = Math.round((diff / oldPrice) * 100);
      try {
        triggeredAlert = await db.addAlert({
          productId: pid,
          type: 'price_drop',
          title: `Price dropped by ${pct}%!`,
          message: `Price fell from ₹${oldPrice.toLocaleString()} to ₹${newPrice.toLocaleString()} (save ₹${diff.toLocaleString()})`,
          oldValue: oldPrice,
          newValue: newPrice
        });
      } catch (alertErr) {
        console.error(`Failed to add price_drop alert for #${pid}:`, alertErr.message);
      }
    }

    if (oldStock !== null && oldStock === 0 && newStock > 0) {
      try {
        triggeredAlert = await db.addAlert({
          productId: pid,
          type: 'back_in_stock',
          title: 'Back in Stock!',
          message: `Item is back in stock with ${newStock} units available.`,
          oldValue: oldStock,
          newValue: newStock
        });
      } catch (alertErr) {
        console.error(`Failed to add back_in_stock alert for #${pid}:`, alertErr.message);
      }
    } else if (oldStock !== null && oldStock > 0 && newStock === 0) {
      try {
        triggeredAlert = await db.addAlert({
          productId: pid,
          type: 'out_of_stock',
          title: 'Item Sold Out',
          message: 'Product is now currently out of stock.',
          oldValue: oldStock,
          newValue: newStock
        });
      } catch (alertErr) {
        console.error(`Failed to add out_of_stock alert for #${pid}:`, alertErr.message);
      }
    }
  }

  return {
    success: true,
    productId: pid,
    status,
    attempts: attemptsUsed,
    quote,
    durationMs: totalDurationMs,
    alert: triggeredAlert
  };
}

/**
 * Scrape all products currently due for a scheduled update
 */
export async function scrapeAllDueProducts(options = {}) {
  const { force = false } = options;
  const products = await db.getTrackedProducts();

  const now = Date.now();
  const dueProducts = products.filter(p => {
    if (force || !p.last_scraped_at) return true;
    const freqMs = (p.frequency_hours || 2) * 60 * 60 * 1000;
    const lastScrapedMs = new Date(p.last_scraped_at).getTime();
    return now - lastScrapedMs >= freqMs;
  });

  console.log(`[Scheduler] ${dueProducts.length} of ${products.length} tracked products are due for scraping.`);

  const results = [];
  for (const product of dueProducts) {
    try {
      const result = await scrapeProduct(product.product_id, { engine: 'lightweight' });
      results.push(result);
    } catch (err) {
      results.push({ success: false, productId: product.product_id, error: err.message });
    }
    // Pause 750ms between products to be polite to store server and prevent 429 rate limits
    await sleep(750);
  }

  const alertsTriggered = results.filter(r => r.alert).map(r => r.alert);

  return {
    totalTracked: products.length,
    scrapedCount: dueProducts.length,
    alertsTriggered,
    results
  };
}
