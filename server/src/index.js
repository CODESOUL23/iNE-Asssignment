import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { scrapeAllDueProducts } from './scraper/scraperService.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (or configured client URL)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint (used by cron-job.org / monitoring to keep Render instance warm)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ine-price-tracker-backend',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'INE Product Price Tracker Backend API is active.',
    health: '/api/health',
    docs: 'https://github.com/your-username/ine-price-tracker'
  });
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`INE Price Tracker Server running on port ${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`========================================================`);

  // Start background periodic scraping scheduler (checks every 60s for products due)
  const SCHEDULER_INTERVAL_MS = 60 * 1000;
  setInterval(async () => {
    try {
      const dueResult = await scrapeAllDueProducts({ force: false });
      if (dueResult.scrapedCount > 0) {
        console.log(`[Scheduler] Auto-scraped ${dueResult.scrapedCount} due product(s). New alerts: ${dueResult.alertsTriggered?.length || 0}`);
      }
    } catch (err) {
      console.error('[Scheduler] Periodic scrape check failed:', err.message);
    }
  }, SCHEDULER_INTERVAL_MS);
});
