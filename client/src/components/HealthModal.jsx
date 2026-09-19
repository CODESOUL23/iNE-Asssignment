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
      <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--status-success)' }} />
            <h2>Store Schema & Change Detection</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Continuously audits INE Mock Storefront APIs to detect schema shifts, missing challenge properties, or DOM alterations.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <div style={{ color: 'var(--text-muted)' }}>Probing mock store endpoints...</div>
            </div>
          ) : report ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: report.healthy ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${report.healthy ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {report.healthy ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--status-success)' }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: 'var(--status-danger)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {report.healthy ? 'All Storefront APIs Healthy' : 'Potential Schema Shift Detected'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Last verified: {new Date(report.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Catalog Endpoint (/api/catalog)</td>
                      <td>
                        {report.checks?.catalogApiHealthy ? (
                          <span className="badge badge-success">Operational</span>
                        ) : (
                          <span className="badge badge-danger">Unhealthy</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Challenge Endpoint (/api/challenge)</td>
                      <td>
                        {report.checks?.challengeApiHealthy ? (
                          <span className="badge badge-success">Operational</span>
                        ) : (
                          <span className="badge badge-danger">Unhealthy</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Layout Endpoint (/api/layout)</td>
                      <td>
                        {report.checks?.layoutApiHealthy ? (
                          <span className="badge badge-success">Operational</span>
                        ) : (
                          <span className="badge badge-danger">Unhealthy</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {report.checks?.details?.length > 0 && (
                <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Diagnostics:</div>
                  {report.checks.details.map((d, i) => (
                    <div key={i}>• {d}</div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={checkIntegrity}
                style={{ alignSelf: 'flex-start', marginTop: '8px' }}
              >
                <RefreshCw size={14} />
                <span>Re-run Integrity Probe</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
