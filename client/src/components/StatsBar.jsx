import React from 'react';
import { Package, CheckCircle2, AlertTriangle, Cpu, Database } from 'lucide-react';

export function StatsBar({ stats }) {
  const {
    totalTracked = 0,
    inStock = 0,
    outOfStock = 0,
    recentReliabilityRate = 100,
    isSupabaseActive = false
  } = stats || {};

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">
          <span>Tracked Products</span>
          <Package size={16} className="text-muted" />
        </div>
        <div className="stat-value mono">{totalTracked}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          <span>In Stock</span>
          <CheckCircle2 size={16} style={{ color: 'var(--status-success)' }} />
        </div>
        <div className="stat-value mono" style={{ color: 'var(--status-success)' }}>
          {inStock}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          <span>Out of Stock</span>
          <AlertTriangle size={16} style={{ color: outOfStock > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }} />
        </div>
        <div className="stat-value mono" style={{ color: outOfStock > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
          {outOfStock}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          <span>Scraper Reliability</span>
          <Cpu size={16} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div className="stat-value mono" style={{ color: 'var(--accent-primary)' }}>
          {recentReliabilityRate}%
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">
          <span>Database Engine</span>
          <Database size={16} className="text-muted" />
        </div>
        <div className="stat-value" style={{ fontSize: '1.1rem', paddingTop: '10px' }}>
          {isSupabaseActive ? (
            <span style={{ color: 'var(--status-success)' }}>Supabase (PostgreSQL)</span>
          ) : (
            <span style={{ color: 'var(--status-warning)' }}>Local Storage Active</span>
          )}
        </div>
      </div>
    </div>
  );
}
