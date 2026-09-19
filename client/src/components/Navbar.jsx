import React from 'react';
import { Bell, ShieldCheck, RefreshCw } from 'lucide-react';

export function Navbar({ onOpenSearch, onOpenAlerts, onOpenHealth, unreadAlertsCount = 0, onRefresh }) {
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
          className="btn btn-ghost btn-sm"
          onClick={onOpenSearch}
          style={{ gap: '4px', color: 'var(--text-muted)' }}
        >
          <span style={{ fontSize: '0.78rem' }}>Search</span>
          <kbd style={{
            background: '#eee8dc',
            border: '1px solid var(--border-light)',
            borderRadius: '2px',
            padding: '1px 5px',
            fontSize: '0.66rem',
            color: 'var(--text-muted)',
          }}>
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onOpenHealth}
          title="Health diagnostics"
        >
          <ShieldCheck size={16} />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onOpenAlerts}
          title="Alerts"
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {unreadAlertsCount > 0 && <span className="notification-badge-dot" />}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          title="Refresh data"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </header>
  );
}
