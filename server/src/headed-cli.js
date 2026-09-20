#!/usr/bin/env node

/**
 * Standalone Headed Runner CLI
 * 
 * Usage:
 *   node src/headed-cli.js --id 366
 *   node src/headed-cli.js --id 205 --slowmo 150
 */

import chalk from 'chalk';
import { runHeadedScraper } from './scraper/headedRunner.js';
import { db } from './config/db.js';

const args = process.argv.slice(2);
let productId = 767; // default demo product (Domus Cable Kit X)
let slowMo = 120;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--id' && args[i + 1]) {
    productId = Number(args[i + 1]);
    i++;
  } else if (args[i] === '--slowmo' && args[i + 1]) {
    slowMo = Number(args[i + 1]);
    i++;
  }
}

console.log(chalk.bold.cyan('\nINE Headed Browser Scraper Runner'));
console.log(chalk.gray('----------------------------------------\n'));

console.log(chalk.yellow(`Target Product ID: ${productId}`));
console.log(chalk.yellow(`Slow-Mo Delay:    ${slowMo}ms`));
console.log(chalk.gray(`Starting headed browser session...\n`));

const logger = (msg) => {
  const time = new Date().toLocaleTimeString();
  if (msg.includes('[SUCCESS]') || msg.includes('Success')) console.log(chalk.green(`[${time}] ${msg}`));
  else if (msg.includes('[ERROR]') || msg.includes('Error') || msg.includes('Failed')) console.log(chalk.red(`[${time}] ${msg}`));
  else if (msg.includes('[WARNING]') || msg.includes('warning')) console.log(chalk.yellow(`[${time}] ${msg}`));
  else if (msg.includes('[NETWORK]')) console.log(chalk.magenta(`[${time}] ${msg}`));
  else console.log(chalk.blue(`[${time}] ${msg}`));
};

async function main() {
  try {
    const result = await runHeadedScraper(productId, {
      headless: false,
      slowMo,
      logger
    });

    console.log(chalk.bold.green(`\n[COMPLETE] Price Scraped Successfully:`));
    console.log(chalk.white(`   Price:    ₹${result.quote.shown}`));
    console.log(chalk.white(`   Stock:    ${result.quote.stock} units`));
    console.log(chalk.white(`   Currency: ${result.quote.currency}`));
    console.log(chalk.white(`   Latency:  ${result.responseTimeMs}ms`));

    // Synchronize with database if product is tracked
    const tracked = await db.getTrackedProductById(productId).catch(() => null);
    if (tracked) {
      // Record honest scrape log into database
      await db.addScrapeLog({
        productId,
        engine: 'playwright-headed',
        status: 'success',
        attempts: 1,
        responseTimeMs: result.responseTimeMs,
        httpStatus: 200,
        rawQuote: result.quote
      }).catch(e => console.warn('Could not write scrape log:', e.message));

      await db.updateTrackedProduct(productId, {
        current_price: result.quote.shown,
        current_stock: result.quote.stock,
        last_scraped_at: new Date().toISOString()
      }).catch(() => {});

      await db.addPriceHistory({
        productId,
        price: result.quote.shown,
        stock: result.quote.stock,
        currency: result.quote.currency
      }).catch(() => {});

      console.log(chalk.green(`[DATABASE] Synchronized with Database (Product #${productId} - ${tracked.name}).`));
    } else {
      console.log(chalk.gray(`[INFO] Product #${productId} is not currently tracked in the database. (Add it in the UI to persist history)`));
    }

  } catch (err) {
    console.error(chalk.bold.red(`\n[ERROR] Scraper Run Failed: ${err.message}`));
    const tracked = await db.getTrackedProductById(productId).catch(() => null);
    if (tracked) {
      await db.addScrapeLog({
        productId,
        engine: 'playwright-headed',
        status: 'failed',
        attempts: 1,
        responseTimeMs: 0,
        httpStatus: 500,
        errorMessage: err.message
      }).catch(() => {});
    }
    process.exit(1);
  }
}

main();
