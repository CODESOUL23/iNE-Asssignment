/**
 * Observable Headed Browser Runner (Playwright)
 * 
 * Specifically crafted for the "Observable (Headed) Run" requirement:
 * 1. Launches visible Chromium browser with slow-mo
 * 2. Navigates to the product page on INE Store
 * 3. Simulates realistic human mouse trajectories & dwell timing (>600ms)
 * 4. Clicks the "Reveal price" button
 * 5. Handles synthetic click drops, slow network responses, and client retries
 * 6. Scrapes live rendered price, stock, and status directly from DOM
 */

import { chromium } from 'playwright';

export async function runHeadedScraper(productId, options = {}) {
  const {
    headless = false,
    slowMo = 100,
    storeUrl = 'https://demo.inelabteamdev.com',
    timeout = 30000,
    logger = console.log
  } = options;

  const startTime = Date.now();
  let browser = null;

  try {
    logger(`🚀 Launching Chromium browser (headed: ${!headless})...`);
    browser = await chromium.launch({
      headless,
      slowMo,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,800'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Track network requests to watch challenge & price exchanges
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/challenge')) {
        logger(`📡 Network: /api/challenge -> Status ${response.status()}`);
      } else if (url.includes('/api/session')) {
        logger(`📡 Network: /api/session -> Status ${response.status()}`);
      } else if (url.includes('/price')) {
        logger(`📡 Network: Price endpoint -> Status ${response.status()}`);
      }
    });

    const productUrl = `${storeUrl}/product/${productId}`;
    logger(`🧭 Navigating to product page: ${productUrl}`);
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout });

    // Wait for product details to render
    await page.waitForSelector('.detail-info', { timeout: 10000 });
    const productName = await page.$eval('.tile-name, h1, .detail-info h1', el => el.textContent.trim()).catch(() => `Product #${productId}`);
    logger(`📦 Found Product: "${productName}"`);

    // Locate price block
    const priceBlock = await page.waitForSelector('.price-block', { timeout: 10000 });
    const box = await priceBlock.boundingBox();

    if (!box) {
      throw new Error('Price block bounding box could not be determined');
    }

    logger(`🖱️ Simulating human mouse movements over price area to satisfy dwell requirements...`);
    // Move mouse through 10 intermediate points to satisfy minMoves: 8
    const startX = box.x - 100;
    const startY = box.y - 50;
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    for (let step = 0; step <= 10; step++) {
      const t = step / 10;
      const curX = startX + (targetX - startX) * t + Math.sin(t * Math.PI) * 20;
      const curY = startY + (targetY - startY) * t + Math.cos(t * Math.PI) * 15;
      await page.mouse.move(curX, curY);
      await page.waitForTimeout(60);
    }

    // Dwell inside price block for at least 800ms (threshold is 600ms)
    logger(`⏳ Holding hover on price block for dwell verification (>600ms)...`);
    await page.waitForTimeout(850);

    // Wait for "Reveal price" button to become enabled
    const revealBtn = await page.waitForSelector('.price-block button:not([disabled])', { timeout: 5000 });
    logger(`🎯 "Reveal price" button is enabled. Clicking...`);
    
    // Click with retry for synthetic click-drop (Xn has 35% chance to drop or delay)
    let clicked = false;
    for (let clickAttempt = 1; clickAttempt <= 3; clickAttempt++) {
      await revealBtn.click();
      logger(`👉 Clicked "Reveal price" (attempt ${clickAttempt})`);

      // Check if spinner or loading phase appeared
      try {
        await page.waitForSelector('.spinner, .price-block[aria-busy="true"]', { timeout: 1200 });
        logger(`🔄 Spinner detected! Challenge execution in progress...`);
        clicked = true;
        break;
      } catch {
        logger(`⚠️ Click may have been synthetically dropped by store flakiness logic. Retrying click...`);
        await page.waitForTimeout(500);
      }
    }

    // Wait for final price to be revealed (or retry error message)
    logger(`⏳ Awaiting challenge resolution and DOM update...`);
    
    // The price block will change from loading spinner to the actual price display
    // Wait until .spinner disappears and price is shown
    await page.waitForFunction(() => {
      const block = document.querySelector('.price-block');
      if (!block) return false;
      const hasSpinner = block.querySelector('.spinner');
      const text = block.textContent || '';
      return !hasSpinner && (text.includes('₹') || text.includes('Rs') || text.includes('stock') || text.includes('Couldn'));
    }, { timeout: 20000 });

    const priceBlockText = await page.$eval('.price-block', el => el.textContent.trim());
    logger(`📄 Price block content updated: "${priceBlockText}"`);

    // If an error occurred on the store side, check for retry button
    if (priceBlockText.includes("Couldn't load price") || priceBlockText.includes("failed")) {
      logger(`⚠️ Store returned simulated failure. Clicking in-page retry...`);
      const retryBtn = await page.$('.price-block button');
      if (retryBtn) {
        await retryBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Extract structured price and stock from the page
    const extractedData = await page.evaluate(() => {
      const block = document.querySelector('.price-block');
      if (!block) return null;

      const rawText = block.innerText || '';
      
      // Look for currency patterns
      const priceMatch = rawText.match(/[₹Rs\.]\s*([\d,]+)/i);
      const stockMatch = rawText.match(/(\d+)\s*(?:left|in stock)/i) || rawText.match(/In stock/i);
      const outOfStockMatch = rawText.match(/out of stock/i);

      let priceNum = null;
      if (priceMatch && priceMatch[1]) {
        priceNum = Number(priceMatch[1].replace(/,/g, ''));
      }

      let stockNum = 10; // Default estimate if only "in stock"
      if (stockMatch && stockMatch[1]) {
        stockNum = Number(stockMatch[1]);
      } else if (outOfStockMatch) {
        stockNum = 0;
      }

      return {
        rawText,
        price: priceNum,
        stock: stockNum,
        currency: 'INR'
      };
    });

    logger(`✅ Observable Scrape Success! Extracted: Price = ₹${extractedData?.price}, Stock = ${extractedData?.stock}`);
    
    // Keep browser open momentarily so the viewer/recording sees the final state
    await page.waitForTimeout(1500);

    const responseTimeMs = Date.now() - startTime;
    return {
      success: true,
      productId,
      quote: {
        shown: extractedData?.price,
        stock: extractedData?.stock,
        currency: 'INR',
        at: Date.now()
      },
      responseTimeMs
    };

  } catch (err) {
    logger(`❌ Headed Scraper encountered an error: ${err.message}`);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
      logger(`🔒 Closed Chromium browser.`);
    }
  }
}
