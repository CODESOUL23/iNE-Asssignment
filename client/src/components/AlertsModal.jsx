import React from 'react';
import { X, TrendingDown, CheckCircle, Bell, AlertCircle } from 'lucide-react';

export function AlertsModal({ isOpen, onClose, alerts = [], onMarkRead }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2>Price & Stock Alerts</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Notifications generated automatically when prices drop or items restock
            </span>
            {alerts.some(a => !a.is_read) && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={onMarkRead}
                style={{ fontSize: '0.78rem' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alert, idx) => (
              <div
                key={alert.id || idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: alert.is_read ? 'var(--bg-app)' : 'rgba(59, 130, 246, 0.08)',
                  border: alert.is_read ? '1px solid var(--border-subtle)' : '1px solid var(--border-focus)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {alert.type === 'price_drop' && <TrendingDown size={18} style={{ color: 'var(--status-success)' }} />}
                  {alert.type === 'back_in_stock' && <CheckCircle size={18} style={{ color: 'var(--accent-primary)' }} />}
                  {alert.type === 'out_of_stock' && <AlertCircle size={18} style={{ color: 'var(--status-danger)' }} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {alert.title}
                    </div>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {alert.message}
                  </p>

                  {alert.tracked_products && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Product: {alert.tracked_products.name} ({alert.tracked_products.sku})
                    </div>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                No alerts yet. Alerts will appear here when tracked product prices drop or items restock.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
