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
import { Plus, RefreshCw, LayoutGrid, Table, Trash2, BarChart3, Check, Bell, TrendingDown, CheckCircle } from 'lucide-react';

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

      // If any tracked product hasn't been scraped yet, quietly auto-sync in background
      const unscraped = (productsData || []).filter(p => !p.last_scraped_at);
      if (unscraped.length > 0) {
        api.scrapeAllProducts(false).then(() => {
          Promise.all([
            api.getTrackedProducts(),
            api.getSystemStats(),
            api.getAlerts()
          ]).then(([prods, st, alt]) => {
            setTrackedProducts(prods || []);
            setStats(st || null);
            setAlerts(alt || []);
          });
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(prev => (prev === message ? null : prev));
    }, 3200);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      showToast('Scraping latest live storefront prices & stock...');
      const scrapeResult = await api.scrapeAllProducts(true);
      await loadDashboardData();

      const newAlerts = scrapeResult.alertsTriggered || [];
      if (newAlerts.length > 0) {
        showToast(`🔔 ${newAlerts.length} new alert(s) detected!`);
      } else {
        showToast(`Synced ${scrapeResult.scrapedCount || 0} product(s) — all prices up to date`);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      await loadDashboardData().catch(() => {});
      showToast('Failed to sync: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleScrapeNow = async (productId) => {
    await api.triggerScrape(productId, 'lightweight');
    await loadDashboardData();
    showToast('Product re-scraped and updated');
  };

  const handleDelete = async (productId) => {
    await api.untrackProduct(productId);
    await loadDashboardData();
    if (selectedProduct?.product_id === productId) {
      setSelectedProduct(null);
    }
    showToast('Product removed from tracking');
  };

  const handleUpdateFreq = async (productId, frequencyHours) => {
    await api.updateTracking(productId, { frequency_hours: frequencyHours });
    await loadDashboardData();
    showToast(`Scrape frequency set to every ${frequencyHours} hours`);
  };

  const handleTrackSuccess = async (productId) => {
    setIsSearchOpen(false);
    showToast('Product tracked successfully!');
    await loadDashboardData();
  };

  const handleMarkAlertsRead = async () => {
    await api.markAlertsRead();
    await loadDashboardData();
    showToast('All alerts marked as read');
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
      {/* Left Sidebar (Desktop fixed + Mobile slide-over drawer) */}
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
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Bar */}
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenHealth={() => setIsHealthOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        <div className="page-content">
          {/* Quick-Scroll Category Pills (visible on mobile/tablet for instant category access) */}
          <div className="category-scroll-container">
            <button
              type="button"
              className={`category-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All Products ({trackedProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({categoryCounts[cat]})
              </button>
            ))}
          </div>

          {/* Sticky Note KPI Grid */}
          <StatsBar stats={stats} />

          {/* Active Alerts Banner */}
          {unreadAlertsCount > 0 && (
            <div className="alerts-banner" onClick={() => setIsAlertsOpen(true)}>
              <div className="alerts-banner-content">
                <Bell size={18} className="alerts-banner-icon" />
                <div>
                  <div className="alerts-banner-title">
                    {unreadAlertsCount} New Price & Inventory Alert{unreadAlertsCount > 1 ? 's' : ''} Detected!
                  </div>
                  <div className="alerts-banner-desc">
                    {alerts.find(a => !a.is_read)?.title}: {alerts.find(a => !a.is_read)?.message}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAlertsOpen(true);
                }}
                style={{ flexShrink: 0, fontWeight: 600 }}
              >
                Review Alerts ({unreadAlertsCount})
              </button>
            </div>
          )}

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
                className="btn btn-primary btn-sm"
                onClick={() => setIsSearchOpen(true)}
                title="Track a new product"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
                    alert={alerts.find(a => a.product_id === product.product_id && !a.is_read)}
                    onSelect={(prod) => setSelectedProduct(prod)}
                    onScrapeNow={handleScrapeNow}
                    onDelete={handleDelete}
                    onUpdateFreq={handleUpdateFreq}
                  />
                ))}
              </div>
            ) : (
              <div className="b2b-table-container">
                <div className="mobile-table-hint">
                  Swipe horizontally to view full metrics →
                </div>
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
                      const productAlert = alerts.find(a => a.product_id === product.product_id && !a.is_read);
                      return (
                        <tr key={product.product_id} onClick={() => setSelectedProduct(product)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="card-sku-tag mono">{product.sku}</span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</span>
                                  {productAlert && (
                                    <span className="card-alert-badge" style={{ margin: 0, padding: '1px 5px', fontSize: '0.65rem' }}>
                                      {productAlert.type === 'price_drop' && <TrendingDown size={10} />}
                                      {productAlert.type === 'back_in_stock' && <CheckCircle size={10} />}
                                      <span>{productAlert.title}</span>
                                    </span>
                                  )}
                                </div>
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

      {/* Floating Status Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--text-primary)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-modal)',
          fontSize: '0.84rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Check size={16} style={{ color: 'var(--status-success)' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
