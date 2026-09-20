const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

export const api = {
  async searchCatalog(query = '', page = 1, pageSize = 12) {
    const res = await fetch(`${API_BASE}/catalog/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error('Failed to search catalog');
    return res.json();
  },

  async getProductSpecs(id) {
    const res = await fetch(`${API_BASE}/catalog/product/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product specs');
    return res.json();
  },

  async getTrackedProducts() {
    const res = await fetch(`${API_BASE}/products/tracked`);
    if (!res.ok) throw new Error('Failed to load tracked products');
    return res.json();
  },

  async trackProduct(productData) {
    const res = await fetch(`${API_BASE}/products/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (!res.ok) throw new Error('Failed to track product');
    return res.json();
  },

  async untrackProduct(productId) {
    const res = await fetch(`${API_BASE}/products/track/${productId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to untrack product');
    return res.json();
  },

  async updateTracking(productId, data) {
    const res = await fetch(`${API_BASE}/products/track/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update tracking');
    return res.json();
  },

  async getPriceHistory(productId) {
    const res = await fetch(`${API_BASE}/products/${productId}/history`);
    if (!res.ok) throw new Error('Failed to load price history');
    return res.json();
  },

  async getScrapeLogs(productId) {
    const res = await fetch(`${API_BASE}/products/${productId}/logs`);
    if (!res.ok) throw new Error('Failed to load scrape logs');
    return res.json();
  },

  async triggerScrape(productId, engine = 'lightweight') {
    const res = await fetch(`${API_BASE}/products/${productId}/scrape?engine=${engine}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Manual scrape failed');
    return res.json();
  },

  async scrapeAllProducts(force = true) {
    const res = await fetch(`${API_BASE}/products/scrape-all?force=${force}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to refresh tracked products');
    return res.json();
  },

  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },

  async markAlertsRead() {
    const res = await fetch(`${API_BASE}/alerts/mark-read`, {
      method: 'POST'
    });
    return res.json();
  },

  async getSystemStats() {
    const res = await fetch(`${API_BASE}/system/stats`);
    if (!res.ok) throw new Error('Failed to load system stats');
    return res.json();
  },

  async getChangeDetection() {
    const res = await fetch(`${API_BASE}/system/change-detection`);
    if (!res.ok) throw new Error('Failed to check store integrity');
    return res.json();
  }
};
