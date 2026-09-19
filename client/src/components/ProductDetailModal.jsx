import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, TrendingDown, TrendingUp, Cpu, Activity, BarChart3, Database } from 'lucide-react';
import { api } from '../services/api';

export function ProductDetailModal({ product, isOpen, onClose, onRefreshProduct }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'logs' | 'specs'
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [specs, setSpecs] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeEngine, setScrapeEngine] = useState('lightweight');

  useEffect(() => {
    if (!isOpen || !product) return;

    loadHistory();
    loadLogs();
    loadSpecs();
  }, [isOpen, product?.product_id]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getPriceHistory(product.product_id);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.getScrapeLogs(product.product_id);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadSpecs = async () => {
    try {
      const data = await api.getProductSpecs(product.product_id);
      setSpecs(data);
    } catch (err) {
      console.warn('Could not fetch specs:', err);
    }
  };

  const handleManualScrape = async () => {
    setIsScraping(true);
    try {
      await api.triggerScrape(product.product_id, scrapeEngine);
      await Promise.all([loadHistory(), loadLogs(), onRefreshProduct()]);
    } catch (err) {
      alert('Probe failed: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  if (!isOpen || !product) return null;

  // Render pure SVG Price Trend Chart with Warm Amber Palette
  const renderSvgChart = () => {
    if (history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          No historical price captures found. Click "Execute Scraper Probe" to record the first capture.
        </div>
      );
    }

    if (history.length === 1) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', background: '#faf6ee', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Baseline Data Point</div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-ink)', margin: '4px 0' }}>
            ₹{Number(history[0].price).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Captured {new Date(history[0].captured_at).toLocaleString()} · {history[0].stock} units in stock
          </div>
        </div>
      );
    }

    const prices = history.map(h => Number(h.price));
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const range = (maxPrice - minPrice) || 1;

    const width = 680;
    const height = 210;
    const paddingX = 48;
    const paddingY = 24;

    const points = history.map((item, idx) => {
      const x = paddingX + (idx / (history.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((Number(item.price) - minPrice) / range) * (height - paddingY * 2);
      return { x, y, ...item };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            {/* Ink Blue Gradient */}
            <linearGradient id="warmAmberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d5a80" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3d5a80" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--border-light)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="var(--border-light)" strokeDasharray="4 4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--border-light)" />

          {/* Monospaced Axis Labels */}
          <text x={paddingX - 8} y={paddingY + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
            ₹{Math.round(maxPrice)}
          </text>
          <text x={paddingX - 8} y={height - paddingY} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
            ₹{Math.round(minPrice)}
          </text>

          {/* Area fill */}
          <path d={areaD} fill="url(#warmAmberGradient)" />

          {/* Ink Line */}
          <path d={pathD} fill="none" stroke="#3d5a80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#fffdf9" stroke="#3d5a80" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-dialog-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="card-sku-tag mono">{product.sku}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{product.category}</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {product.name}
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {product.brand} · Internal Catalog ID #{product.product_id}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a 
              href={`https://demo.inelabteamdev.com/product/${product.product_id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open Mock Storefront Page"
            >
              <ExternalLink size={13} />
              <span>Storefront</span>
            </a>
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Live Status & Probe Trigger Toolbar */}
        <div style={{
          padding: '12px 24px',
          background: '#f3ede3',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Price</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {product.current_price ? `₹${Number(product.current_price).toLocaleString()}` : 'Awaiting'}
              </div>
            </div>
            <div style={{ height: '24px', width: '1px', background: 'var(--border-light)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Inventory Status</div>
              <div>
                {product.current_stock === 0 ? (
                  <span className="badge-tag badge-out-stock">Out of Stock</span>
                ) : (
                  <span className="badge-tag badge-in-stock">{product.current_stock || 0} Units In Stock</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={scrapeEngine}
              onChange={(e) => setScrapeEngine(e.target.value)}
              className="mono"
              style={{
                background: 'var(--bg-white)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <option value="lightweight">Engine: Lightweight PoW (150ms)</option>
              <option value="playwright-headed">Engine: Playwright Headed</option>
            </select>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleManualScrape}
              disabled={isScraping}
            >
              <RefreshCw size={13} className={isScraping ? 'spin' : ''} />
              <span>{isScraping ? 'Probing...' : 'Execute Probe'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 24px',
          background: 'var(--bg-white)'
        }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'chart' ? '2px solid var(--accent-ink)' : '2px solid transparent',
              color: activeTab === 'chart' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'chart' ? 700 : 500,
              fontSize: '0.8rem',
              height: '40px'
            }}
            onClick={() => setActiveTab('chart')}
          >
            Price Trends & Captures
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'logs' ? '2px solid var(--accent-ink)' : '2px solid transparent',
              color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'logs' ? 700 : 500,
              fontSize: '0.8rem',
              height: '40px'
            }}
            onClick={() => setActiveTab('logs')}
          >
            Scrape Audit Logs ({logs.length})
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'specs' ? '2px solid var(--accent-ink)' : '2px solid transparent',
              color: activeTab === 'specs' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'specs' ? 700 : 500,
              fontSize: '0.8rem',
              height: '40px'
            }}
            onClick={() => setActiveTab('specs')}
          >
            Store Specs
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-dialog-body">
          {activeTab === 'chart' && (
            <div>
              <div style={{
                marginBottom: '24px',
                background: '#faf6ee',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Price Curve Timeline
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {history.length} data point{history.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {renderSvgChart()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Recorded Points Registry
                </span>
              </div>

              <div className="b2b-table-container">
                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Capture Timestamp</th>
                      <th>Observed Price</th>
                      <th>Catalog MRP</th>
                      <th>Inventory Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: '0.78rem' }}>
                          {new Date(h.captured_at).toLocaleString()}
                        </td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-ink)' }}>
                          ₹{Number(h.price).toLocaleString()}
                        </td>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>
                          {h.mrp ? `₹${Number(h.mrp).toLocaleString()}` : '—'}
                        </td>
                        <td>
                          {h.stock === 0 ? (
                            <span className="badge-tag badge-out-stock">Out of Stock</span>
                          ) : (
                            <span className="mono" style={{ color: 'var(--text-primary)' }}>{h.stock} units</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No price history captured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Audit Trail of Execution Attempts
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tracks PoW challenges, network retries, and errors
                </span>
              </div>

              <div className="b2b-table-container">
                <table className="b2b-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Engine</th>
                      <th>Status</th>
                      <th>Attempts</th>
                      <th>Latency</th>
                      <th>Diagnostic Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: '0.78rem' }}>
                          {new Date(log.created_at).toLocaleTimeString()} ({new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                            {log.engine}
                          </span>
                        </td>
                        <td>
                          {log.status === 'success' && <span className="badge-tag badge-in-stock">Success</span>}
                          {log.status === 'retried' && <span className="badge-tag" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>Retried</span>}
                          {log.status === 'failed' && <span className="badge-tag badge-out-stock">Failed</span>}
                        </td>
                        <td className="mono">
                          {log.attempts || 1}
                        </td>
                        <td className="mono" style={{ color: 'var(--accent-ink)' }}>
                          {log.response_time_ms}ms
                        </td>
                        <td style={{ fontSize: '0.78rem', color: log.error_message ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                          {log.error_message || 'Price & inventory extracted cleanly'}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No audit entries logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              {specs ? (
                <div>
                  <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.88rem' }}>
                    {specs.description}
                  </p>

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Catalog Specifications
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {specs.specs && Object.entries(specs.specs).map(([key, val]) => (
                      <div key={key} style={{ padding: '12px', background: '#faf6ee', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading catalog specifications...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
