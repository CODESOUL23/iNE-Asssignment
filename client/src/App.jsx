import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StatsBar } from './components/StatsBar';
import { ProductCard } from './components/ProductCard';
import { SearchModal } from './components/SearchModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AlertsModal } from './components/AlertsModal';
import { HealthModal } from './components/HealthModal';
import { api } from './services/api';
import { Plus, RefreshCw, LayoutGrid, Table, Trash2, BarChart3 } from 'lucide-react';

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleTrackSuccess = async () => {
    setIsSearchOpen(false);
    await loadDashboardData();
  };

  const handleMarkAlertsRead = async () => {
    await api.markAlertsRead();
    await loadDashboardData();
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  // Extract unique categories with counts
  const categoryCounts = {};
  trackedProducts.forEach(p => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });
  const categories = Object.keys(categoryCounts).sort();

  const filteredProducts = trackedProducts.filter(p => {
    const matchesQuery =
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <Sidebar
        categories={categories}
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        filterQuery={filterQuery}
        onFilterChange={setFilterQuery}
        totalTracked={trackedProducts.length}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenHealth={() => setIsHealthOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Bar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenHealth={() => setIsHealthOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onRefresh={loadDashboardData}
        />

        <div className="page-content">
          {/* Sticky Note KPI Grid */}
          <StatsBar stats={stats} />

          {/* Toolbar */}
          <div className="toolbar-section">
            <div className="toolbar-left">
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedCategory === 'ALL' ? 'All tracked products' : selectedCategory}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ({filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  <Table size={14} />
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadDashboardData}
                title="Refresh"
              >
                <RefreshCw size={13} />
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsSearchOpen(true)}
              >
                <Plus size={13} />
                <span>Track New</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 10px', display: 'block', color: 'var(--accent-ink)' }} />
              <div style={{ fontSize: '0.86rem' }}>Loading tracked catalog...</div>
            </div>
          ) : filteredProducts.length > 0 ? (
            viewMode === 'grid' ? (
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
              <div className="b2b-table-container">
                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Frequency</th>
                      <th>Last Scraped</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const hasPrice = product.current_price !== null && product.current_price !== undefined;
                      const isOutOfStock = product.current_stock === 0;
                      return (
                        <tr key={product.product_id} onClick={() => setSelectedProduct(product)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="card-sku-tag mono">{product.sku}</span>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.78rem' }}>{product.category}</td>
                          <td>
                            {hasPrice ? (
                              <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{Number(product.current_price).toLocaleString()}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                            )}
                          </td>
                          <td>
                            {isOutOfStock ? (
                              <span className="badge-tag badge-out-stock">Out of stock</span>
                            ) : (
                              <span className="badge-tag badge-in-stock">{product.current_stock || '—'} in stock</span>
                            )}
                          </td>
                          <td><span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Every {product.frequency_hours || 2}h</span></td>
                          <td><span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{product.last_scraped_at ? new Date(product.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedProduct(product)}>
                                <BarChart3 size={12} />
                              </button>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => handleScrapeNow(product.product_id)}>
                                <RefreshCw size={12} />
                              </button>
                              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => { if (confirm(`Remove "${product.name}"?`)) handleDelete(product.product_id); }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div style={{
              background: 'var(--bg-white)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '50px 24px',
              textAlign: 'center',
              maxWidth: '460px',
              margin: '30px auto'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {filterQuery ? 'No matching products' : 'Nothing tracked yet'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
                {filterQuery
                  ? `No products match "${filterQuery}".`
                  : 'Search the INE storefront and pin products here to track prices and stock levels.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsSearchOpen(true)}
              >
                <Plus size={14} />
                <span>Search & Track</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div>INE Software Engineer Intern Assignment · React & Node.js</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>demo.inelabteamdev.com</span>
            <span>·</span>
            <span>Lightweight PoW Solver</span>
          </div>
        </footer>
      </div>

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
