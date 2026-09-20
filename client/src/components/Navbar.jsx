import React from 'react';
import { Bell, ShieldCheck, RefreshCw } from 'lucide-react';

export function Navbar({
  onOpenSearch,
  onOpenAlerts,
  onOpenHealth,
  unreadAlertsCount = 0,
  onRefresh,
  isRefreshing = false
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Dashboard</span>
        <div className="status-pill">
          <span className="status-dot-pulse" />
          <span>Scraper Active</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenSearch}
          style={{ gap: '6px', color: 'var(--text-secondary)', height: '36px', padding: '0 12px' }}
          title="Search or track product (⌘K)"
        >
          <span style={{ fontSize: '0.82rem' }}>Search</span>
          <kbd style={{
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
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh dashboard data"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px' }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span style={{ fontSize: '0.82rem' }}>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
