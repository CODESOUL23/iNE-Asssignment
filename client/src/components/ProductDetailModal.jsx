import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ExternalLink, Calendar, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
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
      setHistory(data);
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
      setLogs(data);
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
      alert('Scrape failed: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  if (!isOpen || !product) return null;

  // Render pure SVG Price Trend Chart
  const renderSvgChart = () => {
    if (history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          No historical price data points recorded yet. Trigger a scrape to log the first point.
        </div>
      );
    }

    if (history.length === 1) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>First data point recorded:</div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            ₹{Number(history[0].price).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {new Date(history[0].captured_at).toLocaleString()} · {history[0].stock} units in stock
          </div>
        </div>
      );
    }

    const prices = history.map(h => Number(h.price));
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const range = (maxPrice - minPrice) || 1;

    const width = 640;
    const height = 220;
    const paddingX = 40;
    const paddingY = 25;

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
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--border-subtle)" />

          {/* Labels */}
          <text x={paddingX - 6} y={paddingY + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
            ₹{Math.round(maxPrice)}
          </text>
          <text x={paddingX - 6} y={height - paddingY} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
            ₹{Math.round(minPrice)}
          </text>

          {/* Area under curve */}
          <path d={areaD} fill="url(#priceGradient)" />

          {/* Price Line */}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#090d16" stroke="#3b82f6" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="card-category">{product.category}</span>
              <span style={{ color: 'var(--border-strong)' }}>•</span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                SKU: {product.sku}
              </span>
            </div>
            <h2>{product.name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Brand: {product.brand} · ID #{product.product_id}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a 
              href={`https://demo.inelabteamdev.com/product/${product.product_id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={14} />
              <span>Open Store</span>
            </a>
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action & Scraping Toolbar */}
        <div style={{
          padding: '14px 24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Price</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {product.current_price ? `₹${Number(product.current_price).toLocaleString()}` : 'Pending'}
              </div>
            </div>
            <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock Status</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {product.current_stock === 0 ? (
                  <span style={{ color: 'var(--status-danger)' }}>Out of stock</span>
                ) : (
                  <span style={{ color: 'var(--status-success)' }}>{product.current_stock || 0} left</span>
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
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 10px',
                fontSize: '0.82rem'
              }}
            >
              <option value="lightweight">Engine: Lightweight (Fast)</option>
              <option value="playwright-headed">Engine: Playwright (Headed)</option>
            </select>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleManualScrape}
              disabled={isScraping}
            >
              <RefreshCw size={14} className={isScraping ? 'spin' : ''} />
              <span>{isScraping ? 'Scraping Store...' : 'Scrape Now'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'var(--bg-surface)'
        }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'chart' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'chart' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'chart' ? 700 : 500
            }}
            onClick={() => setActiveTab('chart')}
          >
            Price & Stock History
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'logs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'logs' ? 700 : 500
            }}
            onClick={() => setActiveTab('logs')}
          >
            Scrape Logs ({logs.length})
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: activeTab === 'specs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'specs' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'specs' ? 700 : 500
            }}
            onClick={() => setActiveTab('specs')}
          >
            Specifications
          </button>
        </div>

        {/* Modal Body Tabs */}
        <div className="modal-body">
          {activeTab === 'chart' && (
            <div>
              <div style={{ marginBottom: '24px', background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Price Fluctuations (Over Time)
                </h4>
                {renderSvgChart()}
              </div>

              <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Historical Captures Table
              </h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Captured At</th>
                      <th>Price</th>
                      <th>MRP</th>
                      <th>Stock Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: '0.78rem' }}>
                          {new Date(h.captured_at).toLocaleString()}
                        </td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{Number(h.price).toLocaleString()}
                        </td>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>
                          {h.mrp ? `₹${Number(h.mrp).toLocaleString()}` : '—'}
                        </td>
                        <td>
                          {h.stock === 0 ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : (
                            <span className="mono">{h.stock} left</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No price history recorded yet.
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
                <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Per-Product Scrape Attempts (Transparent Log)
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Honest audit trail of all successes, retries, and errors
                </span>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Engine</th>
                      <th>Outcome</th>
                      <th>Attempts</th>
                      <th>Latency</th>
                      <th>Details / Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: '0.78rem' }}>
                          {new Date(log.created_at).toLocaleTimeString()} ({new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {log.engine}
                          </span>
                        </td>
                        <td>
                          {log.status === 'success' && <span className="badge badge-success">Success</span>}
                          {log.status === 'retried' && <span className="badge badge-warning">Retried & Passed</span>}
                          {log.status === 'failed' && <span className="badge badge-danger">Failed</span>}
                        </td>
                        <td className="mono">
                          {log.attempts || 1} {log.attempts > 1 ? 'runs' : 'run'}
                        </td>
                        <td className="mono">
                          {log.response_time_ms}ms
                        </td>
                        <td style={{ fontSize: '0.8rem', color: log.error_message ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                          {log.error_message || (log.status === 'success' ? 'Price and stock extracted cleanly' : 'Recovered via backoff retry')}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No scrape attempts logged yet.
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
                  <p style={{ marginBottom: '20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {specs.description}
                  </p>

                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Technical Specifications
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {specs.specs && Object.entries(specs.specs).map(([key, val]) => (
                      <div key={key} style={{ padding: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading product specifications from store...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
