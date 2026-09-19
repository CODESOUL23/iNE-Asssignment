import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, Plus } from 'lucide-react';
import { api } from '../services/api';

export function SearchModal({ isOpen, onClose, onTrackSuccess, trackedProductIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const fetchProducts = async (q) => {
    setLoading(true);
    try {
      const data = await api.searchCatalog(q, 1, 15);
      setResults(data.items || []);
    } catch (err) {
      console.error('Catalog search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (product) => {
    setTrackingId(product.id);
    try {
      await api.trackProduct({
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        slug: product.slug,
        frequency_hours: 2
      });
      onTrackSuccess(product.id);
    } catch (err) {
      alert('Failed to track product: ' + err.message);
    } finally {
      setTrackingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Search INE Storefront</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Search by full or partial product name, brand, SKU, or category
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="e.g. Solar Charger, Vantablack, VAN-10366..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && (
              <Loader2 
                size={18} 
                className="spin" 
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((product) => {
              const isAlreadyTracked = trackedProductIds.includes(product.id);
              const isProcessing = trackingId === product.id;

              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span className="card-category" style={{ fontSize: '0.68rem' }}>{product.category}</span>
                      <span style={{ color: 'var(--border-strong)' }}>•</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        SKU: {product.sku}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {product.brand}
                    </div>
                  </div>

                  <div>
                    {isAlreadyTracked ? (
                      <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                        <Check size={12} style={{ marginRight: '4px' }} />
                        Tracked
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTrack(product)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        <span>{isProcessing ? 'Adding...' : 'Track'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No products found matching "{query}". Try another term.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
