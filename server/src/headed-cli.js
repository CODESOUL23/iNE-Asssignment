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
let productId = 366; // default demo product
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

console.log(chalk.bold.cyan(`
╔═════════════════════════════════════════════════════════════════╗
║          INE STORE OBSERVABLE HEADED SCRAPER RUNNER             ║
║  Watching Playwright navigate, dwell, solve & reveal in browser ║
╚═════════════════════════════════════════════════════════════════╝
`));

console.log(chalk.yellow(`🎯 Target Product ID: ${productId}`));
console.log(chalk.yellow(`⏱️  Slow-Mo Delay:    ${slowMo}ms`));
console.log(chalk.gray(`Starting headed browser session...\n`));

const logger = (msg) => {
  const time = new Date().toLocaleTimeString();
  if (msg.includes('✅')) console.log(chalk.green(`[${time}] ${msg}`));
  else if (msg.includes('❌')) console.log(chalk.red(`[${time}] ${msg}`));
  else if (msg.includes('⚠️')) console.log(chalk.yellow(`[${time}] ${msg}`));
  else if (msg.includes('📡')) console.log(chalk.magenta(`[${time}] ${msg}`));
  else console.log(chalk.blue(`[${time}] ${msg}`));
};

async function main() {
  try {
    const result = await runHeadedScraper(productId, {
      headless: false,
      slowMo,
      logger
    });

    console.log(chalk.bold.green(`\n🎉 RUN COMPLETE! Price Scraped Successfully:`));
    console.log(chalk.white(`   Price:    ₹${result.quote.shown}`));
    console.log(chalk.white(`   Stock:    ${result.quote.stock} units`));
    console.log(chalk.white(`   Currency: ${result.quote.currency}`));
    console.log(chalk.white(`   Latency:  ${result.responseTimeMs}ms`));

    // Record honest scrape log into database
    await db.addScrapeLog({
      productId,
      engine: 'playwright-headed',
      status: 'success',
      attempts: 1,
      responseTimeMs: result.responseTimeMs,
      httpStatus: 200,
      rawQuote: result.quote
    });

    // Update tracked product if exists
    const tracked = await db.getTrackedProductById(productId);
    if (tracked) {
      await db.updateTrackedProduct(productId, {
        current_price: result.quote.shown,
        current_stock: result.quote.stock,
        last_scraped_at: new Date().toISOString()
      });
      await db.addPriceHistory({
        productId,
        price: result.quote.shown,
        stock: result.quote.stock,
        currency: result.quote.currency
      });
      console.log(chalk.green(`💾 Synchronized into Database successfully.`));
    }

  } catch (err) {
    console.error(chalk.bold.red(`\n💥 Scraper Run Failed: ${err.message}`));
    await db.addScrapeLog({
      productId,
      engine: 'playwright-headed',
      status: 'failed',
      attempts: 1,
      responseTimeMs: 0,
      httpStatus: 500,
      errorMessage: err.message
    });
    process.exit(1);
  }
}

main();
