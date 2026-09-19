import React from 'react';
import { Plus, Bell, ShieldCheck, Activity } from 'lucide-react';

export function Navbar({ onOpenSearch, onOpenAlerts, onOpenHealth, unreadAlertsCount = 0 }) {
  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div>
            <div className="brand-title">
              <span>PriceTracker</span>
              <span className="brand-badge">INE Store</span>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <button 
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onOpenHealth}
            title="System & Store Integrity Health"
          >
            <ShieldCheck size={18} />
          </button>

          <button 
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onOpenAlerts}
            title="Price & Stock Alerts"
          >
            <Bell size={18} />
            {unreadAlertsCount > 0 && <span className="notification-dot" />}
          </button>

          <button 
            type="button"
            className="btn btn-primary"
            onClick={onOpenSearch}
          >
            <Plus size={16} />
            <span>Track New Product</span>
          </button>
        </div>
      </div>
    </header>
  );
}
