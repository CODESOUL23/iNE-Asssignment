import { solveChallengeAndFetchPrice } from './scraper/lightweightSolver.js';

console.log('Testing Lightweight Challenge Solver against mock store...');

async function runTest() {
  try {
    const testId = 366;
    console.log(`Starting test for Product #${testId}...`);
    const result = await solveChallengeAndFetchPrice(testId);
    console.log('✅ Lightweight Solver Passed!');
    console.log('Quote:', result.quote);
    console.log('Latency:', result.responseTimeMs + 'ms');
  } catch (err) {
    console.error('❌ Lightweight Solver Failed:', err);
    process.exit(1);
  }
}

runTest();
