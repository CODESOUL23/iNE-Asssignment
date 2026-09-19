import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export function HealthModal({ isOpen, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkIntegrity();
    }
  }, [isOpen]);

  const checkIntegrity = async () => {
    setLoading(true);
    try {
      const data = await api.getChangeDetection();
      setReport(data);
    } catch (err) {
      console.error('Change detection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-success-bg)',
              border: '1px solid #a5d6a7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-success)'
            }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Health Check
              </h2>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-dialog-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '18px', lineHeight: 1.5 }}>
            Automated integrity probes against the remote mock storefront verify PoW handshake endpoints, layout changes, and data contract invariants.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px' }}>
              <RefreshCw size={22} className="spin" style={{ color: 'var(--accent-ink)', margin: '0 auto 10px', display: 'block' }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Running live diagnostic probe...</div>
            </div>
          ) : report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: report.healthy ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${report.healthy ? '#a5d6a7' : '#ef9a9a'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {report.healthy ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {report.healthy ? 'Target Storefront APIs Operational' : 'Storefront Schema Drift Flagged'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Last verified: {new Date(report.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="b2b-table-container">
                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Endpoint / Contract</th>
                      <th>Operational State</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Catalog Endpoint (<span className="mono">/api/catalog</span>)</td>
                      <td>
                        {report.checks?.catalogApiHealthy ? (
                          <span className="badge-tag badge-in-stock">Operational</span>
                        ) : (
                          <span className="badge-tag badge-out-stock">Unreachable</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>PoW Challenge Handshake (<span className="mono">/api/challenge</span>)</td>
                      <td>
                        {report.checks?.challengeApiHealthy ? (
                          <span className="badge-tag badge-in-stock">Operational</span>
                        ) : (
                          <span className="badge-tag badge-out-stock">Unreachable</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Layout Endpoint (<span className="mono">/api/layout</span>)</td>
                      <td>
                        {report.checks?.layoutApiHealthy ? (
                          <span className="badge-tag badge-in-stock">Operational</span>
                        ) : (
                          <span className="badge-tag badge-out-stock">Unreachable</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {report.checks?.details?.length > 0 && (
                <div style={{ padding: '12px 14px', background: '#faf6ee', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Probing Diagnostics:</div>
                  {report.checks.details.map((d, i) => (
                    <div key={i} style={{ marginBottom: '2px' }}>• {d}</div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={checkIntegrity}
                style={{ alignSelf: 'flex-start' }}
              >
                <RefreshCw size={13} />
                <span>Re-run Diagnostics</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
