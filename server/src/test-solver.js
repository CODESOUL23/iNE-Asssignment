import { scrapeProduct } from './scraper/scraperService.js';

console.log('Testing Lightweight Challenge Solver & Resilient Scraper...');

async function runTest() {
  const testId = 366;
  console.log(`Starting resilient scrape test for Product #${testId}...`);
  const result = await scrapeProduct(testId, { engine: 'lightweight', maxRetries: 3, skipDb: true });
  if (result.success) {
    console.log('[SUCCESS] Resilient Scraper Succeeded!');
    console.log(`Attempts used: ${result.attempts}`);
    console.log(`Outcome Status: ${result.status}`);
    console.log('Quote:', result.quote);
    console.log(`Latency: ${result.durationMs}ms`);
  } else {
    console.error('[ERROR] Scraper Failed after retries:', result.error);
    process.exit(1);
  }
}

runTest();
