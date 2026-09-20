# PriceTracker Pro — Resilient E-Commerce Web Scraper & Analytics

> **INE Software Engineer Intern Assignment: Product Price Tracker**  
> Full-Stack Web Application for Automated, Scheduled Web Scraping and Price Trend Analytics.  
> Target Store: `https://demo.inelabteamdev.com/`

---

## Live Demo & Links

- **Hosted Web App (Vercel)**: `https://ine-asssignment.vercel.app` *(Replace with your deployed URL)*
- **GitHub Repository**: `https://github.com/CODESOUL23/iNE-Asssignment`

---

## Key Features & Highlights

1. **Dual-Engine Scraping Architecture**:
   - **Production Lightweight Engine**: Reverse-engineered cryptographic challenge solver (WASM + Proof-of-Work nonce search + synthetic attestation + XOR decryptor) running in pure Node.js in **<150ms** with **<45MB RAM**. Optimized for Render's 512MB free-tier without sleeping or OOM crashes.
   - **Observable Headed Playwright Engine**: Visual runner with smooth mouse movements satisfying dwell criteria (`minMoves: 8`, `minDwellMs: 600`), handling synthetic click drops (`Xn`), and observing spinner transitions on screen.
2. **Scheduled Scraping & Free-Tier Resilience**:
   - Free-tier Render instances sleep when idle. Scrapes are triggered via an external webhook (`POST /api/cron/scrape`) on `cron-job.org` every 2 hours, waking the container and ensuring reliable unattended execution.
3. **Honest History & Failure Transparency**:
   - Every scrape attempt (success, retried, or failed) is recorded in PostgreSQL with timestamp, duration, attempt count, and raw diagnostics. Failures are never hidden.
4. **Interactive Dashboard**:
   - Instant search across 1,000+ mock store products by full or partial name, brand, or SKU.
   - Interactive SVG time-series price fluctuation and stock charts.
   - Real-time "Scrape Now" triggers.
   - Price drop and back-in-stock alert notifications.
   - Continuous store schema & integrity change detection.

---

## Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Custom Design Tokens & Vanilla CSS (Dark/Light responsive)
- **Backend**: Node.js (v20+), Express, `@supabase/supabase-js`, `dotenv`, `cors`, `playwright`
- **Database**: Supabase (PostgreSQL) with automatic local persistent fallback
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server | `5000` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon public API key | `eyJhbGciOi...` |
| `CRON_SECRET` | Secret token protecting the cron endpoint | `super-secret-cron-token-ine-2026` |
| `MOCK_STORE_URL` | Target mock storefront URL | `https://demo.inelabteamdev.com` |

### Frontend (`client/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL of the deployed Express backend | `https://ine-price-tracker-api.onrender.com` |

---

## Setup & Local Installation

### Prerequisites
- Node.js version 20 or later
- npm

### 1. Clone the repository
```bash
git clone https://github.com/CODESOUL23/iNE-Asssignment.git
cd iNE-Asssignment
```

### 2. Configure Database (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and run the script located at `docs/schema.sql`.
3. Copy your **Project URL** and **anon public key** from *Settings -> API*.
4. *(Optional)* If you do not have Supabase credentials yet, leave them blank in `server/.env`. The backend will automatically use its built-in persistent local storage.

### 3. Setup and Run Backend
```bash
cd server
npm install

# Test the reverse-engineered challenge solver
npm run test-solver

# Start the server
npm start
# Server will run at http://localhost:5000
```

### 4. Setup and Run Frontend
```bash
cd ../client
npm install
npm run dev
# Frontend will run at http://localhost:5173
```

---

## Observable (Headed) Run Demonstration

The assessment requires an observable run where the browser's behavior can be watched:

```bash
cd server
npm run headed -- --id 767 --slowmo 150
```

### What this demonstrates:
1. Launches visible Chromium.
2. Navigates to `https://demo.inelabteamdev.com/product/767`.
3. Simulates human mouse movement into the `.price-block` to satisfy `minMoves: 8`.
4. Dwells for >600ms until "Reveal price" unlocks.
5. Clicks the button, intercepts synthetic drops (`Xn`), observes the spinner, and extracts the revealed price and stock.
6. Synchronizes the result into the database and prints structured logs to the terminal.

---

## Scraping Schedule Configuration (cron-job.org)

Because Render free instances sleep after 15 minutes of inactivity:
1. Register a free account on [cron-job.org](https://cron-job.org).
2. Create a new cron job:
   - **Title**: `INE Price Tracker 2h Scraper`
   - **URL**: `https://<your-render-url>.onrender.com/api/cron/scrape`
   - **Schedule**: Every 2 hours (`0 */2 * * *`)
   - **Request Method**: `POST`
   - **Headers**:
     - `Authorization`: `Bearer super-secret-cron-token-ine-2026`
3. Optional: Create a 10-minute health ping to `GET https://<your-render-url>.onrender.com/api/health` to keep the backend warm.

---

## Verification & Automated Testing

- **Solver Verification**: `cd server && npm run test-solver`
- **Frontend Build**: `cd client && npm run build`
- **CI/CD**: Automatically runs on every git push via GitHub Actions.
