import React from 'react';
import { Activity, Search, Bell, ShieldCheck, Package, Tag, Layers, Plus } from 'lucide-react';

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
  unreadAlertsCount
}) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Activity size={18} />
        </div>
        <div>
          <div className="sidebar-brand-name">PriceTracker</div>
          <div className="sidebar-brand-sub">INE Store Monitor</div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Filter products..."
          value={filterQuery}
          onChange={(e) => onFilterChange(e.target.value)}
        />
      </div>

      {/* Category Navigation */}
      <div>
        <div className="sidebar-section-title">Categories</div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-nav-item ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => onSelectCategory('ALL')}
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
              onClick={() => onSelectCategory(cat)}
            >
              <Tag size={14} />
              <span>{cat}</span>
              <span className="item-count">{categoryCounts[cat]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Actions at bottom */}
      <div className="sidebar-actions">
        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onOpenSearch}
          title="Track a new product"
        >
          <Plus size={15} />
          <span>Track New Product</span>
        </button>
        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onOpenAlerts}
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
          onClick={onOpenHealth}
        >
          <ShieldCheck size={15} />
          <span>Health Check</span>
        </button>
      </div>
    </aside>
  );
}
