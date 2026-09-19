import React, { useState } from 'react';
import { RefreshCw, Trash2, ExternalLink, Clock, BarChart2 } from 'lucide-react';

export function ProductCard({ product, onSelect, onScrapeNow, onDelete, onUpdateFreq }) {
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
    <div className="product-card" onClick={() => onSelect(product)}>
      <div>
        <div className="card-top">
          <span className="card-category">{product.category}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <a 
              href={`https://demo.inelabteamdev.com/product/${product.product_id}`}
              target="_blank" 
              rel="noreferrer"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => e.stopPropagation()}
              title="Open in INE Store"
            >
              <ExternalLink size={14} />
            </a>
            <button 
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove "${product.name}" from tracker?`)) {
                  onDelete(product.product_id);
                }
              }}
              title="Stop tracking"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <h3 className="card-name">{product.name}</h3>
        <p className="card-brand">{product.brand} · SKU {product.sku}</p>

        <div className="price-stock-box">
          <div className="price-main">
            {hasPrice ? (
              <>
                <div className="price-current mono">
                  ₹{Number(product.current_price).toLocaleString()}
                </div>
                {product.mrp && (
                  <div className="price-mrp mono">
                    ₹{Number(product.mrp).toLocaleString()}
                    {discount && <span style={{ color: 'var(--status-success)', marginLeft: '6px' }}>{discount}% OFF</span>}
                  </div>
                )}
              </>
            ) : (
              <div className="price-current" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                Price pending...
              </div>
            )}
          </div>

          <div>
            {isOutOfStock ? (
              <span className="stock-badge out-of-stock">Out of Stock</span>
            ) : (
              <span className="stock-badge in-stock">
                {product.current_stock ? `${product.current_stock} in stock` : 'In Stock'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="card-meta-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} />
            <span>Last scraped: {formattedTime}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              value={product.frequency_hours || 2}
              onChange={handleFreqChange}
              onClick={(e) => e.stopPropagation()}
              className="mono"
              style={{
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '0.75rem'
              }}
            >
              <option value="1">Every 1h</option>
              <option value="2">Every 2h</option>
              <option value="6">Every 6h</option>
              <option value="12">Every 12h</option>
            </select>
          </div>
        </div>

        <div className="card-actions">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            style={{ flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
          >
            <BarChart2 size={14} />
            <span>History & Logs</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleScrape}
            disabled={isScraping}
            title="Trigger scrape now"
          >
            <RefreshCw size={14} className={isScraping ? 'spin' : ''} />
            <span>{isScraping ? 'Scraping...' : 'Scrape'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
