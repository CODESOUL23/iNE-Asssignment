import React from 'react';
import { Bell, ShieldCheck, RefreshCw, Menu, Search } from 'lucide-react';

export function Navbar({
  onOpenSearch,
  onOpenAlerts,
  onOpenHealth,
  unreadAlertsCount = 0,
  onRefresh,
  isRefreshing = false,
  onToggleSidebar
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="btn btn-secondary btn-icon mobile-menu-toggle"
            onClick={onToggleSidebar}
            title="Open category menu"
            aria-label="Open category navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <span className="topbar-title">Dashboard</span>
        <div className="status-pill">
          <span className="status-dot-pulse" />
          <span className="status-pill-text">Scraper Active</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-secondary topbar-search-btn"
          onClick={onOpenSearch}
          title="Search or track product (⌘K)"
        >
          <Search size={15} className="topbar-search-icon" />
          <span className="desktop-search-text" style={{ fontSize: '0.82rem' }}>Search</span>
          <kbd className="desktop-search-kbd" style={{
            background: '#eee8dc',
            border: '1px solid var(--border-light)',
            borderRadius: '3px',
            padding: '2px 6px',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onOpenHealth}
          title="System Health & Diagnostics"
          style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ShieldCheck size={19} />
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onOpenAlerts}
          title={`Alerts (${unreadAlertsCount} unread)`}
          style={{ position: 'relative', width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={19} />
          {unreadAlertsCount > 0 && (
            <span
              className="notification-badge-dot"
              style={{
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                boxShadow: '0 0 0 2px var(--bg-white)'
              }}
            />
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary topbar-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh dashboard data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span className="btn-label-responsive" style={{ fontSize: '0.82rem' }}>
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </span>
        </button>
      </div>
    </header>
  );
}
