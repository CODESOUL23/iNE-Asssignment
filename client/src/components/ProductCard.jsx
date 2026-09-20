import React, { useState } from 'react';
import { RefreshCw, Trash2, ExternalLink, Clock, BarChart3, TrendingDown, CheckCircle } from 'lucide-react';

export function ProductCard({ product, alert, onSelect, onScrapeNow, onDelete, onUpdateFreq }) {
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async (e) => {
    e.stopPropagation();
    setIsScraping(true);
    try {
      await onScrapeNow(product.product_id);
    } finally {
      setIsScraping(false);
    }
  };

  const handleFreqChange = (e) => {
    e.stopPropagation();
    const newFreq = Number(e.target.value);
    onUpdateFreq(product.product_id, newFreq);
  };

  const hasPrice = product.current_price !== null && product.current_price !== undefined;
  const isOutOfStock = product.current_stock === 0;

  const discount = (product.mrp && product.current_price && product.mrp > product.current_price)
    ? Math.round(((product.mrp - product.current_price) / product.mrp) * 100)
    : null;

  const formattedTime = product.last_scraped_at
    ? new Date(product.last_scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className="product-b2b-card" onClick={() => onSelect(product)}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="card-sku-tag mono">{product.sku}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.category}</span>
          </div>

          <div style={{ display: 'flex', gap: '3px' }}>
            <a
              href={`https://demo.inelabteamdev.com/product/${product.product_id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => e.stopPropagation()}
              title="View on storefront"
              style={{ width: '26px', height: '26px' }}
            >
              <ExternalLink size={12} />
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove "${product.name}"?`)) onDelete(product.product_id);
              }}
              title="Stop tracking"
              style={{ width: '26px', height: '26px', color: 'var(--text-muted)' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <h3 className="card-title-text">{product.name}</h3>
        <p className="card-brand-text">{product.brand}</p>

        {alert && (
          <div className="card-alert-badge" title={alert.message}>
            {alert.type === 'price_drop' && <TrendingDown size={11} />}
            {alert.type === 'back_in_stock' && <CheckCircle size={11} />}
            <span>{alert.title}</span>
          </div>
        )}

        <div className="price-metric-box">
          <div>
            <div className="price-label">Current Price</div>
            {hasPrice ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="price-val mono">₹{Number(product.current_price).toLocaleString()}</span>
                {product.mrp && product.mrp > product.current_price && (
                  <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{Number(product.mrp).toLocaleString()}
                  </span>
                )}
                {discount && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-success)' }}>
                    -{discount}%
                  </span>
                )}
              </div>
            ) : (
              <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Pending...
              </div>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="badge-tag badge-out-stock">Out of Stock</span>
            ) : (
              <span className="badge-tag badge-in-stock">
                {product.current_stock ? `${product.current_stock} in stock` : 'In Stock'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.73rem',
          color: 'var(--text-muted)',
          paddingTop: '8px',
          borderTop: '1px dashed var(--border-light)',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            <span>{formattedTime}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Every</span>
            <select
              value={product.frequency_hours || 2}
              onChange={handleFreqChange}
              onClick={(e) => e.stopPropagation()}
              className="mono"
              style={{
                background: 'var(--bg-white)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '2px',
                padding: '1px 4px',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              <option value="1">1h</option>
              <option value="2">2h</option>
              <option value="6">6h</option>
              <option value="12">12h</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onSelect(product); }}
          >
            <BarChart3 size={12} />
            <span>Details</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleScrape}
            disabled={isScraping}
          >
            <RefreshCw size={12} className={isScraping ? 'spin' : ''} />
            <span>{isScraping ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
