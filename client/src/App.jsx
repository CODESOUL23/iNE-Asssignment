import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { ProductCard } from './components/ProductCard';
import { SearchModal } from './components/SearchModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AlertsModal } from './components/AlertsModal';
import { HealthModal } from './components/HealthModal';
import { api } from './services/api';
import { Plus, RefreshCw, Search, PackageOpen } from 'lucide-react';

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [productsData, statsData, alertsData] = await Promise.all([
        api.getTrackedProducts(),
        api.getSystemStats(),
        api.getAlerts()
      ]);
      setTrackedProducts(productsData || []);
      setStats(statsData || null);
      setAlerts(alertsData || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeNow = async (productId) => {
    await api.triggerScrape(productId, 'lightweight');
    await loadDashboardData();
  };

  const handleDelete = async (productId) => {
    await api.untrackProduct(productId);
    await loadDashboardData();
    if (selectedProduct?.product_id === productId) {
      setSelectedProduct(null);
    }
  };

  const handleUpdateFreq = async (productId, frequencyHours) => {
    await api.updateTracking(productId, { frequency_hours: frequencyHours });
    await loadDashboardData();
  };

  const handleTrackSuccess = async (productId) => {
    setIsSearchOpen(false);
    await loadDashboardData();
  };

  const handleMarkAlertsRead = async () => {
    await api.markAlertsRead();
    await loadDashboardData();
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  const filteredProducts = trackedProducts.filter(p => 
    p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
      />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        <StatsBar stats={stats} />

        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h2>Tracked Store Shelves</h2>
            <p className="dashboard-subtitle">
              Automated scheduled tracking against INE Mock Storefront with honest attempt logging
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter tracked items..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px 8px 36px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={loadDashboardData}
              title="Refresh dashboard"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--accent-primary)' }} />
            Loading tracked products...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
                onScrapeNow={handleScrapeNow}
                onDelete={handleDelete}
                onUpdateFreq={handleUpdateFreq}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PackageOpen className="empty-icon" />
            <h3 className="empty-title">
              {filterQuery ? 'No matching tracked products' : 'No products being tracked yet'}
            </h3>
            <p className="empty-desc">
              {filterQuery 
                ? `No products found matching "${filterQuery}". Clear the search or track a new product.`
                : 'Search the INE mock store to pick products and start recording price and stock trends on schedule.'}
            </p>
            {!filterQuery && (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setIsSearchOpen(true)}
                style={{ marginTop: '8px' }}
              >
                <Plus size={16} />
                <span>Search & Track Product</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 0',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-glass)'
      }}>
        <div className="container">
          INE Software Engineer Intern Assignment · Built with React & Node.js · Targeted for Vercel & Render
        </div>
      </footer>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onTrackSuccess={handleTrackSuccess}
        trackedProductIds={trackedProducts.map(p => p.product_id)}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onRefreshProduct={loadDashboardData}
      />

      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onMarkRead={handleMarkAlertsRead}
      />

      <HealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />
    </div>
  );
}
