import React from 'react';
import { Activity, Search, Bell, ShieldCheck, Tag, Layers, Plus, X } from 'lucide-react';

export function Sidebar({
  categories,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  filterQuery,
  onFilterChange,
  totalTracked,
  onOpenSearch,
  onOpenAlerts,
  onOpenHealth,
  unreadAlertsCount,
  isOpen = false,
  onClose = () => {}
}) {
  const handleCategoryClick = (cat) => {
    onSelectCategory(cat);
    if (onClose) onClose();
  };

  const handleActionClick = (actionFn) => {
    actionFn();
    if (onClose) onClose();
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Activity size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-brand-name">PriceTracker</div>
            <div className="sidebar-brand-sub">INE Store Monitor</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm sidebar-close-btn"
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            placeholder="Filter products..."
            value={filterQuery}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>

        <div>
          <div className="sidebar-section-title">Categories</div>
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-item ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('ALL')}
            >
              <Layers size={15} />
              <span>All Products</span>
              <span className="item-count">{totalTracked}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`sidebar-nav-item ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                <Tag size={14} />
                <span>{cat}</span>
                <span className="item-count">{categoryCounts[cat]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-actions">
          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => handleActionClick(onOpenSearch)}
            title="Track a new product"
          >
            <Plus size={15} />
            <span>Track New Product</span>
          </button>
          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => handleActionClick(onOpenAlerts)}
            style={{ position: 'relative' }}
          >
            <Bell size={15} />
            <span>Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="item-count" style={{ background: '#fbe9e7', color: 'var(--accent-red)' }}>
                {unreadAlertsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => handleActionClick(onOpenHealth)}
          >
            <ShieldCheck size={15} />
            <span>Health Check</span>
          </button>
        </div>
      </aside>
    </>
  );
}
