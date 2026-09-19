import React from 'react';
import { X, TrendingDown, CheckCircle, Bell, AlertCircle, Check } from 'lucide-react';

export function AlertsModal({ isOpen, onClose, alerts = [], onMarkRead }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(61, 90, 128, 0.1)',
              border: '1px solid rgba(61, 90, 128, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-ink)'
            }}>
              <Bell size={15} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Alerts
              </h2>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-dialog-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Events emitted on price changes and inventory fluctuations
            </span>
            {alerts.some(a => !a.is_read) && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onMarkRead}
                style={{ fontSize: '0.74rem' }}
              >
                <Check size={12} />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '440px', overflowY: 'auto' }}>
            {alerts.map((alert, idx) => (
              <div
                key={alert.id || idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: alert.is_read ? '#faf6ee' : 'var(--bg-white)',
                  border: alert.is_read ? '1px solid var(--border-light)' : '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {alert.type === 'price_drop' && <TrendingDown size={16} style={{ color: 'var(--status-success)' }} />}
                  {alert.type === 'back_in_stock' && <CheckCircle size={16} style={{ color: 'var(--accent-ink)' }} />}
                  {alert.type === 'out_of_stock' && <AlertCircle size={16} style={{ color: 'var(--status-danger)' }} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {alert.title}
                    </div>
                    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                    {alert.message}
                  </p>

                  {alert.tracked_products && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Target: {alert.tracked_products.name} ({alert.tracked_products.sku})
                    </div>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No active notifications. Signals will appear here when tracked item prices shift.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
