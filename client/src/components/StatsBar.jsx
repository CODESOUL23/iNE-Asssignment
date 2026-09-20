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
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Tracked</span>
          <Package size={15} />
        </div>
        <div className="kpi-body">
          <div className="kpi-number">{totalTracked}</div>
          <span className="kpi-badge">Live</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>In Stock</span>
          <CheckCircle2 size={15} />
        </div>
        <div className="kpi-body">
          <div className="kpi-number">{inStock}</div>
          <span className="kpi-badge">
            {totalTracked > 0 ? `${Math.round((inStock / totalTracked) * 100)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Stockouts</span>
          <AlertTriangle size={15} />
        </div>
        <div className="kpi-body">
          <div className="kpi-number">{outOfStock}</div>
          <span className="kpi-badge">
            {outOfStock > 0 ? 'Alert' : 'Clear'}
          </span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Solver</span>
          <Cpu size={15} />
        </div>
        <div className="kpi-body">
          <div className="kpi-number">{recentReliabilityRate}%</div>
          <span className="kpi-badge">~150ms</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Storage</span>
          <Database size={15} />
        </div>
        <div className="kpi-body">
          <div className="kpi-number" style={{ fontSize: '1.4rem' }}>
            {isSupabaseActive ? 'PG' : 'Local'}
          </div>
          <span className="kpi-badge">
            {isSupabaseActive ? 'Supabase' : 'JSON'}
          </span>
        </div>
      </div>
    </div>
  );
}
